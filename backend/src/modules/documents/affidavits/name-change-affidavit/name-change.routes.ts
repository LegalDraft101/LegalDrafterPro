import { Router } from 'express';
import { handleNameChange } from './name-change.controller';

const router = Router();

router.post('/name-change', handleNameChange);

export default router;
