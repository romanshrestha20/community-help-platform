import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { getUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile/:userId', getUserProfile);

export default router;