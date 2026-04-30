import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireVerifiedUser } from "../middlewares/authorization.middleware.js";
import {
    createReview,
    deleteReview,
    getReview,
    updateReview,
} from "../controllers/review.controller.js";

const router = Router();

router.post("/", authenticateUser, requireVerifiedUser, createReview);
router.get("/:reviewId", getReview);
router.patch("/:reviewId", authenticateUser, requireVerifiedUser, updateReview);
router.delete("/:reviewId", authenticateUser, requireVerifiedUser, deleteReview);

export default router;
