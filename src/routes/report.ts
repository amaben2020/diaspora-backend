import { Router } from 'express';
import { db } from '../db.ts';
import { eq } from 'drizzle-orm';
import { reportsTable } from '../schema/reportTable.ts';
import { randomUUID } from 'crypto';
const reportsRouter = Router();

// Get all reports

reportsRouter.post('/report', async (req, res) => {
  const { reporterId, reportedId, reason, details } = req.body;

  try {
    // Validate input
    if (!reporterId || !reportedId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent self-reports
    if (reporterId === reportedId) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Create report
    const report = await db
      .insert(reportsTable)
      .values({
        id: randomUUID(),
        reporterId,
        reportedId,
        reason,
        details,
      })
      .returning();

    res.json({ success: true, report });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

reportsRouter.get('/reports', async (req, res) => {
  try {
    const reports = await db.select().from(reportsTable);

    return res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status
reportsRouter.patch('/report/:id', async (req, res) => {
  const { status } = req.body;

  try {
    const report = await db
      .update(reportsTable)
      .set({ status })
      .where(eq(reportsTable.id, req.params.id))
      .returning();

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

export default reportsRouter;
