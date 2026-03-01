import { Router, Request, Response, NextFunction } from 'express';
import * as authController from './authController';
import { authGuard, authLimiter, otpRequestLimiter } from './middleware';
import { initPassport, googleAuthMiddleware, googleCbMiddleware, isGoogleAuthConfigured } from './services';
import { env } from './config';

initPassport();

const router = Router();

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/request-otp', authLimiter, otpRequestLimiter, authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/forgot-password', otpRequestLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// @ts-expect-error - AuthRequest extends Request; authGuard sets req.user
router.get('/me', authGuard, authController.me);
// @ts-expect-error - same
router.post('/logout', authController.logout);

router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleAuthConfigured()) {
    res.redirect(`${env.ORIGIN}/login?error=google_not_configured`);
    return;
  }
  googleAuthMiddleware(req, res, next);
// @ts-expect-error - AuthRequest extends Request
}, authController.googleRedirect);

router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleAuthConfigured()) {
    res.redirect(`${env.ORIGIN}/login?error=google_not_configured`);
    return;
  }
  googleCbMiddleware(req, res, next);
// @ts-expect-error - AuthRequest extends Request
}, authController.googleCallback);

export const authRoutes = router;
