import Stripe from 'stripe';
import { tryCatchFn } from '../utils/tryCatch.ts';
import { db } from '../db.ts';
import { paymentsTable } from '../schema/paymentsTable.ts';
import { eq } from 'drizzle-orm';
// import { emailQueue } from '../services/bullMq.ts';
//TODO: Use BULL MQ to handle this
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!); // Set the SendGrid API Key

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

      // Send an email with the invoice
      try {
        // const email = invoice.customer_email;
        // const msg = {
        //   to: email, // Customer's email
        //   from: 'your-email@example.com', // Your email (Sender)
        //   subject: 'Your Invoice from Our Service',
        //   text: `Dear customer,\n\nThank you for your payment! Here is the invoice for your subscription.\nInvoice ID: ${invoice.id}\nAmount: $${(invoice.amount_paid / 100).toFixed(2)}\n\nBest regards,\nYour Company Name`,
        //   html: `
        //     <p>Dear customer,</p>
        //     <p>Thank you for your payment! Here is the invoice for your subscription.</p>
        //     <p><strong>Invoice ID:</strong> ${invoice.id}</p>
        //     <p><strong>Amount:</strong> $${(invoice.amount_paid / 100).toFixed(2)}</p>
        //     <p>Best regards,</p>
        //     <p>Your Company Name</p>
        //   `,
        // };
        // // Then queue the email (non-blocking)
        // await emailQueue.add('send-mail', msg, {
        //   attempts: 3, // Retry 3 times on failure
        //   backoff: {
        //     // Exponential backoff
        //     type: 'exponential',
        //     delay: 1000,
        //   },
        //   removeOnComplete: true,
        // });
        // console.log('Invoice email sent to:', email);
      } catch (error) {
        console.error('Error sending email:', error);
      }
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
