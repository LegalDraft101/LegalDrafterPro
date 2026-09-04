import { Router } from 'express';
import { getSystemHealth, getDbHealth } from './health.controller';

const router = Router();

router.get('/', getSystemHealth);
router.get('/db', getDbHealth);

export default router;
