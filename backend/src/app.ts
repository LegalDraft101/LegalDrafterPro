import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config';
import { generalLimiter, errorHandler } from './middleware';
import { authRoutes, draftRoutes, legacyAffidavitRoutes, legacyRentAgreementRoutes } from './routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));
app.use(generalLimiter);

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'API running', health: '/health' });
});
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/api', draftRoutes);
app.use('/api/affidavits', legacyAffidavitRoutes);
app.use('/api/rent-agreements', legacyRentAgreementRoutes);

app.use(errorHandler);

export default app;
