import { Router } from 'express';
import { generateGapCertificate } from './gap-certificate.controller';
import { authGuard } from '../../../../middleware/auth.middleware';

const router = Router();

router.post('/generate', authGuard, generateGapCertificate);

export default router;
