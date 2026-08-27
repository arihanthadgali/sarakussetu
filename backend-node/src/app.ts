import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { router } from './routes/index.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins.length === 0 ? false : env.corsOrigins }));
  app.use(express.json());
  app.use(router);

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not Found' });
  });
  app.use(errorHandler);

  return app;
};
