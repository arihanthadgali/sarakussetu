import { Router } from 'express';

import { createOtpRouter } from './auth/otp.js';
import { healthRouter } from './health.js';

export const router = Router();

router.use('/api/health', healthRouter);
router.use('/api/auth/otp', createOtpRouter());
