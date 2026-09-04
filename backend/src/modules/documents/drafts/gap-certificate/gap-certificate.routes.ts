import { Router } from 'express';
import { generateGapCertificate } from './gap-certificate.controller';

const router = Router();

router.post('/generate', generateGapCertificate);

export default router;
