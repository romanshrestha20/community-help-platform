import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import { accessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
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
  sendPasswordResetEmail,
} from "../services/email.service.js";
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

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists for this email, we sent a password reset link.";
const EMAIL_VERIFICATION_SENT_MESSAGE =
  "Verification email sent. Please check your inbox.";
const PHONE_VERIFICATION_SENT_MESSAGE =
  "Verification code sent. Please check your phone.";
const PHONE_VERIFICATION_MAX_ATTEMPTS = Number(
  process.env.PHONE_VERIFICATION_MAX_ATTEMPTS || 5
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

const createSessionForUser = async (userId: string) => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  const token = accessToken({ userId });
  const refreshToken = signRefreshToken({ userId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId, token: refreshToken, expiresAt },
  });

  return {
    accessToken: token,
    refreshToken,
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

    if (!location) {
      return next(new AppError("A valid location is required", 400));
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) {
      return next(new AppError("Please enter a valid phone number", 400));
    }

    const parsedDateOfBirth = new Date(dateOfBirth);

    if (Number.isNaN(parsedDateOfBirth.getTime())) {
      return next(new AppError("Invalid dateOfBirth format. Use YYYY-MM-DD", 400));
    }

    const existingUser = await prisma.userModel.findFirst({
      where: {
        OR: [{ email }, { phone: normalizedPhone }],
      },
    });

    if (existingUser) {
      return next(new AppError("Email or phone already registered", 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.userModel.create({
      data: {
        email,
        passwordHash,
        phone: normalizedPhone,
        profile: {
          create: {
            fullName,
            gender,
            dateOfBirth: parsedDateOfBirth,
            address: {
              create: toLocationCreateInput(location),
            },
          },
        },
      },
    });
    const publicUser = await getPublicUserById(createdUser.id);

    if (!publicUser) {
      return next(new AppError("User not found after registration", 500));
    }


    const token = accessToken({ userId: createdUser.id });
    const refreshToken = signRefreshToken({ userId: createdUser.id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { userId: createdUser.id, token: refreshToken, expiresAt },
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

    assertRateLimit({
      bucket: "forgot-password:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset requests. Please try again later.",
    });
    assertRateLimit({
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

    // Find user by email for password check
    const user = await prisma.userModel.findUnique({ where: { email } });
    if (!user) {
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
      return next(new AppError("Account is missing a password", 500));
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return next(new AppError("Invalid email or password", 401));

    // Return a public user payload (without passwordHash) aligned with mobile contract
    const publicUser = await getPublicUserById(user.id);

    if (!publicUser) {
      return next(new AppError("User not found", 404));
    }

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
    const access = accessToken({ userId: user.id });
    const refresh = signRefreshToken({ userId: user.id });

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refresh, expiresAt },
    });

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

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters", 400));
    }

    assertRateLimit({
      bucket: "reset-password:ip",
      key: ipAddress,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many password reset attempts. Please try again later.",
    });
    assertRateLimit({
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

    const passwordHash = await bcrypt.hash(newPassword, 10);
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
      prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);


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

    assertRateLimit({
      bucket: "send-email-verification:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification email requests. Please try again later.",
    });
    assertRateLimit({
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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = verifyEmailBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
    }

    const { token } = parsedBody.data;
    const ipAddress = getRequestIp(req);

    assertRateLimit({
      bucket: "verify-email:ip",
      key: ipAddress,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification attempts. Please try again later.",
    });
    assertRateLimit({
      bucket: "verify-email:token",
      key: token,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification attempts. Please request a new verification email.",
    });

    const verificationToken = await findActiveEmailVerificationTokenByRawToken(token);

    if (!verificationToken) {
      return next(new AppError("Verification link is invalid or has expired", 400));
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

    const verifiedUser = await prisma.userModel.findUnique({
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

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: verifiedUser,
    });
  } catch (error) {
    next(error);
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

    assertRateLimit({
      bucket: "send-phone-code:ip",
      key: ipAddress,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification code requests. Please try again later.",
    });
    assertRateLimit({
      bucket: "send-phone-code:user",
      key: user.id,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification code requests. Please try again later.",
    });
    assertRateLimit({
      bucket: "send-phone-code:phone",
      key: user.phone,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification code requests. Please try again later.",
    });

    if (isTwilioVerifyMode()) {
      assertRateLimit({
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

    assertRateLimit({
      bucket: "verify-phone-code:ip",
      key: ipAddress,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: "Too many verification attempts. Please try again later.",
    });
    assertRateLimit({
      bucket: "verify-phone-code:user",
      key: user.id,
      limit: 10,
      windowMs: 15 * 60 * 1000,
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

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters", 400));
    }

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
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await prisma.$transaction([
      prisma.userModel.update({
        where: { id: userId },
        data: { passwordHash: newHashedPassword },
      }),
      prisma.refreshToken.deleteMany({ where: { userId } }), // Invalidate all refresh tokens on password change  
    ]);

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

    if (newPassword.length < 6) {
      return next(new AppError("Password must be at least 6 characters", 400));
    }

    const user = await prisma.userModel.findUnique({ where: { id: userId } });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.passwordHash) {
      return next(new AppError("Account already has a password", 400));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.userModel.update({
      where: { id: userId },
      data: { passwordHash },
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
    const decoded = verifyRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!storedToken) {
      return next(new AppError("Invalid refresh token", 401));
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return next(new AppError("Session expired. Please login again.", 401));
    }

    const newRefreshToken = signRefreshToken({ userId: decoded.userId });

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const newAccessToken = accessToken({ userId: decoded.userId });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }
  catch (error) {
    console.error("Error in refreshAccessToken:", error);
    return next(new AppError("Failed to refresh access token", 500));
  }
}



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
    const googlePayload = await verifyGoogleIdToken(idToken);

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

        await prisma.oAuthAccount.create({
          data: {
            provider: "GOOGLE",
            providerId: googlePayload.sub,
            userId,
          },
        });

        if (!existingUser.profile) {
          await prisma.profile.create({
            data: {
              userId,
              fullName: googlePayload.name?.trim() || "Google User",
              avatarUrl: googlePayload.picture || null,
            },
          });
        } else if (googlePayload.picture) {
          await prisma.profile.update({
            where: { userId },
            data: {
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
      await prisma.deletedAccount.delete({
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

    const { accessToken: token, refreshToken } = await createSessionForUser(userId);

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
    console.error("Error in loginWithGoogle:", error);
    next(new AppError("Failed to authenticate with Google", 500));
  }
};
