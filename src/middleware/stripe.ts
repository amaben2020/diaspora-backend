import type { Request, Response } from 'express';
import Stripe from 'stripe';
// import { handleWebhookEvent } from '../services/stripeService.ts';
import { tryCatchFn } from '../utils/tryCatch.ts';
import { db } from '../db.ts';
import { paymentsTable } from '../schema/paymentsTable.ts';
import { eq } from 'drizzle-orm';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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

export const stripeWebhookMiddleware = tryCatchFn(
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

      console.log('EVT', event);

      // Handle the event directly here instead of separate function
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('payment intent', paymentIntent);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
              expand: ['items.data.price.product'],
            },
          );
          const customerId = subscription.customer as string;

          let subscriptionType = 'paid';
          if (invoice.lines?.data?.length > 0) {
            const lineItem = invoice.lines.data[0];
            if (lineItem.description) {
              const match = lineItem.description.match(/Diaspora (.+?) \(at/);
              if (match && match[1]) {
                subscriptionType = match[1].toLowerCase().replace(/\s+/g, '-');
              }
            } else if (lineItem.price?.product) {
              const product =
                typeof lineItem.price.product === 'string'
                  ? await stripe.products.retrieve(lineItem.price.product)
                  : lineItem.price.product;
              subscriptionType = (product as { name: string })?.name
                ?.toLowerCase()
                .replace(/\s+/g, '-');
            }
          }

          await db
            .update(paymentsTable)
            .set({
              paymentStatus: 'active',
              nextBillingDate: new Date(subscription.current_period_end * 1000),
              lastUpdated: new Date(),
              subscriptionType,
            })
            .where(eq(paymentsTable.stripeCustomerId, customerId));
          break;

        case 'invoice.created':
          console.log('Invoice created event received');
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          const deletedCustomerId = deletedSubscription.customer as string;

          await db
            .update(paymentsTable)
            .set({
              paymentStatus: 'inactive',
              subscriptionType: 'free',
              lastUpdated: new Date(),
            })
            .where(eq(paymentsTable.stripeCustomerId, deletedCustomerId));
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return res.json({ received: true });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      return res.status(400).send('Webhook Error');
    }
  },
);
