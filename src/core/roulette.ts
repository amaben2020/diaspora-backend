// core/roulette.ts
import { and, eq, ne, not, sql, inArray, desc, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db.ts';
import {
  rouletteMatchesTable,
  rouletteSessionsTable,
} from '../schema/rouletteTable.ts';

const MATCH_DURATION_MS = 2 * 60 * 1000; // 2 minutes in milliseconds
const REMATCH_PREVENTION_COUNT = 5; // Store the last 5 matches to prevent re-matching

/**
 * Find a match for a user or return appropriate status if already in session
 */
export async function findMatch(userId: string) {
  // First, check if user already has an active session
  const existingSession = await db
    .select()
    .from(rouletteSessionsTable)
    .where(eq(rouletteSessionsTable.userId, userId))
    .limit(1);

  // If user already has a session, check its status and validity
  if (existingSession.length > 0) {
    const session = existingSession[0];

    // If user is in a 'matched' state, verify the match is still valid
    if (session.status === 'matched') {
      // Get match details
      const match = await getActiveMatchForSession(session.id);

      // If match exists and is still valid
      if (match) {
        // Check if match has expired but not properly ended
        const now = new Date();
        if (match.scheduledEndTime < now) {
          // This match has expired - end it now before proceeding
          await endMatch(match.id);

          // Return waiting state so user can be rematched
          return {
            message:
              'Your previous match has ended. Looking for a new match now.',
            previousMatchEnded: true,
          };
        }

        // Match is still valid
        return {
          alreadyMatched: true,
          message: "You're already in an active match!",
          matchDetails: match,
          partnerId: await getPartnerIdFromMatch(match, session.id),
        };
      } else {
        // Match not found but user is in matched state - something is wrong
        // Reset user to waiting state
        await db
          .update(rouletteSessionsTable)
          .set({ status: 'waiting' })
          .where(eq(rouletteSessionsTable.id, session.id));
      }
    }

    // If user is in waiting state, check if they've been waiting for too long
    if (session.status === 'waiting') {
      return {
        alreadyWaiting: true,
        message: "You're already in the waiting queue. Please be patient!",
      };
    }
  }

  // Create or update session with previous partners
  const sessionId = randomUUID();
  const currentTime = new Date();

  // Keep previous partners if session exists
  const previousPartners =
    existingSession.length > 0
      ? existingSession[0]?.previousPartners || []
      : [];

  const [session] = await db
    .insert(rouletteSessionsTable)
    .values({
      id: sessionId,
      userId,
      status: 'waiting',
      updatedAt: currentTime,
      previousPartners: previousPartners,
      statusMessage: 'Looking for a match',
    })
    .onConflictDoUpdate({
      target: rouletteSessionsTable.userId,
      set: {
        status: 'waiting',
        updatedAt: currentTime,
        statusMessage: 'Looking for a match',
      },
    })
    .returning();

  // Find compatible partner excluding previous matches
  const partners = await db
    .select()
    .from(rouletteSessionsTable)
    .where(
      and(
        eq(rouletteSessionsTable.status, 'waiting'),
        ne(rouletteSessionsTable.userId, userId),
        // Exclude previous partners (if any)
        session.previousPartners?.length > 0
          ? not(inArray(rouletteSessionsTable.userId, session.previousPartners))
          : sql`1=1`, // Always true if no previous partners
      ),
    )
    .orderBy(rouletteSessionsTable.createdAt)
    .limit(1);

  if (partners.length === 0) {
    return {
      matched: false,
      message:
        "You've been added to the waiting queue. We'll match you as soon as possible!",
    };
  }

  const partner = partners[0];

  // Claim the partner (atomic operation)
  const updatedPartner = await db
    .update(rouletteSessionsTable)
    .set({
      status: 'matched',
      statusMessage: 'In active match',
    })
    .where(
      and(
        eq(rouletteSessionsTable.id, partner.id),
        eq(rouletteSessionsTable.status, 'waiting'),
      ),
    )
    .returning();

  if (updatedPartner.length === 0) {
    return {
      matched: false,
      message:
        "You've been added to the waiting queue. We'll match you as soon as possible!",
    };
  }

  // Update our session and add partner to our previous partners
  const updatedPreviousPartners = [
    ...(session.previousPartners || []),
    partner.userId,
  ];
  // Keep only the most recent partners
  if (updatedPreviousPartners.length > REMATCH_PREVENTION_COUNT) {
    updatedPreviousPartners.shift(); // Remove oldest partner
  }

  await db
    .update(rouletteSessionsTable)
    .set({
      status: 'matched',
      previousPartners: updatedPreviousPartners,
      statusMessage: 'In active match',
    })
    .where(eq(rouletteSessionsTable.id, session.id));

  // Update partner's previous partners to include us
  const partnerPreviousPartners = [...(partner.previousPartners || []), userId];
  if (partnerPreviousPartners.length > REMATCH_PREVENTION_COUNT) {
    partnerPreviousPartners.shift();
  }

  await db
    .update(rouletteSessionsTable)
    .set({ previousPartners: partnerPreviousPartners })
    .where(eq(rouletteSessionsTable.id, partner.id));

  // Create match record with scheduled end time
  const matchId = randomUUID();
  const roomId = randomUUID();
  const scheduledEndTime = new Date(currentTime.getTime() + MATCH_DURATION_MS);

  await db.insert(rouletteMatchesTable).values({
    id: matchId,
    session1Id: session.id,
    session2Id: partner.id,
    roomId,
    startedAt: currentTime,
    scheduledEndTime: scheduledEndTime,
  });

  // Schedule the match to automatically end
  scheduleMatchEnd(matchId, scheduledEndTime);

  return {
    matched: true,
    message: 'Match found! Starting your chat session now.',
    roomId,
    partnerId: partner.userId,
    matchId,
    endsAt: scheduledEndTime,
  };
}

/**
 * End a match and update session statuses
 */
export async function endMatch(matchId: string) {
  // First get the match to ensure it exists and to get session IDs
  const existingMatch = await db
    .select()
    .from(rouletteMatchesTable)
    .where(eq(rouletteMatchesTable.id, matchId))
    .limit(1);

  if (existingMatch.length === 0) {
    return { success: false, message: 'Match not found' };
  }

  const match = existingMatch[0];

  // Only end the match if it hasn't been ended already
  if (match.endedAt === null) {
    await db
      .update(rouletteMatchesTable)
      .set({
        endedAt: new Date(),
      })
      .where(eq(rouletteMatchesTable.id, matchId));

    // Update both sessions to completed status
    await Promise.all([
      db
        .update(rouletteSessionsTable)
        .set({
          status: 'completed',
          statusMessage: 'Match completed',
          updatedAt: new Date(),
        })
        .where(eq(rouletteSessionsTable.id, match.session1Id)),
      db
        .update(rouletteSessionsTable)
        .set({
          status: 'completed',
          statusMessage: 'Match completed',
          updatedAt: new Date(),
        })
        .where(eq(rouletteSessionsTable.id, match.session2Id)),
    ]);

    return { success: true, message: 'Match ended successfully' };
  }

  return { success: false, message: 'Match already ended' };
}

/**
 * Schedule automatic ending of a match
 */
function scheduleMatchEnd(matchId: string, endTime: Date) {
  const timeUntilEnd = endTime.getTime() - Date.now();

  if (timeUntilEnd <= 0) {
    // End immediately if the time has already passed
    endMatch(matchId);
    return;
  }

  setTimeout(async () => {
    try {
      await endMatch(matchId);
      console.log(`Match ${matchId} automatically ended as scheduled.`);
    } catch (error) {
      console.error(`Failed to end match ${matchId}:`, error);
    }
  }, timeUntilEnd);
}

/**
 * Check for expired matches and end them
 * This should be called regularly via a cron job or similar
 */
export async function cleanupExpiredMatches() {
  const now = new Date();

  // Find matches that should have ended but haven't
  const expiredMatches = await db
    .select()
    .from(rouletteMatchesTable)
    .where(and(sql`scheduled_end_time < ${now}`, sql`ended_at IS NULL`));

  console.log(`Found ${expiredMatches.length} expired matches to clean up.`);

  // End each expired match
  const results = await Promise.all(
    expiredMatches.map((match) => endMatch(match.id)),
  );

  const successful = results.filter((r) => r.success).length;

  return {
    ended: successful,
    message:
      successful > 0
        ? `Successfully ended ${successful} expired matches`
        : 'No expired matches needed ending',
  };
}

/**
 * Get active match details for a session
 */
async function getActiveMatchForSession(sessionId: string) {
  const [match = undefined] = await db
    .select()
    .from(rouletteMatchesTable)
    .where(
      and(
        or(
          eq(rouletteMatchesTable.session1Id, sessionId),
          eq(rouletteMatchesTable.session2Id, sessionId),
        ),
        sql`ended_at IS NULL`, // Only active matches
      ),
    )
    .orderBy(desc(rouletteMatchesTable.startedAt))
    .limit(1);

  return match;
}

/**
 * Get partner ID from a match and session ID
 */
async function getPartnerIdFromMatch(match, sessionId: string) {
  const partnerSessionId =
    match.session1Id === sessionId ? match.session2Id : match.session1Id;

  const [partnerSession = undefined] = await db
    .select({
      userId: rouletteSessionsTable.userId,
    })
    .from(rouletteSessionsTable)
    .where(eq(rouletteSessionsTable.id, partnerSessionId));

  return partnerSession?.userId;
}

/**
 * Check user's session status and update if needed
 * This can be called by client to verify/refresh their status
 */
export async function checkSessionStatus(userId: string) {
  // Get the user's session
  const [session = undefined] = await db
    .select()
    .from(rouletteSessionsTable)
    .where(eq(rouletteSessionsTable.userId, userId))
    .limit(1);

  if (!session) {
    return {
      success: true,
      exists: false,
      message: 'No session found for this user.',
    };
  }

  // For matched sessions, validate match is still active
  if (session.status === 'matched') {
    const match = await getActiveMatchForSession(session.id);

    if (!match) {
      // Match not found but user in matched state - reset to completed
      await db
        .update(rouletteSessionsTable)
        .set({
          status: 'completed',
          statusMessage: 'Match not found - reset',
          updatedAt: new Date(),
        })
        .where(eq(rouletteSessionsTable.id, session.id));

      return {
        success: true,
        exists: true,
        session: {
          ...session,
          status: 'completed',
          statusMessage: 'Match not found - reset',
        },
        message: 'Your match has ended.',
      };
    }

    // Check if match has expired
    const now = new Date();
    if (match.scheduledEndTime < now) {
      // This should happen automatically, but if it hasn't, end it now
      await endMatch(match.id);

      return {
        success: true,
        exists: true,
        session: {
          ...session,
          status: 'completed',
          statusMessage: 'Match completed - time expired',
        },
        message: 'Your match has ended due to time expiration.',
      };
    }

    // Match is valid and active - calculate time remaining
    const timeRemaining = Math.max(
      0,
      match.scheduledEndTime.getTime() - now.getTime(),
    );
    const progress = 100 - (timeRemaining / MATCH_DURATION_MS) * 100;

    // Format time remaining in a friendly way
    let timeRemainingFormatted;
    if (timeRemaining <= 0) {
      timeRemainingFormatted = 'less than a minute';
    } else if (timeRemaining < 60000) {
      timeRemainingFormatted = 'less than a minute';
    } else {
      const minutes = Math.floor(timeRemaining / 60000);
      timeRemainingFormatted = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    // Update status message based on time remaining
    let statusMessage = 'In active match';
    if (timeRemaining < 30000) {
      statusMessage = 'In active match with less than 30 seconds remaining';
    } else if (timeRemaining < 60000) {
      statusMessage = 'In active match with less than a minute remaining';
    } else {
      statusMessage = `In active match with ${Math.ceil(timeRemaining / 60000)} minutes remaining`;
    }

    // Update status message in database
    await db
      .update(rouletteSessionsTable)
      .set({ statusMessage })
      .where(eq(rouletteSessionsTable.id, session.id));

    // Get partner info
    const partnerId = await getPartnerIdFromMatch(match, session.id);
    const partner = partnerId ? await getUserDetails(partnerId) : null;

    return {
      success: true,
      exists: true,
      session: {
        ...session,
        statusMessage,
      },
      match: {
        id: match.id,
        roomId: match.roomId,
        startedAt: match.startedAt,
        scheduledEndTime: match.scheduledEndTime,
        timeRemaining,
        progress,
        timeRemainingFormatted,
        partnerId,
        partner,
      },
    };
  }

  // For other statuses, just return the session
  return {
    success: true,
    exists: true,
    session,
  };
}

/**
 * Get match history for a user with enhanced details
 */
export async function getMatchHistory(userId: string, limit = 20) {
  // Get all sessions for this user
  const userSessions = await db
    .select({ id: rouletteSessionsTable.id })
    .from(rouletteSessionsTable)
    .where(eq(rouletteSessionsTable.userId, userId));

  if (userSessions.length === 0) {
    return [];
  }

  const sessionIds = userSessions.map((session) => session.id);

  // Get all matches involving these sessions
  const matches = await db
    .select()
    .from(rouletteMatchesTable)
    .where(
      or(
        inArray(rouletteMatchesTable.session1Id, sessionIds),
        inArray(rouletteMatchesTable.session2Id, sessionIds),
      ),
    )
    .orderBy(desc(rouletteMatchesTable.startedAt))
    .limit(limit);

  // Enhance matches with partner info and additional details
  const enhancedMatches = await Promise.all(
    matches.map(async (match) => {
      // Determine which session is the partner's
      const isSession1 = sessionIds.includes(match.session1Id);
      const partnerSessionId = isSession1 ? match.session2Id : match.session1Id;

      // Get partner info
      const [partnerSession = undefined] = await db
        .select({
          userId: rouletteSessionsTable.userId,
        })
        .from(rouletteSessionsTable)
        .where(eq(rouletteSessionsTable.id, partnerSessionId!));

      // Get partner's user details if available
      let partnerDetails = null;
      if (partnerSession?.userId) {
        try {
          const user = await getUserDetails(partnerSession.userId);
          if (user) {
            partnerDetails = {
              id: user.id,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
            };
          }
        } catch (error) {
          console.error('Failed to get partner details:', error);
        }
      }

      // Calculate duration and status
      let duration = null;
      let status = 'active';

      if (match.endedAt && match.startedAt) {
        duration = match.endedAt.getTime() - match.startedAt.getTime();
        status = 'completed';
      } else if (
        match.scheduledEndTime &&
        match.scheduledEndTime < new Date()
      ) {
        status = 'expired';
        // If match has expired but not ended, calculate duration to scheduled end time
        if (match.startedAt) {
          duration =
            match.scheduledEndTime.getTime() - match.startedAt.getTime();
        }
      }

      // Calculate time remaining for active sessions
      let timeRemaining = 0;
      if (status === 'active' && match.scheduledEndTime) {
        timeRemaining = Math.max(
          0,
          match.scheduledEndTime.getTime() - Date.now(),
        );
      }

      return {
        id: match.id,
        roomId: match.roomId,
        startedAt: match.startedAt,
        endedAt: match.endedAt,
        scheduledEndTime: match.scheduledEndTime,
        status,
        duration,
        timeRemaining,
        partner: {
          userId: partnerSession?.userId,
          ...partnerDetails,
        },
      };
    }),
  );

  return enhancedMatches;
}

/**
 * Start a new session when a user wants to find a new match
 */
export async function startNewSession(userId: string) {
  // First end any existing matches for this user
  const existingSession = await db
    .select()
    .from(rouletteSessionsTable)
    .where(eq(rouletteSessionsTable.userId, userId))
    .limit(1);

  if (existingSession.length > 0) {
    const session = existingSession[0];

    if (session.status === 'matched') {
      // End the active match if there is one
      const match = await getActiveMatchForSession(session.id);
      if (match) {
        await endMatch(match.id);
      }
    }

    // Mark current session as completed
    await db
      .update(rouletteSessionsTable)
      .set({
        status: 'completed',
        statusMessage: 'Session ended by user',
        updatedAt: new Date(),
      })
      .where(eq(rouletteSessionsTable.id, session.id));
  }

  // Now find a new match
  return findMatch(userId);
}

// Helper function to get user details - implement according to your user schema
async function getUserDetails(userId: string) {
  // Placeholder implementation
  // Replace this with your actual user data access logic
  try {
    // This is just a placeholder - replace with your actual implementation
    // For example:
    // const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    // return user[0];

    // For now, return a mock user to prevent errors
    return {
      id: userId,
      displayName: 'User ' + userId.substring(0, 5),
      avatarUrl: `/api/placeholder/40/40`,
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
