import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
    createReview,
    deleteReview,
    getReview,
    updateReview,
} from "../controllers/review.controller.js";

const router = Router();

router.post("/", authenticateUser, createReview);
router.get("/:reviewId", getReview);
router.patch("/:reviewId", authenticateUser, updateReview);
router.delete("/:reviewId", authenticateUser, deleteReview);

export default router;
