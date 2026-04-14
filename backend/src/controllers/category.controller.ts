import { Request, Response, NextFunction } from "express";

import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";

const sendResponse = (
  res: Response,
  data: unknown = null,
  message = "",
  meta: Record<string, unknown> = {}
) => {
  res.json({ success: true, data, message, meta });
};

export const listCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        sortOrder: true,
      },
    });

    sendResponse(res, categories, "Categories fetched successfully", {
      total: categories.length,
    });
  } catch (error) {
    console.error("List Categories Error:", error);
    next(new AppError("Failed to fetch categories", 500));
  }
};
