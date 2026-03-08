import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authGuard, authLimiter } from '../middleware';

const router = Router();

// @ts-expect-error - AuthRequest extends Request
router.post('/signup', authLimiter, authGuard, authController.signup);

// @ts-expect-error - AuthRequest extends Request; authGuard sets req.user
router.get('/me', authGuard, authController.me);
// @ts-expect-error - same
router.post('/logout', authController.logout);

export const authRoutes = router;
