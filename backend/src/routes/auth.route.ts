import express from 'express';
import { registerUser, loginUser, changePassword, refreshAccessToken } from '../controllers/auth.controller.js';
import { getUserProfile, deleteUserAccount, updateUserProfile } from '../controllers/user.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/refresh", refreshAccessToken);

router.get('/profile', authenticateUser, getUserProfile);
router.patch('/profile', authenticateUser, updateUserProfile);
router.delete('/profile', authenticateUser, deleteUserAccount);
router.post('/change-password', authenticateUser, changePassword);


export default router;