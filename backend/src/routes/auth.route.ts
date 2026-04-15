import express from "express";
import {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from "../controllers/auth.controller.js";

import {
  getUserProfile,
  deleteUserAccount,
  updateUserProfile,
  uploadUserAvatar,
  deleteUserAvatar,
} from "../controllers/user.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshAccessToken);

// Profile
router.get("/profile", authenticateUser, getUserProfile);
router.patch("/profile", authenticateUser, updateUserProfile);
router.delete("/profile", authenticateUser, deleteUserAccount);

// Avatar (NEW)
router.post(
  "/profile/avatar",
  authenticateUser,
  upload.single("avatar"),
  uploadUserAvatar
);

router.delete(
  "/profile/avatar",
  authenticateUser,
  deleteUserAvatar
);

// Password
router.post("/change-password", authenticateUser, changePassword);

export default router;
