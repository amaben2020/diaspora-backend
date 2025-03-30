import { Router } from 'express';

import {
  createPaymentIntent,
  getPaymentStatus,
  getPlans,
  getCustomer,
  getOrCreateCustomer,
} from '../controller/payment/payment.ts';
import { stripeWebhookMiddleware } from '../middleware/stripe.ts';
import { clerkMiddleware } from '@clerk/express';
import express from 'express';

const router = Router();

// webhook
router.post(
  '/webhook',
  express.json({ type: 'application/json' }),
  stripeWebhookMiddleware,
);

// Regular endpoints
router.get('/plans', getPlans);
router.post('/customer', clerkMiddleware(), getOrCreateCustomer);
router.post('/subscription', createPaymentIntent);
router.get('/status/:userId', getPaymentStatus);
router.get('/customer/:userId', getCustomer);

export default router;
