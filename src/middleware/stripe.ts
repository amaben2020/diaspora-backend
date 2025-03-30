import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { handleWebhookEvent } from '../services/stripeService.ts';
import { tryCatchFn } from '../utils/tryCatch.ts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// export const stripeWebhookMiddleware = tryCatchFn(
//   async (req: Request, res: Response) => {
//     const sig = req.headers['stripe-signature'] as string;
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//       console.log('EVENT', event);
//       await handleWebhookEvent(event);
//     } catch (err) {
//       if (err instanceof Error)
//         return res.status(400).send(`Webhook Error: ${err?.message}`);
//     }

//     return res.json({ received: true });
//   },
// );

// controllers/webhookController.ts

export const stripeWebhookMiddleware = tryCatchFn(
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_ID!;

    console.log(req);

    console.log('endpointSecret', endpointSecret);
    console.log('req.body', req.body);
    // console.log('req.body', req?.rawBody);

    console.log('req.headers', req.headers);
    console.log('sig', sig);

    if (!sig) {
      return res.status(400).send('No Stripe signature header');
    }

    // if (!req.body) {
    //   return res.status(400).send('No request body');
    // }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req?.rawBody, sig, endpointSecret);

      console.log('Handling event:', event.type);
      await handleWebhookEvent(event);

      return res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      if (err instanceof Error) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      return res.status(500).send('Unknown webhook error');
    }
  },
);
