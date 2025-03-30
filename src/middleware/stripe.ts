import Stripe from 'stripe';
import { tryCatchFn } from '../utils/tryCatch.ts';
import { db } from '../db.ts';
import { paymentsTable } from '../schema/paymentsTable.ts';
import { eq } from 'drizzle-orm';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const EVENTS = {
  paymentSucceed: 'payment_intent.succeeded',
  invoiceSucceed: 'invoice.payment_succeeded',
  invoiceCreated: 'invoice.created',
  subscriptionDeleted: 'customer.subscription.deleted',
};

export const stripeWebhookMiddleware = tryCatchFn(async (request, response) => {
  const event = request.body;

  switch (event.type) {
    case EVENTS.paymentSucceed:
      const paymentIntent = event.data.object;
      console.log('payment intent', paymentIntent);
      break;

    case EVENTS.invoiceSucceed:
      // data based on event type
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product'],
      });
      const customerId = subscription.customer as string;

      // default subscription type
      let subscriptionType = 'paid';

      // using the subscription name to name the subscription type
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

      // updating the database
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

    case EVENTS.invoiceCreated:
      console.log('Invoice created event received');
      break;

    case EVENTS.subscriptionDeleted:
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
});
