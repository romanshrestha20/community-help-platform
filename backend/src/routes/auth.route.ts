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

// Profile
router.get("/profile", authenticateUser, getUserProfile);
router.patch("/profile", authenticateUser, updateUserProfile);
router.delete("/profile", authenticateUser, deleteUserAccount);
router.put("/profile/skills", authenticateUser, replaceUserSkills);
router.post(
  "/profile/certifications",
  authenticateUser,
  upload.single("proof"),
  uploadUserCertification
);
router.delete(
  "/profile/certifications/:id",
  authenticateUser,
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
router.post("/change-password", authenticateUser, changePassword);
router.post("/add-password", authenticateUser, addPassword);

export default router;
