const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public authentication routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/demo-login/:role', AuthController.demoLogin);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/logout', AuthController.logout);

// Protected profile routes
router.get('/profile', protect, AuthController.getProfile);
router.get('/me', protect, AuthController.getProfile);
router.put('/profile', protect, AuthController.updateProfile);

module.exports = router;
