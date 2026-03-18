import express from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';
import { getUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile/:userId', getUserProfile);

export default router;