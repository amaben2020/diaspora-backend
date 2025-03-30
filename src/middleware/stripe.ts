import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { handleWebhookEvent } from '../services/stripeService.ts';
import { tryCatchFn } from '../utils/tryCatch.ts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const stripeWebhookMiddleware = tryCatchFn(
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('EVENT', event);
      await handleWebhookEvent(event);
    } catch (err) {
      if (err instanceof Error)
        return res.status(400).send(`Webhook Error: ${err?.message}`);
    }

    return res.json({ received: true });
  },
);
