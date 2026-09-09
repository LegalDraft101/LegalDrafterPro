import { Router } from 'express';
import { googleAuth } from './google-auth.controller';
import { signup, me, logout } from './auth.controller';
import { authGuard, authLimiter } from '../../middleware/auth.middleware';
import { phoneSignup, phoneLogin, emailSignupRequest, emailSignupVerify, emailLoginRequest, emailLoginVerify } from './local-auth.controller';
import { verifyPhone } from './phone-auth.controller';
import { sendEmailOtp, verifyEmailOtp } from './email-otp.controller';

const router = Router();

router.post('/phone/signup', authLimiter, phoneSignup);
router.post('/phone/login', authLimiter, phoneLogin);
router.post('/verify-phone', authLimiter, verifyPhone);
router.post('/email/send-otp', authLimiter, sendEmailOtp);
router.post('/email/verify-otp', authLimiter, verifyEmailOtp);
router.post('/email/signup/request-otp', authLimiter, emailSignupRequest);
router.post('/email/signup/verify', authLimiter, emailSignupVerify);
router.post('/email/login/request-otp', authLimiter, emailLoginRequest);
router.post('/email/login/verify', authLimiter, emailLoginVerify);
router.post('/google-create', authLimiter, authGuard, googleAuth);
router.post('/google/signin', authLimiter, authGuard, googleAuth);

// Session Endpoints
router.get('/me', authGuard, me);
router.post('/logout', authGuard, logout);

export default router;
