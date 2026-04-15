import { Router } from "express";
import { getUserReviews } from "../controllers/review.controller.js";

const router = Router();

router.get("/:userId/reviews", getUserReviews);

export default router;
