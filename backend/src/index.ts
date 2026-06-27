import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { appConfig } from './config.js';
import { errorHandler, apiLimiter } from './middleware/index.js';
import verificationRouter from './routes/verification.js';
import datasetsRouter from './routes/datasets.js';
import historyRouter from './routes/history.js';
import analyticsRouter from './routes/analytics.js';

async function main() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors({ origin: appConfig.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(apiLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/verify', verificationRouter);
  app.use('/api/datasets', datasetsRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use(errorHandler);

  app.listen(appConfig.port, () => {
    console.log(`[Swara Verification Engine] Running on port ${appConfig.port}`);
  });
}

main().catch(console.error);
