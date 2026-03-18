const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
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
router.put(
  '/password',
  userLimiter,
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  userController.changePassword
);
router.get('/:id', userLimiter, authenticate, userController.getUserById);

module.exports = router;
