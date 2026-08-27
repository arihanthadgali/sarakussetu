import { Router } from 'express';

import { createAuthenticatedCustomerRouter } from './auth/me.js';
import { createOtpRouter } from './auth/otp.js';
import { healthRouter } from './health.js';
import { createProductRouter } from './products.js';

export const router = Router();

router.use('/api/health', healthRouter);
router.use('/api/auth/otp', createOtpRouter());
router.use('/api/auth', createAuthenticatedCustomerRouter());
router.use('/api/products', createProductRouter());
