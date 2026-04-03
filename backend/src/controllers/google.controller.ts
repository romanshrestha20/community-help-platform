import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
import { AuthService } from "../services/google.service.js";

const authService = new AuthService();

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = (req.body ?? {}) as {
      idToken?: string;
      token?: string;
      email?: string;
      name?: string;
    };
    const idToken = body.idToken || body.token;
    const { email, name } = body;

    console.log("Google login request body:", req.body);
    console.log("ID token received:", idToken);

    const allowDevOAuth = process.env.ALLOW_DEV_OAUTH === "true";

    // Development mode fallback
    if (!idToken && allowDevOAuth) {
      if (!email) {
        console.error(
          "idToken or email missing. Body received:",
          JSON.stringify(req.body)
        );

        return next(
          new AppError(
            "idToken is required. In development mode, you can also provide email and name.",
            400
          )
        );
      }

      console.log("Development mode: using mock Google identity from email");

      /**
       * This assumes your AuthService has a dedicated dev helper.
       * If you do not want that, I can rewrite the service to support it cleanly.
       */
      const result = await authService.googleSignInForDevelopment({
        email,
        fullName: name || email.split("@")[0],
        providerId: email.split("@")[0],
      });

      return res.status(200).json({
        message: result.isNewUser
          ? "Google sign-up successful"
          : "Google login successful",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    }

    if (!idToken) {
      console.error(
        "idToken missing. Body received:",
        JSON.stringify(req.body)
      );

      return next(
        new AppError(
          "idToken is required. Please provide a valid Google ID token in the request body.",
          400
        )
      );
    }

    const result = await authService.googleSignIn({ idToken });

    return res.status(200).json({
      message: result.isNewUser
        ? "Google sign-up successful"
        : "Google login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};