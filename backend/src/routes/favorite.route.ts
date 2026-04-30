import express from "express";
import {
    addToFavorites,
    removeFromFavorites,
    listFavorites,
    listMyFavoriteRequestIds,
    checkFavoriteStatus,
} from "../controllers/favorite.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireVerifiedUser } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.use(requireVerifiedUser);

router.post("/:requestId", addToFavorites);
router.delete("/:requestId", removeFromFavorites);
router.get("/", listFavorites);
router.get("/ids", listMyFavoriteRequestIds);
router.get("/:requestId/status", checkFavoriteStatus);

export default router;
