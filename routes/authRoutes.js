const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);

// 2FA endpoints
router.post('/2fa/setup', authMiddleware, authController.setup2FA);
router.post('/2fa/enable', authMiddleware, authController.enable2FA);
router.post('/2fa/disable', authMiddleware, authController.disable2FA);
router.post('/2fa/login-2fa', authController.login2FA);

module.exports = router;
