import { Router } from 'express';
import { generateNameDifference } from './name-difference.controller';
import { authGuard } from '../../../../middleware/auth.middleware';

const router = Router();

router.post('/generate', authGuard, generateNameDifference);

export default router;
