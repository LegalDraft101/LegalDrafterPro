import { Router } from 'express';
import { signup, googleCreate, me, logout } from './auth.controller';
import { authGuard, authLimiter } from '../../middleware/auth.middleware';

const router = Router();

router.post('/signup', authLimiter, authGuard, signup);
router.post('/google-create', authLimiter, authGuard, googleCreate);
router.get('/me', authGuard, me);
router.post('/logout', logout);

export default router;
