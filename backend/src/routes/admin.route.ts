import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { reviewUserCertification } from "../controllers/qualification.controller.js";

const router = express.Router();

router.patch("/certifications/:id/review", authenticateUser, reviewUserCertification);

export default router;
