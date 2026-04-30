import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/authorization.middleware.js";
import { reviewUserCertification } from "../controllers/qualification.controller.js";
import { Role } from "../../generated/prisma/enums.js";

const router = express.Router();

router.patch("/certifications/:id/review", authenticateUser, requireRole([Role.ADMIN]), reviewUserCertification);

export default router;
