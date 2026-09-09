import { Router } from 'express';
import { authGuard, authLimiter } from '../../middleware/auth.middleware';
import { createAddress, deleteAddress, getProfile, requestVerification, setDefaultAddress, syncFirebasePhone, updateAddress, updateProfile, verifyContact } from './profile.controller';

const router = Router();
router.use(authGuard);
router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/addresses', createAddress);
router.patch('/addresses/:id', updateAddress);
router.post('/addresses/:id/default', setDefaultAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/verification/request', authLimiter, requestVerification);
router.post('/verification/verify', authLimiter, verifyContact);
router.post('/verification/firebase-phone', authLimiter, syncFirebasePhone);

export default router;