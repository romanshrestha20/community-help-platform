import express from "express";
import {
  registerUser,
  loginUser,
  changePassword,
  addPassword,
  forgotPassword,
  resendEmailVerification,
  sendPhoneCode,
  sendEmailVerification,
  verifyEmail,
  verifyPhoneCode,
  resetPassword,
  refreshAccessToken,
  loginWithGoogle,
  logoutCurrentSession,
  logoutAllSessions,
  getMySessions,
} from "../controllers/auth.controller.js";

import {
  getUserProfile,
  deleteUserAccount,
  updateUserProfile,
  uploadUserAvatar,
  deleteUserAvatar,
} from "../controllers/user.controller.js";
import {
  deleteUserCertification,
  replaceUserSkills,
  uploadUserCertification,
} from "../controllers/qualification.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireVerifiedUser } from "../middlewares/authorization.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", loginWithGoogle)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-email-verification", authenticateUser, sendEmailVerification);
router.post("/resend-email-verification", authenticateUser, resendEmailVerification);
router.post("/verify-email", verifyEmail);
router.post("/send-phone-code", authenticateUser, sendPhoneCode);
router.post("/verify-phone-code", authenticateUser, verifyPhoneCode);
router.post("/refresh", refreshAccessToken);
router.post("/logout", authenticateUser, logoutCurrentSession);
router.post("/logout-all", authenticateUser, logoutAllSessions);
router.get("/sessions", authenticateUser, getMySessions);

// Profile
router.get("/profile", authenticateUser, getUserProfile);
router.patch("/profile", authenticateUser, updateUserProfile);
router.delete("/profile", authenticateUser, deleteUserAccount);
router.put("/profile/skills", authenticateUser, replaceUserSkills);
router.post(
  "/profile/certifications",
  authenticateUser,
  requireVerifiedUser,
  upload.single("proof"),
  uploadUserCertification
);
router.delete(
  "/profile/certifications/:id",
  authenticateUser,
  requireVerifiedUser,
  deleteUserCertification
);

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
router.post("/change-password", authenticateUser, requireVerifiedUser, changePassword);
router.post("/add-password", authenticateUser, requireVerifiedUser, addPassword);

export default router;
