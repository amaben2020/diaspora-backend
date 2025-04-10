// routes/rouletteRouter.ts
import { Router } from 'express';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import {
  rouletteSessionsTable,
  rouletteMatchesTable,
} from '../schema/rouletteTable.ts';
import { db } from '../db.ts';
import {
  findMatch,
  endMatch,
  cleanupExpiredMatches,
  getMatchHistory,
} from '../core/roulette.ts';

const rouletteRouter = Router();

// Constants
const MATCH_DURATION_MS = 5 * 60 * 1000; // 5 minutes default duration

/**
 * Format time remaining in milliseconds to a human-readable string
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'less than a minute';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes <= 0) {
    return `${seconds} seconds`;
  } else if (minutes === 1) {
    return seconds > 0 ? `1 minute ${seconds} seconds` : '1 minute';
  } else {
    return seconds > 0
      ? `${minutes} minutes ${seconds} seconds`
      : `${minutes} minutes`;
  }
}

/**
 * Format duration in milliseconds to a readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return 'less than a second';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get status text for a match
 */
function getStatusText(match): string {
  if (!match.endedAt && match.timeRemaining > 0) {
    return 'Active';
  } else if (!match.endedAt) {
    return 'Ending soon';
  } else {
    return 'Completed';
  }
}

/**
 * Get user details - replace with your actual implementation
 * This is a placeholder that should be replaced with real user lookup logic
 */
async function getUserDetails(userId: string): Promise<void> {
  // In a real implementation, you would query your users table
  // For now, return basic placeholder info
  try {
    // Example: query user from database
    // const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    // return user[0];

    // Placeholder implementation
    return {
      id: userId,
      displayName: `User ${userId.substring(0, 5)}`,
      // Add any other user fields you want to expose to the client
    };
  } catch (error) {
    console.error(`Error fetching user details for ${userId}:`, error);
    return null;
  }
}

/**
 * Start Roulette Session
 * Handles cases where user is already in session
 */
rouletteRouter.post('/roulette/start', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    const result = await findMatch(userId);

    // Enhanced result handling based on status
    if (result.alreadyMatched) {
      return res.status(409).json({
        success: false,
        error: 'already_matched',
        message: result.message,
        matchDetails: result.matchDetails,
        partnerId: result.partnerId,
      });
    }

    if (result.alreadyWaiting) {
      return res.status(409).json({
        success: false,
        error: 'already_waiting',
        message: result.message,
      });
    }

    if (result.matched) {
      return res.json({
        success: true,
        matched: true,
        message: result.message,
        roomId: result.roomId,
        partnerId: result.partnerId,
        matchId: result.matchId,
        endsAt: result.endsAt,
      });
    } else {
      return res.json({
        success: true,
        matched: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Roulette start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start roulette',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * End Roulette Session (manually)
 */
rouletteRouter.post('/roulette/end', async (req, res) => {
  const { matchId, userId } = req.body;

  if (!matchId && !userId) {
    return res.status(400).json({
      success: false,
      error: 'Either matchId or userId is required',
    });
  }

  try {
    let result;

    if (matchId) {
      // End by match ID
      result = await endMatch(matchId);
    } else {
      // End by user ID - find user's active match first
      const [session = undefined] = await db
        .select()
        .from(rouletteSessionsTable)
        .where(eq(rouletteSessionsTable.userId, userId))
        .limit(1);

      if (!session || session.status !== 'matched') {
        return res.status(404).json({
          success: false,
          error: 'no_active_match',
          message: 'User does not have an active match to end',
        });
      }

      // Find match for this session
      const [match = undefined] = await db
        .select()
        .from(rouletteMatchesTable)
        .where(
          and(
            or(
              eq(rouletteMatchesTable.session1Id, session.id),
              eq(rouletteMatchesTable.session2Id, session.id),
            ),
            sql`ended_at IS NULL`,
          ),
        )
        .limit(1);

      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'no_active_match',
          message: 'No active match found for this user',
        });
      }

      result = await endMatch(match.id);
    }

    return res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Roulette end error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      message: 'An unexpected error occurred while ending the session.',
    });
  }
});

/**
 * Get Session Status with enhanced details
 */
rouletteRouter.get('/roulette/status/:userId', async (req, res) => {
  try {
    // Get user's current session
    const [session = undefined] = await db
      .select()
      .from(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.userId, req.params.userId));

    if (!session) {
      return res.json({
        success: true,
        exists: false,
        message: 'No active session found',
      });
    }

    // Session status details with readable messages
    let statusMessage;
    switch (session.status) {
      case 'waiting':
        statusMessage = 'Looking for a match. Please wait...';
        break;
      case 'matched':
        statusMessage = 'You are currently in an active match.';
        break;
      case 'completed':
        statusMessage = 'Your previous session has ended.';
        break;
      default:
        statusMessage = `Session status: ${session.status}`;
    }

    // If session is matched, get match details
    let matchDetails = null;
    if (session.status === 'matched') {
      const [match = undefined] = await db
        .select({
          id: rouletteMatchesTable.id,
          roomId: rouletteMatchesTable.roomId,
          startedAt: rouletteMatchesTable.startedAt,
          scheduledEndTime: rouletteMatchesTable.scheduledEndTime,
          endedAt: rouletteMatchesTable.endedAt,
          session1Id: rouletteMatchesTable.session1Id,
          session2Id: rouletteMatchesTable.session2Id,
        })
        .from(rouletteMatchesTable)
        .where(
          and(
            or(
              eq(rouletteMatchesTable.session1Id, session.id),
              eq(rouletteMatchesTable.session2Id, session.id),
            ),
            sql`ended_at IS NULL`, // Only active matches
          ),
        )
        .orderBy(desc(rouletteMatchesTable.startedAt))
        .limit(1);

      if (match) {
        // Get partner session
        const partnerSessionId =
          match.session1Id === session.id ? match.session2Id : match.session1Id;
        const [partnerSession = undefined] = await db
          .select({
            userId: rouletteSessionsTable.userId,
          })
          .from(rouletteSessionsTable)
          .where(eq(rouletteSessionsTable.id, partnerSessionId));

        // Calculate time remaining and other useful info
        const now = Date.now();
        const timeRemaining = match.scheduledEndTime
          ? Math.max(0, match.scheduledEndTime.getTime() - now)
          : 0;

        const totalDuration =
          match.scheduledEndTime && match.startedAt
            ? match.scheduledEndTime.getTime() - match.startedAt.getTime()
            : MATCH_DURATION_MS;

        const progress =
          totalDuration > 0
            ? Math.min(
                100,
                ((totalDuration - timeRemaining) / totalDuration) * 100,
              )
            : 100;

        // Try to get partner's user details
        let partnerDetails = null;
        try {
          if (partnerSession?.userId) {
            partnerDetails = await getUserDetails(partnerSession.userId);
          }
        } catch (error) {
          console.error('Failed to get partner details:', error);
        }

        matchDetails = {
          id: match.id,
          roomId: match.roomId,
          startedAt: match.startedAt,
          scheduledEndTime: match.scheduledEndTime,
          timeRemaining,
          progress,
          timeRemainingFormatted: formatTimeRemaining(timeRemaining),
          partnerId: partnerSession?.userId,
          partner: partnerDetails,
        };

        // Update status message with time remaining
        statusMessage = `In active match with ${
          timeRemaining > 0
            ? `${formatTimeRemaining(timeRemaining)} remaining`
            : 'ending soon'
        }`;
      } else {
        // Session says matched but no active match exists
        // This is an inconsistent state - let's fix it
        await db
          .update(rouletteSessionsTable)
          .set({ status: 'completed' })
          .where(eq(rouletteSessionsTable.id, session.id));

        statusMessage = 'Previous match has ended.';
      }
    }

    res.json({
      success: true,
      exists: true,
      session: {
        ...session,
        statusMessage,
      },
      match: matchDetails,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: 'An unexpected error occurred while checking status.',
    });
  }
});

/**
 * Cancel Roulette Search or Current Match
 */
rouletteRouter.post('/roulette/cancel', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    // Get user's current session
    const [session = undefined] = await db
      .select()
      .from(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.userId, userId))
      .limit(1);

    if (!session) {
      return res.json({
        success: false,
        error: 'no_active_session',
        message: 'No active session found to cancel',
      });
    }

    if (session.status === 'matched') {
      // User wants to leave a match - need to handle gracefully
      const [match = undefined] = await db
        .select()
        .from(rouletteMatchesTable)
        .where(
          and(
            or(
              eq(rouletteMatchesTable.session1Id, session.id),
              eq(rouletteMatchesTable.session2Id, session.id),
            ),
            sql`ended_at IS NULL`,
          ),
        )
        .limit(1);

      if (match) {
        // End the match for both users
        await endMatch(match.id);
        return res.json({
          success: true,
          action: 'match_ended',
          message: 'Successfully left the current match',
        });
      } else {
        // This is an inconsistent state, fix it
        await db
          .update(rouletteSessionsTable)
          .set({ status: 'completed' })
          .where(eq(rouletteSessionsTable.id, session.id));

        return res.json({
          success: true,
          action: 'session_updated',
          message: 'Session status updated',
        });
      }
    } else if (session.status === 'waiting') {
      // Cancel waiting session
      const result = await db
        .update(rouletteSessionsTable)
        .set({ status: 'completed' })
        .where(eq(rouletteSessionsTable.id, session.id))
        .returning();

      return res.json({
        success: result.length > 0,
        action: 'search_cancelled',
        message: 'Successfully cancelled search',
      });
    } else {
      // Session already completed
      return res.json({
        success: true,
        action: 'already_completed',
        message: 'Session was already completed',
      });
    }
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel search or match',
      message: 'An unexpected error occurred.',
    });
  }
});

/**
 * Get Match History with enhanced details
 */
rouletteRouter.get('/roulette/history/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const matchHistory = await getMatchHistory(req.params.userId, limit);

    // Format each match for display
    const formattedHistory = matchHistory.map((match) => ({
      ...match,
      durationFormatted: match.duration ? formatDuration(match.duration) : null,
      timeRemainingFormatted: match.timeRemaining
        ? formatTimeRemaining(match.timeRemaining)
        : null,
      statusText: getStatusText(match),
    }));

    res.json({
      success: true,
      history: formattedHistory,
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history',
      message: 'An unexpected error occurred while fetching match history.',
    });
  }
});

/**
 * Cleanup endpoint for expired matches
 */
rouletteRouter.post('/roulette/cleanup', async (req, res) => {
  try {
    const result = await cleanupExpiredMatches();
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up expired matches',
      message: 'An unexpected error occurred during cleanup.',
    });
  }
});

/**
 * Get analytics and statistics for roulette system
 */
rouletteRouter.get('/roulette/stats', async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get active user count (waiting or matched)
    const activeUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(rouletteSessionsTable)
      .where(
        and(
          or(
            eq(rouletteSessionsTable.status, 'waiting'),
            eq(rouletteSessionsTable.status, 'matched'),
          ),
          sql`updated_at > ${oneDayAgo}`,
        ),
      );

    // Get waiting users count
    const waitingUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(rouletteSessionsTable)
      .where(eq(rouletteSessionsTable.status, 'waiting'));

    // Get active matches count
    const activeMatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(rouletteMatchesTable)
      .where(sql`ended_at IS NULL`);

    // Get matches in past 24 hours
    const recentMatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(rouletteMatchesTable)
      .where(sql`started_at > ${oneDayAgo}`);

    // Get average match duration
    const avgDuration = await db
      .select({
        avg: sql<number>`avg(extract(epoch from (ended_at - started_at))) * 1000`,
      })
      .from(rouletteMatchesTable)
      .where(and(sql`ended_at IS NOT NULL`, sql`started_at > ${oneDayAgo}`));

    res.json({
      success: true,
      stats: {
        activeUsers: activeUsers[0]?.count || 0,
        waitingUsers: waitingUsers[0]?.count || 0,
        activeMatches: activeMatches[0]?.count || 0,
        matchesLast24h: recentMatches[0]?.count || 0,
        avgMatchDurationMs: Math.round(avgDuration[0]?.avg || 0),
        timestamp: now,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: 'An unexpected error occurred while fetching statistics.',
    });
  }
});

export default rouletteRouter;
