import express from 'express';
import AuthController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/validate-token', AuthController.validateToken);
router.post('/refresh', AuthController.refreshTokenController);
router.post('/logout', AuthController.logoutController);
router.get('/me', AuthController.getCurrentUserController);
router.post('/send-verification', AuthController.sendVerificationEmail);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-otp', AuthController.resendOTP);

export default router;