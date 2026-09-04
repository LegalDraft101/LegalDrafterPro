import { Router } from 'express';
import { handleFeeRemission } from './fee-remission.controller';

const router = Router();

router.post('/fee-remission', handleFeeRemission);

export default router;
