import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.js";
import {
  normalizeIncomingLocation,
  toLocationCreateInput,
} from "../utils/location.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
  changePasswordBodySchema,
  addPasswordBodySchema,
  forgotPasswordBodySchema,
  googleLoginBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshTokenBodySchema,
  registerUserBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
  verifyPhoneCodeBodySchema,
} from "../utils/validation-schemas.js";
import { normalizePhoneNumber } from "../utils/phone.js";
import { assertRateLimit } from "../services/auth-rate-limit.service.js";
import {
  createEmailVerificationToken,
  createPhoneVerificationCode,
  createPasswordResetToken,
  findActiveEmailVerificationTokenByRawToken,
  findLatestActivePhoneVerificationCode,
  findActivePasswordResetTokenByRawToken,
} from "../services/auth-token.service.js";
import {
  sendEmailVerificationEmail,
  sendPasswordAddedSecurityEmail,
  sendPasswordChangedSecurityEmail,
  sendPasswordResetEmail,
  sendSuspiciousLoginSecurityEmail,
} from "../services/transactional-email.service.js";
import {
  checkPhoneVerificationCode,
  isTwilioVerifyMode,
  sendPhoneVerificationCode,
} from "../services/sms.service.js";
import { hashToken } from "../utils/token.js";
import {
  isGoogleSignInConfigured,
  verifyGoogleIdToken,
} from "../services/google.service.js";
import {
  ownerProfileQualificationInclude,
  publicProfileQualificationInclude,
  serializeProfileQualifications,
} from "../utils/profile-qualifications.js";
import { buildVerificationBadges } from "../utils/verification-badges.js";
import {
  issueSessionTokens,
  listUserSessions,
  revokeAllSessionsForUser,
  revokeSessionByRefreshToken,
  rotateRefreshToken,
} from "../services/session.service.js";
import {
  assertLoginAllowed,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from "../services/security-monitoring.service.js";
import { assertStrongPassword } from "../services/password-policy.service.js";

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for this email, we sent a password reset link.";
const EMAIL_VERIFICATION_SENT_MESSAGE =
  "Verification email sent. Please check your inbox.";
const PHONE_VERIFICATION_SENT_MESSAGE =
  "Verification code sent. Please check your phone.";
const PHONE_VERIFICATION_MAX_ATTEMPTS = Number(
  process.env.PHONE_VERIFICATION_MAX_ATTEMPTS || 5
);
const VERIFICATION_ATTEMPT_WINDOW_MINUTES = Number(
  process.env.VERIFICATION_ATTEMPT_WINDOW_MINUTES || 15
);
const VERIFICATION_ATTEMPT_WINDOW_MS =
  VERIFICATION_ATTEMPT_WINDOW_MINUTES * 60 * 1000;
const VERIFY_EMAIL_IP_RATE_LIMIT = Number(
  process.env.VERIFY_EMAIL_IP_RATE_LIMIT || 30
);
const VERIFY_EMAIL_TOKEN_RATE_LIMIT = Number(
  process.env.VERIFY_EMAIL_TOKEN_RATE_LIMIT || 15
);
const VERIFY_PHONE_IP_RATE_LIMIT = Number(
  process.env.VERIFY_PHONE_IP_RATE_LIMIT || 30
);
const VERIFY_PHONE_USER_RATE_LIMIT = Number(
  process.env.VERIFY_PHONE_USER_RATE_LIMIT || 30
);
const PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS = Number(
  process.env.PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS || 60
);
const PHONE_VERIFICATION_RESEND_COOLDOWN_MS =
  PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;

const getRequestIp = (req: Request) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown"
  ).toString();
};

const getRequestUserAgent = (req: Request) => req.headers["user-agent"];

const queueEmailVerification = async ({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) => {
  const { rawToken, expiresAt } = await createEmailVerificationToken(userId);

  await sendEmailVerificationEmail({
    email,
    token: rawToken,
    expiresAt,
  });
};

const queuePhoneVerification = async ({
  userId,
  phone,
}: {
  userId: string;
  phone: string;
}) => {
  if (isTwilioVerifyMode()) {
    await sendPhoneVerificationCode({ phone });
    return;
  }

  const { rawCode } = await createPhoneVerificationCode({
    userId,
    phone,
  });

  await sendPhoneVerificationCode({
    phone,
    code: rawCode,
  });
};

const buildPublicUserSelect = (): Prisma.UserModelSelect => ({
  id: true,
  email: true,
  phone: true,
  passwordHash: true,
  isVerified: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      id: true,
      userId: true,
      fullName: true,
      bio: true,
      dateOfBirth: true,
      gender: true,
      userType: true,
      rating: true,
      helpCount: true,
      totalReviews: true,
      avatarUrl: true,
      avatarPublicId: true,
      searchRadiusMeters: true,
      addressId: true,
      address: true,
      ...publicProfileQualificationInclude(),
      createdAt: true,
      updatedAt: true,
    },
  },
});

const sendResponse = (
  res: Response,
  {
    statusCode = 200,
    data = null,
    message = "",
    meta = {},
  }: {
    statusCode?: number;
    data?: unknown;
    message?: string;
    meta?: Record<string, unknown>;
  } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};



const getPublicUserById = async (userId: string) => {
  const user = await prisma.userModel.findUnique({
    where: { id: userId },
    select: buildPublicUserSelect(),
  });

  if (!user) {
    return null;
  }

  const { passwordHash, ...publicUser } = user;

  return {
    ...publicUser,
    verificationBadges: buildVerificationBadges({
      user: publicUser,
      profile: publicUser.profile,
    }),
    profile: publicUser.profile
      ? serializeProfileQualifications(publicUser.profile, { publicView: true })
      : null,
    hasPassword: Boolean(passwordHash),
  };
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const location = normalizeIncomingLocation(req.body as Record<string, unknown>);
  const parsedBody = registerUserBodySchema.safeParse(req.body);

  try {
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { email, password, phone, fullName, gender, dateOfBirth } = parsedBody.data;
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

    if (phone && !normalizedPhone) {
      return next(new AppError("Please enter a valid phone number", 400));
    }

    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    if (dateOfBirth && (!parsedDateOfBirth || Number.isNaN(parsedDateOfBirth.getTime()))) {
      return next(new AppError("Invalid dateOfBirth format. Use YYYY-MM-DD", 400));
    }

    const existingUser = await prisma.userModel.findFirst({
      where: {
        OR: normalizedPhone ? [{ email }, { phone: normalizedPhone }] : [{ email }],
      },
    });

    if (existingUser) {
      return next(new AppError("Email or phone already registered", 400));
    }

    await assertStrongPassword(password);
    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone: normalizedPhone ?? null,
        profile: {
          create: {
            fullName: fullName || email.split("@")[0],
            ...(gender ? { gender } : {}),
            ...(parsedDateOfBirth ? { dateOfBirth: parsedDateOfBirth } : {}),
            ...(location
              ? {
                address: {
                  create: toLocationCreateInput(location),
                },
              }
              : {}),
          },
        },
      },
    });
    const publicUser = await getPublicUserById(createdUser.id);

    if (!publicUser) {
      return next(new AppError("User not found after registration", 500));
    }


    const { accessToken: token, refreshToken } = await issueSessionTokens({
      userId: createdUser.id,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      invalidateAllExisting: true,
    });

    try {
      await queueEmailVerification({
        userId: createdUser.id,
        email,
      });
    } catch (error) {
      console.error("Failed to send verification email on registration:", error);
    }


    return sendResponse(res, {
      statusCode: 201,
      message: "User registered successfully. Please verify your email.",
      data: {
        user: publicUser,
        accessToken: token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    if (error instanceof AppError) {
      return next(error);
    }
    const prismaCode = (error as { code?: string })?.code;

    if (prismaCode === "P2002") {
      return next(new AppError("Email or phone already registered", 400));
    }

    if (error instanceof RangeError) {
      return next(new AppError("Invalid date value provided", 400));
    }

    next(new AppError("Failed to register user", 500));
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = forgotPasswordBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { email } = parsedBody.data;
    const ipAddress = getRequestIp(req);

    await assertRateLimit({
      bucket: "forgot-password:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset requests. Please try again later.",
    });
    await assertRateLimit({
      bucket: "forgot-password:email",
      key: email,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset requests. Please try again later.",
    });

    const user = await prisma.userModel.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      try {
        const { rawToken, expiresAt } = await createPasswordResetToken(user.id);

        await sendPasswordResetEmail({
          email: user.email,
          token: rawToken,
          expiresAt,
        });
      } catch (error) {
        console.error("Failed to create or send password reset email:", error);
      }
    }

    res.status(200).json({
      success: true,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
};


export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = loginBodySchema.safeParse(req.body);
    if (!parsedBody.success) return next(new AppError(getZodErrorMessage(parsedBody.error), 400));

    const { email, password } = parsedBody.data;
    const ipAddress = getRequestIp(req);
    const userAgent = getRequestUserAgent(req);

    await assertLoginAllowed({ email, ipAddress });

    // Find user by email for password check
    const user = await prisma.userModel.findUnique({ where: { email } });
    if (!user) {
      try {
        await recordFailedLoginAttempt({
          email,
          ipAddress,
          userAgent,
        });
      } catch (monitoringError) {
        console.error("Failed to record failed login attempt:", monitoringError);
      }

      const deletedAccount = await prisma.deletedAccount.findUnique({
        where: { email },
      });

      if (deletedAccount) {
        return next(
          new AppError(
            "This account was deleted. Please register again if you want to continue.",
            410
          )
        );
      }

      return next(new AppError("Invalid email or password", 401));
    }

    if (!user.passwordHash) {
      return next(new AppError("Use social login for this account", 400));
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      try {
        await recordFailedLoginAttempt({
          email,
          ipAddress,
          userAgent,
          userId: user.id,
        });
      } catch (monitoringError) {
        console.error("Failed to record failed login attempt:", monitoringError);
      }
      return next(new AppError("Invalid email or password", 401));
    }

    // Return a public user payload (without passwordHash) aligned with mobile contract
    const publicUser = await getPublicUserById(user.id);

    if (!publicUser) {
      return next(new AppError("User not found", 404));
    }

    const { accessToken: access, refreshToken: refresh } = await issueSessionTokens({
      userId: user.id,
      ipAddress,
      userAgent,
      invalidateAllExisting: false,
    });
    try {
      const loginSecurityResult = await recordSuccessfulLogin({
        userId: user.id,
        email,
        ipAddress,
        userAgent,
      });
      if (loginSecurityResult?.suspiciousLoginDetected) {
        await sendSuspiciousLoginSecurityEmail({
          email: user.email,
          ipAddress,
          previousIp: loginSecurityResult.previousIp,
        });
      }
    } catch (monitoringError) {
      console.error("Failed to record successful login event:", monitoringError);
    }

    return sendResponse(res, {
      statusCode: 200,
      message: "User logged in successfully",
      data: {
        user: publicUser,
        accessToken: access,
        refreshToken: refresh,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = resetPasswordBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { token, newPassword } = parsedBody.data;
    const ipAddress = getRequestIp(req);

    await assertStrongPassword(newPassword);

    await assertRateLimit({
      bucket: "reset-password:ip",
      key: ipAddress,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset attempts. Please try again later.",
    });
    await assertRateLimit({
      bucket: "reset-password:token",
      key: token,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset attempts. Please request a new reset link.",
    });

    const resetToken = await findActivePasswordResetTokenByRawToken(token);

    if (!resetToken) {
      return next(new AppError("Reset link is invalid or has expired", 400));
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const usedAt = new Date();

    await prisma.$transaction([
      prisma.userModel.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: {
            not: resetToken.id,
          },
        },
      }),
    ]);

    await revokeAllSessionsForUser(resetToken.userId, "PASSWORD_RESET");


    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

export const sendEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const ipAddress = getRequestIp(req);

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError("Email is already verified", 400));
    }

    await assertRateLimit({
      bucket: "send-email-verification:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification email requests. Please try again later.",
    });
    await assertRateLimit({
      bucket: "send-email-verification:user",
      key: user.id,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification email requests. Please try again later.",
    });

    await queueEmailVerification({
      userId: user.id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: EMAIL_VERIFICATION_SENT_MESSAGE,
    });
  } catch (error) {
    next(error);
  }
};

export const resendEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return sendEmailVerification(req, res, next);
};

const verifyEmailToken = async ({
  token,
  ipAddress,
}: {
  token: string;
  ipAddress: string;
}) => {
  await assertRateLimit({
    bucket: "verify-email:ip",
    key: ipAddress,
    limit: VERIFY_EMAIL_IP_RATE_LIMIT,
    windowMs: VERIFICATION_ATTEMPT_WINDOW_MS,
    message: "Too many verification attempts. Please try again later.",
  });
  await assertRateLimit({
    bucket: "verify-email:token",
    key: token,
    limit: VERIFY_EMAIL_TOKEN_RATE_LIMIT,
    windowMs: VERIFICATION_ATTEMPT_WINDOW_MS,
    message: "Too many verification attempts. Please request a new verification email.",
  });

  const verificationToken = await findActiveEmailVerificationTokenByRawToken(token);

  if (!verificationToken) {
    throw new AppError("Verification link is invalid or has expired", 400);
  }

  const usedAt = new Date();

  await prisma.$transaction([
    prisma.userModel.update({
      where: { id: verificationToken.userId },
      data: {
        isEmailVerified: true,
        isVerified: true,
      },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: {
        userId: verificationToken.userId,
        usedAt: null,
        id: {
          not: verificationToken.id,
        },
      },
    }),
  ]);

  return prisma.userModel.findUnique({
    where: { id: verificationToken.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          id: true,
          userId: true,
          fullName: true,
          bio: true,
          dateOfBirth: true,
          gender: true,
          userType: true,
          rating: true,
          helpCount: true,
          totalReviews: true,
          avatarUrl: true,
          addressId: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        } as any,
      },
    },
  });
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenFromQuery =
      typeof req.query?.token === "string" ? req.query.token : undefined;
    const tokenFromBody =
      typeof req.body?.token === "string" ? req.body.token : undefined;
    const incomingToken = tokenFromBody ?? tokenFromQuery;
    const parsedBody = verifyEmailBodySchema.safeParse({ token: incomingToken });

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const verifiedUser = await verifyEmailToken({
      token: parsedBody.data.token,
      ipAddress: getRequestIp(req),
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: verifiedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailFromLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      typeof req.query?.token === "string" ? req.query.token : undefined;
    const parsedBody = verifyEmailBodySchema.safeParse({ token });

    if (!parsedBody.success) {
      return res.status(400).send(`
        <html><body style="font-family: sans-serif; padding: 24px;">
          <h1>Verification failed</h1>
          <p>The verification link is invalid. Please request a new verification email.</p>
        </body></html>
      `);
    }

    await verifyEmailToken({
      token: parsedBody.data.token,
      ipAddress: getRequestIp(req),
    });

    return res.status(200).send(`
      <html><body style="font-family: sans-serif; padding: 24px;">
        <h1>Email verified</h1>
        <p>Your email is verified. You can return to the app now.</p>
      </body></html>
    `);
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Verification link is invalid or expired.";
    return res.status(400).send(`
      <html><body style="font-family: sans-serif; padding: 24px;">
        <h1>Verification failed</h1>
        <p>${message}</p>
      </body></html>
    `);
  }
};

export const sendPhoneCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const ipAddress = getRequestIp(req);

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        isPhoneVerified: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.phone) {
      return next(new AppError("Add a phone number before requesting a verification code", 400));
    }

    if (user.isPhoneVerified) {
      return next(new AppError("Phone number is already verified", 400));
    }

    await assertRateLimit({
      bucket: "send-phone-code:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification code requests. Please try again later.",
    });
    await assertRateLimit({
      bucket: "send-phone-code:user",
      key: user.id,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification code requests. Please try again later.",
    });
    await assertRateLimit({
      bucket: "send-phone-code:phone",
      key: user.phone,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification code requests. Please try again later.",
    });

    if (isTwilioVerifyMode()) {
      await assertRateLimit({
        bucket: "send-phone-code:cooldown",
        key: user.phone,
        limit: 1,
        windowMs: PHONE_VERIFICATION_RESEND_COOLDOWN_MS,
        message: "Please wait before requesting another verification code.",
      });
    } else {
      const latestCode = await prisma.phoneVerificationCode.findFirst({
        where: {
          userId: user.id,
          phone: user.phone,
          usedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (latestCode) {
        const resendAvailableAt =
          latestCode.createdAt.getTime() + PHONE_VERIFICATION_RESEND_COOLDOWN_MS;

        if (resendAvailableAt > Date.now()) {
          return next(
            new AppError(
              "Please wait before requesting another verification code.",
              429
            )
          );
        }
      }
    }

    await queuePhoneVerification({
      userId: user.id,
      phone: user.phone,
    });




    res.status(200).json({
      success: true,
      message: PHONE_VERIFICATION_SENT_MESSAGE,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    console.error("Failed to send phone verification code:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to send phone verification code";

    next(new AppError(message, 500));
  }
};

export const verifyPhoneCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const parsedBody = verifyPhoneCodeBodySchema.safeParse(req.body);
    const ipAddress = getRequestIp(req);

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { code } = parsedBody.data;

    const user = await prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            bio: true,
            dateOfBirth: true,
            gender: true,
            userType: true,
            rating: true,
            helpCount: true,
            totalReviews: true,
            avatarUrl: true,
            addressId: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          } as any,
        },
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.phone) {
      return next(new AppError("Add a phone number before verifying it", 400));
    }

    if (user.isPhoneVerified) {
      return next(new AppError("Phone number is already verified", 400));
    }

    await assertRateLimit({
      bucket: "verify-phone-code:ip",
      key: ipAddress,
      limit: VERIFY_PHONE_IP_RATE_LIMIT,
      windowMs: VERIFICATION_ATTEMPT_WINDOW_MS,
      message: "Too many verification attempts. Please try again later.",
    });
    await assertRateLimit({
      bucket: "verify-phone-code:user",
      key: user.id,
      limit: VERIFY_PHONE_USER_RATE_LIMIT,
      windowMs: VERIFICATION_ATTEMPT_WINDOW_MS,
      message: "Too many verification attempts. Please try again later.",
    });

    if (isTwilioVerifyMode()) {
      const verificationResult = await checkPhoneVerificationCode({
        phone: user.phone,
        code,
      });

      if (verificationResult.status !== "approved" || !verificationResult.valid) {
        return next(new AppError("Verification code is incorrect or expired", 400));
      }

      await prisma.userModel.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          isVerified: true,
        },
      });
    } else {
      const latestCode = await findLatestActivePhoneVerificationCode({
        userId: user.id,
        phone: user.phone,
      });

      if (!latestCode) {
        return next(new AppError("Verification code is invalid or has expired", 400));
      }

      if (latestCode.attempts >= PHONE_VERIFICATION_MAX_ATTEMPTS) {
        return next(
          new AppError(
            "Too many incorrect attempts. Please request a new verification code.",
            429
          )
        );
      }

      const incomingCodeHash = hashToken(code);

      if (incomingCodeHash !== latestCode.codeHash) {
        const nextAttempts = latestCode.attempts + 1;

        await prisma.phoneVerificationCode.update({
          where: { id: latestCode.id },
          data: {
            attempts: nextAttempts,
          },
        });

        if (nextAttempts >= PHONE_VERIFICATION_MAX_ATTEMPTS) {
          return next(
            new AppError(
              "Too many incorrect attempts. Please request a new verification code.",
              429
            )
          );
        }

        return next(new AppError("Verification code is incorrect", 400));
      }

      const usedAt = new Date();

      await prisma.$transaction([
        prisma.userModel.update({
          where: { id: user.id },
          data: {
            isPhoneVerified: true,
            isVerified: true,
          },
        }),
        prisma.phoneVerificationCode.update({
          where: { id: latestCode.id },
          data: { usedAt },
        }),
        prisma.phoneVerificationCode.deleteMany({
          where: {
            userId: user.id,
            phone: user.phone,
            usedAt: null,
            id: {
              not: latestCode.id,
            },
          },
        }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully.",
      data: {
        ...user,
        isVerified: true,
        isPhoneVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};



export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const parsedBody = changePasswordBodySchema.safeParse(req.body);

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { currentPassword, newPassword } = parsedBody.data;

    if (currentPassword === newPassword) {
      return next(new AppError("New password must be different", 400));
    }

    await assertStrongPassword(newPassword);

    // Fetch the user
    const user = await prisma.userModel.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.passwordHash) {
      return next(new AppError("Account is missing a password", 500));
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in DB
    await prisma.$transaction([
      prisma.userModel.update({
        where: { id: userId },
        data: { passwordHash: newHashedPassword },
      }),
    ]);
    await revokeAllSessionsForUser(userId, "PASSWORD_CHANGED");
    await sendPasswordChangedSecurityEmail({
      email: user.email,
      ipAddress: getRequestIp(req),
    });

    res.status(200).json({
      status: "success",
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    next(error);
  }
};

export const addPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const parsedBody = addPasswordBodySchema.safeParse(req.body);

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { newPassword } = parsedBody.data;

    await assertStrongPassword(newPassword);

    const user = await prisma.userModel.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.passwordHash) {
      return next(new AppError("Account already has a password", 400));
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.userModel.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await sendPasswordAddedSecurityEmail({
      email: user.email,
      ipAddress: getRequestIp(req),
    });

    res.status(200).json({
      success: true,
      message: "Password added successfully",
    });
  } catch (error) {
    console.error("Error in addPassword:", error);
    next(error);
  }
};



export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = refreshTokenBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }
    const { refreshToken } = parsedBody.data;

    const tokens = await rotateRefreshToken({
      refreshToken,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
    });

    res.status(200).json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }
  catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    console.error("Error in refreshAccessToken:", error);
    return next(new AppError("Failed to refresh access token", 500));
  }
}

export const logoutCurrentSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const parsedBody = logoutBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    await revokeSessionByRefreshToken({
      refreshToken: parsedBody.data.refreshToken,
      expectedUserId: userId,
      reason: "USER_LOGOUT_CURRENT",
    });

    return sendResponse(res, {
      statusCode: 200,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutAllSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    await revokeAllSessionsForUser(userId, "USER_LOGOUT_ALL");

    return sendResponse(res, {
      statusCode: 200,
      message: "Logged out from all sessions successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

export const getMySessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    const sessions = await listUserSessions(userId);

    return sendResponse(res, {
      statusCode: 200,
      data: sessions,
      message: "Sessions retrieved successfully.",
    });
  } catch (error) {
    return next(error);
  }
};



export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = googleLoginBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    if (!isGoogleSignInConfigured()) {
      return next(new AppError("Google Sign-In is not configured", 500));
    }

    const { idToken } = parsedBody.data;
    let googlePayload: Awaited<ReturnType<typeof verifyGoogleIdToken>>;
    try {
      googlePayload = await verifyGoogleIdToken(idToken);
    } catch (error) {
      console.warn("Google token verification failed:", error);
      return next(new AppError("Invalid Google authentication token", 401));
    }

    if (!googlePayload?.sub || !googlePayload.email) {
      return next(new AppError("Google account information is incomplete", 400));
    }

    if (!googlePayload.email_verified) {
      return next(new AppError("Google email must be verified", 400));
    }

    const deletedAccount = await prisma.deletedAccount.findUnique({
      where: { email: googlePayload.email },
    });

    const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: "GOOGLE",
          providerId: googlePayload.sub,
        },
      },
      select: {
        userId: true,
      },
    });

    let userId = existingOAuthAccount?.userId;

    if (!userId) {
      const existingUser = await prisma.userModel.findUnique({
        where: { email: googlePayload.email },
        select: {
          id: true,
          profile: {
            select: {
              id: true,
            },
          },
        },
      });

      if (existingUser) {
        userId = existingUser.id;
        const linkedOAuth = await prisma.oAuthAccount.upsert({
          where: {
            provider_providerId: {
              provider: "GOOGLE",
              providerId: googlePayload.sub,
            },
          },
          update: {},
          create: {
            provider: "GOOGLE",
            providerId: googlePayload.sub,
            userId,
          },
          select: {
            userId: true,
          },
        });

        if (linkedOAuth.userId !== userId) {
          return next(
            new AppError(
              "This Google account is already linked to another user account",
              409
            )
          );
        }

        if (!existingUser.profile) {
          await prisma.profile.upsert({
            where: { userId },
            update: {},
            create: {
              userId,
              fullName: googlePayload.name?.trim() || "Google User",
              avatarUrl: googlePayload.picture || null,
            },
          });
        } else if (googlePayload.picture) {
          await prisma.profile.upsert({
            where: { userId },
            update: {
              avatarUrl: googlePayload.picture,
            },
            create: {
              userId,
              fullName: googlePayload.name?.trim() || "Google User",
              avatarUrl: googlePayload.picture,
            },
          });
        }

        await prisma.userModel.update({
          where: { id: userId },
          data: {
            isEmailVerified: true,
          },
        });
      } else {
        const createdUser = await prisma.userModel.create({
          data: {
            email: googlePayload.email,
            isEmailVerified: true,
            profile: {
              create: {
                fullName: googlePayload.name?.trim() || "Google User",
                avatarUrl: googlePayload.picture || null,
              },
            },
            oauthAccounts: {
              create: {
                provider: "GOOGLE",
                providerId: googlePayload.sub,
              },
            },
          },
          select: {
            id: true,
          },
        });

        userId = createdUser.id;
      }
    }

    if (deletedAccount) {
      await prisma.deletedAccount.deleteMany({
        where: { email: googlePayload.email },
      });
    }

    if (!userId) {
      return next(new AppError("Failed to authenticate with Google", 500));
    }

    const publicUser = await getPublicUserById(userId);

    if (!publicUser) {
      return next(new AppError("User not found", 404));
    }

    const { accessToken: token, refreshToken } = await issueSessionTokens({
      userId,
      ipAddress: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      invalidateAllExisting: false,
    });
    try {
      const loginSecurityResult = await recordSuccessfulLogin({
        userId,
        email: googlePayload.email,
        ipAddress: getRequestIp(req),
        userAgent: getRequestUserAgent(req),
      });
      if (loginSecurityResult?.suspiciousLoginDetected) {
        await sendSuspiciousLoginSecurityEmail({
          email: googlePayload.email,
          ipAddress: getRequestIp(req),
          previousIp: loginSecurityResult.previousIp,
        });
      }
    } catch (monitoringError) {
      console.error("Failed to record successful Google login event:", monitoringError);
    }

    return sendResponse(res, {
      statusCode: 200,
      message: "User logged in with Google successfully",
      data: {
        user: publicUser,
        accessToken: token,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    const prismaCode = (error as { code?: string })?.code;
    if (prismaCode === "P2002") {
      return next(new AppError("Google account link conflict. Please try signing in again.", 409));
    }
    if (prismaCode === "P2025") {
      return next(new AppError("Google sign-in data changed during authentication. Please try again.", 409));
    }
    if (prismaCode === "P2021") {
      return next(
        new AppError(
          "Authentication database is out of date (missing OAuth tables). Apply latest migrations and retry.",
          503
        )
      );
    }
    if (prismaCode === "P2011") {
      return next(
        new AppError(
          "Authentication database is out of date (legacy refresh_tokens constraints detected). Apply latest migrations and retry.",
          503
        )
      );
    }
    if (prismaCode === "P1001" || prismaCode === "P1002") {
      return next(new AppError("Authentication service is temporarily unavailable. Please try again.", 503));
    }
    console.error("Error in loginWithGoogle:", error);
    next(new AppError("Failed to authenticate with Google", 500));
  }
};
