import Stripe from 'stripe';

import { db } from '../db.ts';
import { paymentsTable } from '../schema/paymentsTable.ts';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const createStripeCustomer = async (userId: string, email: string) => {
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await db.insert(paymentsTable).values({
    userId,
    stripeCustomerId: customer.id,
    subscriptionType: 'free',
    paymentStatus: 'inactive',
  });

  return customer;
};

export const getCustomerByUserId = async (userId: string) => {
  const [customer = undefined] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId));

  return customer;
};

export const createSubscription = async (
  customerId: string,
  priceId: string,
  userId: string,
) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  // Update user's payment status in database
  await db
    .update(paymentsTable)
    .set({
      paymentStatus: 'pending',
      lastUpdated: new Date(),
    })
    .where(eq(paymentsTable.userId, userId));

  // Type-safe way to access the payment intent
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

  if (!paymentIntent?.client_secret) {
    throw new Error('Payment intent is missing client secret');
  }

  const clientSec = paymentIntent.client_secret ?? '';

  return {
    subscriptionId: subscription.id,
    clientSecret: clientSec,
  };
};

export const getSubscriptionPlans = async () => {
  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
  });

  return prices.data.map((price) => ({
    id: price.id,
    nickname: price.nickname,
    amount: price.unit_amount ? price.unit_amount / 100 : 0,
    interval: price.recurring?.interval,
    intervalCount: price.recurring?.interval_count,
    product: (price.product as Stripe.Product).name,
    metadata: price.metadata,
  }));
};

export const handleWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = subscription.customer as string;
      console.log('INVOICE OBJECT=====>', invoice);
      console.log('SUBSCRIPTION =====>', subscription);

      // Update user's payment status and next billing date
      await db
        .update(paymentsTable)
        .set({
          paymentStatus: 'active',
          nextBillingDate: new Date(subscription.current_period_end * 1000),
          lastUpdated: new Date(),
          // TODO: i need to pass in diaspora-economy, business or first class here
          subscriptionType: 'paid',
        })
        .where(eq(paymentsTable.stripeCustomerId, customerId));
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      const deletedCustomerId = deletedSubscription.customer as string;

      // Update user's payment status to inactive
      await db
        .update(paymentsTable)
        .set({
          paymentStatus: 'inactive',
          subscriptionType: 'free',
          lastUpdated: new Date(),
        })
        .where(eq(paymentsTable.stripeCustomerId, deletedCustomerId));
      break;

    // Add more event handlers as needed
  }
};
