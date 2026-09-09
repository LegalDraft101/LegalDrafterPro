import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { env } from './config/env';

import { generalLimiter } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import draftRoutes from './modules/documents/drafts/common/draft.routes';
import affidavitRoutes from './modules/documents/affidavits/common/affidavit.routes';
import rentAgreementRoutes from './modules/documents/agreements/common/agreement.routes';
import profileRoutes from './modules/profile/profile.routes';

const app = express();

app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
app.use(generalLimiter);

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'API running', health: '/health' });
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth/profile', profileRoutes);
app.use('/api', draftRoutes);
app.use('/api/affidavits', affidavitRoutes);
app.use('/api/rent-agreements', rentAgreementRoutes);

app.use(errorHandler);

export default app;
