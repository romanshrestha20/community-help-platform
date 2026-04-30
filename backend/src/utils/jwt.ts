import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from './appError.js';
import 'dotenv/config';
import { v4 as uuidv4 } from "uuid";

const isProduction = process.env.NODE_ENV === 'production';

// Use fallback only in dev
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_secret';

// 🚨 Enforce strict check in production
if (isProduction && (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET)) {
    throw new Error("JWT secrets must be defined in production");
}

const ACCESS_EXPIRY = '1h';
const REFRESH_EXPIRY = '7d';

export type AccessTokenPayload = JwtPayload & {
    userId: string;
};

export type RefreshTokenPayload = JwtPayload & {
    userId: string;
    jti: string;
    familyId: string;
};

// ======================
// ACCESS TOKEN
// ======================
export const accessToken = (payload: AccessTokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

        if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
            throw new AppError('Invalid token payload', 401);
        }

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Access token expired', 401);
        }
        throw new AppError('Invalid access token', 401);
    }
};

// ======================
// REFRESH TOKEN
// ======================
export const signRefreshToken = (payload: RefreshTokenPayload): string => {
    return jwt.sign(
        {
            ...payload,
            jti: uuidv4(), // unique per token
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    try {
        const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;

        if (!decoded || typeof decoded !== 'object' || !decoded.userId || !decoded.jti || !decoded.familyId) {
            throw new AppError('Invalid token payload', 401);
        }

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Refresh token expired', 401);
        }
        throw new AppError('Invalid refresh token', 401);
    }
};
