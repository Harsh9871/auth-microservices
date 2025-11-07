import express from 'express';
import AuthController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/validate-token', AuthController.validateToken);
router.post('/refresh-token', AuthController.refreshTokenController);
router.post('/logout', AuthController.logoutController);
router.get('/me', AuthController.getCurrentUserController);

export default router;