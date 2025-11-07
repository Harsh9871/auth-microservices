import express from 'express';
import UserController from '../controllers/user.controller.js';
import { adminOnly, sameAppOnly } from '../middleware/admin.middleware.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(adminOnly, sameAppOnly);

router.get('/', UserController.getAllUsers);
router.delete('/:id', UserController.deleteUser);

export default router;