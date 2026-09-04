import { Router } from 'express';
import { handleRentAgreement } from './rent-agreement.controller';

const router = Router();

router.post('/rent-agreement', handleRentAgreement);

export default router;
