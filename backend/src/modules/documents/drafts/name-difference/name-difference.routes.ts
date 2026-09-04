import { Router } from 'express';
import { generateNameDifference } from './name-difference.controller';

const router = Router();

router.post('/generate', generateNameDifference);

export default router;
