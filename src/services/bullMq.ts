import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisConnection } from './ioRedis.ts';

// create a queue
const QUEUE_NAME = 'email';
export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});

// push job to queue in other service

// Worker to process email jobs. A process that pulls jobs from the queue and processes them
new Worker(
  QUEUE_NAME,
  async ({ name, data }) => {
    if (name === 'send-mail') {
      // Send the email to sendgrid
      // await sgMail.send(data);
      console.log('Email sent successfully');
      console.log('data', data);
    }
  },
  {
    connection: redisConnection,
    limiter: {
      max: 10, // Max 10 jobs per second
      duration: 1000,
    },
  },
);

// Queue event listeners
const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

queueEvents.on('completed', ({ jobId }) => {
  console.log(`Job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed:`, failedReason);
});
