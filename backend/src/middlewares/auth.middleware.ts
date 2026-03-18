import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    try {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('Unauthorized: No token provided', 401));
        }
        const token = authHeader.split(' ')[1];
        verifyAccessToken(token);
        return next();

    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        return next(new AppError('Unauthorized', 401));
    }
};