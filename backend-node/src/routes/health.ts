import { Router, type RequestHandler } from 'express';

import { isDatabaseAvailable } from '../database/health.js';

export const getHealth: RequestHandler = async (_request, response) => {
  if (await isDatabaseAvailable()) {
    response.status(200).json({ status: 'UP' });
    return;
  }

  response.status(503).json({ status: 'DOWN' });
};

export const healthRouter = Router();

healthRouter.get('/', getHealth);
