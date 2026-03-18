const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', userLimiter, authenticate, userController.getProfile);
router.put('/profile', userLimiter, authenticate, userController.updateProfile);
router.put('/password', userLimiter, authenticate, userController.changePassword);
router.get('/:id', userLimiter, authenticate, userController.getUserById);

module.exports = router;
