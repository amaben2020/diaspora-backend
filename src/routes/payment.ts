import { Router } from 'express';

import {
  createPaymentIntent,
  getPaymentStatus,
  getPlans,
  getCustomer,
  getOrCreateCustomer,
} from '../controller/payment/payment.ts';
import { stripe } from '../middleware/stripe.ts';
import { clerkMiddleware } from '@clerk/express';
import express from 'express';

import Stripe from 'stripe';
// import { handleWebhookEvent } from '../services/stripeService.ts';

import { db } from '../db.ts';
import { paymentsTable } from '../schema/paymentsTable.ts';
import { eq } from 'drizzle-orm';
import { tryCatchFn } from '../utils/tryCatch.ts';

const router = Router();

router.post(
  '/webhook',
  express.json({ type: 'application/json' }),
  // stripeWebhookMiddleware,

  tryCatchFn(async (request, response) => {
    const event = request.body;
    console.log('EVT TYPE', event.type);

    // Handle the event
    // switch (event.type) {
    //   case 'payment_intent.created':
    //     console.log('payment_intent.created');
    //     break;
    //   case 'payment_intent.succeeded':
    //     const paymentIntent = event.data.object;
    //     console.log('payment intent', paymentIntent);
    //     // Then define and call a method to handle the successful payment intent.
    //     // handlePaymentIntentSucceeded(paymentIntent);
    //     break;
    //   case 'payment_method.attached':
    //     const paymentMethod = event.data.object;
    //     console.log('payment paymentMethod', paymentMethod);
    //     // Then define and call a method to handle the successful attachment of a PaymentMethod.
    //     // handlePaymentMethodAttached(paymentMethod);
    //     break;
    //   // ... handle other event types
    //   default:
    //     console.log(`Unhandled event type ${event.type}`);
    // }

    // Return a response to acknowledge receipt of the event
    // response.json({ received: true });

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

        console.log('INVOICE', { invoice, subscriptionId, subscription });
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
        console.log('subscriptionType', subscriptionType);
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

    return response.json({ received: true });
  }),
);

// Regular endpoints
router.get('/plans', getPlans);
router.post('/customer', clerkMiddleware(), getOrCreateCustomer);

router.post('/subscription', createPaymentIntent);
router.get('/status/:userId', getPaymentStatus);
router.get('/customer/:userId', getCustomer);

export default router;
