import {prisma} from "../lib/prisma.js";
import {NextFunction, Request, Response} from "express";
import AppError from "../utils/appError.js";



export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
const userId = req.params.userId;

try {
    if (!userId) {
        return next(new AppError("Unauthorized", 401));
    }

    const user = await prisma.userModel.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    res.json({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        profile: user.profile
    });
}
    catch (error) {
        next(error);
    }


}