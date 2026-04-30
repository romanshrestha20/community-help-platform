import express from "express";
import {
  getAllHelpRequests,
  getNearbyRequests,
  createHelpRequest,
  getHelpRequestById,
  deleteHelpRequest,
  updateHelpRequest,
  updateHelpRequestStatus,
  deleteRequestImage,
  addRequestImages,
} from "../controllers/request.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireVerifiedUser } from "../middlewares/authorization.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public
router.get("/", getAllHelpRequests);
router.get("/nearby", authenticateUser, requireVerifiedUser, getNearbyRequests);
router.get("/:id", getHelpRequestById);

// Protected
router.use(authenticateUser);
router.use(requireVerifiedUser);

router.post("/", upload.array("images", 5), createHelpRequest);
router.patch("/:id", updateHelpRequest);
router.delete("/:id", deleteHelpRequest);
router.patch("/:id/status", updateHelpRequestStatus);

router.post("/:id/images", upload.array("images", 5), addRequestImages);
router.delete("/:id/images/:imageId", deleteRequestImage);

export default router;
