import type { Request, Response } from 'express';

import { eq } from 'drizzle-orm';
import {
  createStripeCustomer,
  createSubscription,
  // getCustomerByUserId,
  getSubscriptionPlans,
} from '../../services/stripeService.ts';
import { db } from '../../db.ts';
import { paymentsTable } from '../../schema/paymentsTable.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await getSubscriptionPlans();
    console.log('Plans', plans);
    const appPlans = plans.filter((plan) => plan.product.includes('Diaspora'));
    res.json(appPlans);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

// export const getCustomer = tryCatchFn(async (req, res) => {
//   const { userId } = req.params;

//   const customer = await getCustomerByUserId(userId ?? '');

//   return res.json({ customerId: customer?.stripeCustomerId });
// });

export const createCustomer = tryCatchFn(async (req, res) => {
  const { userId, email } = req.body;

  try {
    // Check if user already has a Stripe customer ID
    const existingPayment = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, userId));

    if (existingPayment.length > 0 && existingPayment[0].stripeCustomerId) {
      return res.json({ customerId: existingPayment[0].stripeCustomerId });
    }

    const customer = await createStripeCustomer(userId, email);
    return res.json({ customerId: customer.id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Failed to create Stripe customer' });
  }
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { userId, priceId } = req.body;

  try {
    // Get user's Stripe customer ID
    const paymentRecord = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, userId));

    if (!paymentRecord.length || !paymentRecord[0].stripeCustomerId) {
      return res.status(400).json({ error: 'User has no Stripe customer ID' });
    }

    const { subscriptionId, clientSecret } = await createSubscription(
      paymentRecord[0].stripeCustomerId,
      priceId,
      userId,
    );

    return res.json({ subscriptionId, clientSecret });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const paymentRecord = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, userId));

    if (!paymentRecord.length) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    return res.json({
      subscriptionType: paymentRecord[0].subscriptionType,
      paymentStatus: paymentRecord[0].paymentStatus,
      nextBillingDate: paymentRecord[0].nextBillingDate,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

export const getOrCreateCustomer = tryCatchFn(async (req, res) => {
  const { userId, email } = req.body;

  // Check for existing customer
  const [existingPayment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId))
    .limit(1);

  if (existingPayment?.stripeCustomerId) {
    return res.json({
      customerId: existingPayment.stripeCustomerId,
      isNew: false,
    });
  }

  // Create new customer if none exists
  const customer = await createStripeCustomer(userId, email);

  await db.insert(paymentsTable).values({
    userId,
    stripeCustomerId: customer.id,
    subscriptionType: 'free',
    paymentStatus: 'inactive',
  });

  res.json({
    customerId: customer.id,
    isNew: true,
  });
});

export const getCustomer = tryCatchFn(async (req, res) => {
  const { userId } = req.params;

  const [payment] = await db
    .select({ customerId: paymentsTable.stripeCustomerId })
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId))
    .limit(1);

  if (!payment) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json({ customerId: payment.customerId });
});
