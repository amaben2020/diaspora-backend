import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.ts';
import { getHelpTable } from '../schema/getHelpTable.ts';
import { tryCatchFn } from '../utils/tryCatch.ts';

const getHelpRoute = Router();

getHelpRoute.get('/get-help', async (_req, res) => {
  const helpEntries = await db.select().from(getHelpTable);
  res.json(helpEntries);
});

getHelpRoute.post(
  '/get-help',
  tryCatchFn(async (req, res) => {
    const { email, message, screenshot } = req.body;

    // Validate input
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    const helpEntry = await db
      .insert(getHelpTable)
      .values({
        id: randomUUID(),
        email,
        message,
        screenshot: screenshot ?? null,
      })
      .returning();

    res.json({ success: true, help: helpEntry });
  }),
);

export default getHelpRoute;
