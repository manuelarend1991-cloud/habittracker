import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

// Calculate points based on streak length (points = streak length, minimum 1)
function calculatePoints(streakLength: number): number {
  return Math.max(1, streakLength);
}

// Calculate points based on days since last plaster within current streak, or since streak start if no plaster
async function calculatePointsSinceLastPlasterOrStreakStart(
  app: App,
  completionDate: Date,
  habitId: string,
  goalCount: number
): Promise<number> {
  // Get all completions for this habit, ordered chronologically
  const allCompletions = await app.db
    .select()
    .from(schema.habitCompletions)
    .where(eq(schema.habitCompletions.habitId, habitId))
    .orderBy(schema.habitCompletions.completedAt);

  if (allCompletions.length === 0) {
    // First completion ever
    return 1;
  }

  // Find the current streak by working backwards from today
  // A streak is a series of consecutive days where the goal was met (including plasters)

  // Group completions by day to check if goal was met each day
  const completionsByDay: { [dateKey: string]: any[] } = {};
  allCompletions.forEach(comp => {
    const date = new Date(comp.completedAt);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!completionsByDay[dateKey]) {
      completionsByDay[dateKey] = [];
    }
    completionsByDay[dateKey].push(comp);
  });

  // Work backwards from today to find streak boundaries
  const today = new Date(completionDate);
  today.setUTCHours(0, 0, 0, 0);

  let streakStart: Date | null = null;
  let currentDate = new Date(today);

  // Go backwards to find where streak started
  while (true) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayCompletions = completionsByDay[dateKey] || [];

    // If this day has goal-count completions (including plasters), it's part of the streak
    if (dayCompletions.length >= goalCount) {
      streakStart = new Date(currentDate);
      currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    } else {
      // Hit a day without enough completions, streak started after this
      break;
    }

    // Safety check: don't go back more than 1000 days
    if (currentDate < new Date(today.getTime() - 1000 * 24 * 60 * 60 * 1000)) {
      break;
    }
  }

  // If no streak start found, use the date of the first completion
  if (streakStart === null && allCompletions.length > 0) {
    streakStart = new Date(allCompletions[0].completedAt);
    streakStart.setUTCHours(0, 0, 0, 0);
  }

  // Now find the most recent plaster (missed completion) within the current streak
  let lastPlasterDate: Date | null = null;
  for (let i = allCompletions.length - 1; i >= 0; i--) {
    const comp = allCompletions[i];
    const compDate = new Date(comp.completedAt);
    compDate.setUTCHours(0, 0, 0, 0);

    // Check if this plaster is within the current streak (after streakStart)
    if (comp.isMissedCompletion && streakStart && compDate >= streakStart) {
      lastPlasterDate = new Date(comp.completedAt);
      break;
    }
  }

  // Calculate days
  let pointsToAward = 1;
  if (lastPlasterDate) {
    // Days since the last plaster
    const daysDiff = Math.floor((completionDate.getTime() - lastPlasterDate.getTime()) / (1000 * 60 * 60 * 24));
    pointsToAward = Math.max(1, daysDiff);
  } else if (streakStart) {
    // Days since the first day of the current streak
    const daysDiff = Math.floor((completionDate.getTime() - streakStart.getTime()) / (1000 * 60 * 60 * 24));
    pointsToAward = Math.max(1, daysDiff);
  }

  return pointsToAward;
}

// Check if any completions in the habit are marked as missed
async function hasMissedCompletions(app: App, habitId: string): Promise<boolean> {
  const missedCompletions = await app.db.query.habitCompletions.findFirst({
    where: and(
      eq(schema.habitCompletions.habitId, habitId),
      eq(schema.habitCompletions.isMissedCompletion, true)
    ),
  });

  return missedCompletions !== undefined;
}

// Get the most recent non-missed completion date for a habit
async function getLastNonMissedCompletionDate(app: App, habitId: string): Promise<Date | null> {
  const lastNonMissed = await app.db
    .select()
    .from(schema.habitCompletions)
    .where(and(
      eq(schema.habitCompletions.habitId, habitId),
      eq(schema.habitCompletions.isMissedCompletion, false)
    ))
    .orderBy(desc(schema.habitCompletions.completedAt))
    .limit(1);

  return lastNonMissed.length > 0 ? new Date(lastNonMissed[0].completedAt) : null;
}

// Get the most recent missed completion date for a habit (for tracking purposes)
async function getLastMissedCompletionDate(app: App, habitId: string): Promise<Date | null> {
  const lastMissed = await app.db
    .select()
    .from(schema.habitCompletions)
    .where(and(
      eq(schema.habitCompletions.habitId, habitId),
      eq(schema.habitCompletions.isMissedCompletion, true)
    ))
    .orderBy(desc(schema.habitCompletions.completedAt))
    .limit(1);

  return lastMissed.length > 0 ? new Date(lastMissed[0].completedAt) : null;
}

// Helper function to calculate next completion points for a habit
// Used by both completions and dashboard endpoints
export async function calculateNextCompletionPoints(
  app: App,
  habitId: string,
  goalCount: number,
  completionsToday: number
): Promise<number> {
  if (completionsToday >= goalCount) {
    // Goal already met today, no more points
    return 0;
  }

  // Goal not yet met, calculate what points would be earned when goal is met
  const today = new Date();
  const points = await calculatePointsSinceLastPlasterOrStreakStart(app, today, habitId, goalCount);
  return points;
}

async function checkAndUnlockAchievements(
  app: App,
  userId: string,
  habitId: string,
  habit: any
) {
  const achievementThresholds = [
    { type: 'streak_7', streak: 7, title: '7-Day Streak', description: 'Completed a habit 7 days in a row', points: 50 },
    { type: 'streak_14', streak: 14, title: '14-Day Streak', description: 'Completed a habit 14 days in a row', points: 100 },
    { type: 'streak_30', streak: 30, title: '30-Day Streak', description: 'Completed a habit 30 days in a row', points: 250 },
    { type: 'streak_100', streak: 100, title: '100-Day Streak', description: 'Completed a habit 100 days in a row', points: 500 },
  ];

  for (const threshold of achievementThresholds) {
    if (habit.currentStreak === threshold.streak) {
      // Check if this achievement already exists
      const existing = await app.db.query.achievements.findFirst({
        where: and(
          eq(schema.achievements.userId, userId),
          eq(schema.achievements.habitId, habitId),
          eq(schema.achievements.achievementType, threshold.type)
        ),
      });

      if (!existing) {
        await app.db.insert(schema.achievements).values({
          userId,
          habitId,
          achievementType: threshold.type,
          title: threshold.title,
          description: threshold.description,
          points: threshold.points,
          unlockedAt: new Date(),
        });

        app.logger.info(
          { userId, habitId, achievementType: threshold.type },
          'Achievement unlocked'
        );
      }
    }
  }
}

export function registerCompletionRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/habits/:habitId/completions - Get completions for a habit
  app.fastify.get('/api/habits/:habitId/completions', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { habitId } = request.params as { habitId: string };

    app.logger.info({ userId: session.user.id, habitId }, 'Fetching completions');

    try {
      const completions = await app.db.query.habitCompletions.findMany({
        where: eq(schema.habitCompletions.habitId, habitId),
      });

      app.logger.info({ userId: session.user.id, habitId, count: completions.length }, 'Completions fetched');
      return completions;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, habitId }, 'Failed to fetch completions');
      throw error;
    }
  });

  // POST /api/habits/:habitId/complete - Record a completion
  app.fastify.post('/api/habits/:habitId/complete', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { habitId } = request.params as { habitId: string };
    const body = request.body as { completedAt?: string };

    app.logger.info({ userId: session.user.id, habitId, body }, 'Recording habit completion');

    try {
      // Get the habit
      const habit = await app.db.query.habits.findFirst({
        where: eq(schema.habits.id, habitId),
      });

      if (!habit) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Habit not found');
        return reply.status(404).send({ error: 'Habit not found' });
      }

      if (habit.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Unauthorized completion attempt');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();

      // Check if today already has a completion to determine if this is the first completion of the day
      const dayStart = new Date(completedAt);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const todayCompletions = await app.db.query.habitCompletions.findMany({
        where: and(
          eq(schema.habitCompletions.habitId, habitId),
          gte(schema.habitCompletions.completedAt, dayStart),
          lt(schema.habitCompletions.completedAt, dayEnd)
        ),
      });

      const completionsToday = todayCompletions.length;
      const goalMet = completionsToday + 1 === habit.goalCount;
      const goalAlreadyMet = completionsToday >= habit.goalCount;

      // Calculate points only when goal is exactly met
      let points = 0;
      if (goalMet) {
        // Goal is being met with this completion
        const completedAtDate = new Date(completedAt);
        points = await calculatePointsSinceLastPlasterOrStreakStart(app, completedAtDate, habitId, habit.goalCount);
      }

      // Allow multiple completions per day, but check if we're starting a new day streak
      // Streak is based on whether the goal was met yesterday
      let newStreak = habit.currentStreak;
      let streakChanged = false;

      if (completionsToday === 0) {
        // This is the first completion of the day, check if yesterday's goal was met
        const yesterday = new Date(completedAt);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setUTCHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(yesterdayStart);
        yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() + 1);

        const yesterdayCompletions = await app.db.query.habitCompletions.findMany({
          where: and(
            eq(schema.habitCompletions.habitId, habitId),
            gte(schema.habitCompletions.completedAt, yesterdayStart),
            lt(schema.habitCompletions.completedAt, yesterdayEnd)
          ),
        });

        // Streak continues if yesterday's goal was met (goalCount completions)
        if (yesterdayCompletions.length >= habit.goalCount) {
          newStreak = habit.currentStreak + 1;
        } else {
          newStreak = 1;
        }
        streakChanged = true;
      }

      // Record completion
      const [completion] = await app.db.insert(schema.habitCompletions).values({
        habitId,
        userId: session.user.id,
        completedAt,
        points,
      }).returning();

      // Update habit with new streak and total points
      // Only update streak if we're at the first completion of the day or if goal just became met
      const maxStreak = streakChanged ? Math.max(habit.maxStreak, newStreak) : habit.maxStreak;
      const totalPoints = habit.totalPoints + points;

      const [updatedHabit] = await app.db.update(schema.habits)
        .set({
          currentStreak: streakChanged ? newStreak : habit.currentStreak,
          maxStreak,
          totalPoints,
          pointStreakReset: false,
          // Keep lastMissedCompletionDate for tracking purposes (not used in point calculation anymore)
        })
        .where(eq(schema.habits.id, habitId))
        .returning();

      // Check for achievement unlocks (only if points were awarded)
      if (points > 0) {
        await checkAndUnlockAchievements(app, session.user.id, habitId, updatedHabit);
      }

      app.logger.info(
        { userId: session.user.id, habitId, completionId: completion.id, completionsToday, goalCount: habit.goalCount, goalMet, pointsEarned: points, streak: updatedHabit.currentStreak },
        'Habit completion recorded'
      );

      return { completion, updatedHabit, pointsEarned: points, completionsToday: completionsToday + 1, goalCount: habit.goalCount, goalMet };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, habitId }, 'Failed to record completion');
      throw error;
    }
  });

  // POST /api/habits/:habitId/complete-past - Record a completion for a past date
  app.fastify.post('/api/habits/:habitId/complete-past', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { habitId } = request.params as { habitId: string };
    const body = request.body as { completedAt: string };

    app.logger.info({ userId: session.user.id, habitId, body }, 'Recording past habit completion');

    try {
      // Validate completedAt is provided
      if (!body.completedAt) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Missing completedAt in request');
        return reply.status(400).send({ error: 'completedAt is required' });
      }

      const completedAt = new Date(body.completedAt);

      // Validate date is valid
      if (isNaN(completedAt.getTime())) {
        app.logger.warn({ userId: session.user.id, habitId, completedAt: body.completedAt }, 'Invalid date format');
        return reply.status(400).send({ error: 'Invalid date format' });
      }

      // Validate date is in the past
      const now = new Date();
      const today = new Date(now);
      today.setUTCHours(23, 59, 59, 999);

      if (completedAt > today) {
        app.logger.warn({ userId: session.user.id, habitId, completedAt }, 'Attempted to add future completion');
        return reply.status(400).send({ error: 'Date must be in the past' });
      }

      // Get the habit
      const habit = await app.db.query.habits.findFirst({
        where: eq(schema.habits.id, habitId),
      });

      if (!habit) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Habit not found');
        return reply.status(404).send({ error: 'Habit not found' });
      }

      if (habit.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Unauthorized past completion attempt');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      // Check if user has enough points (fixed cost of 10)
      // Must check user's TOTAL points across ALL habits
      const PAST_COMPLETION_COST = 10;
      const userHabits = await app.db
        .select()
        .from(schema.habits)
        .where(eq(schema.habits.userId, session.user.id));

      let userTotalPoints = 0;
      userHabits.forEach((h) => {
        userTotalPoints += h.totalPoints;
      });

      if (userTotalPoints < PAST_COMPLETION_COST) {
        app.logger.warn({ userId: session.user.id, habitId, userTotalPoints }, 'Insufficient total points for past completion');
        return reply.status(400).send({ error: 'Not enough points for this!' });
      }

      // Check for existing completion on the same day
      const dayStart = new Date(completedAt);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const existingCompletion = await app.db.query.habitCompletions.findFirst({
        where: and(
          eq(schema.habitCompletions.habitId, habitId),
          gte(schema.habitCompletions.completedAt, dayStart),
          lt(schema.habitCompletions.completedAt, dayEnd)
        ),
      });

      if (existingCompletion) {
        app.logger.warn({ userId: session.user.id, habitId, completedAt }, 'Completion already exists for this date');
        return reply.status(409).send({ error: 'Completion already exists for this date' });
      }

      // Record completion with 0 points (missed completion earns no points)
      const [completion] = await app.db.insert(schema.habitCompletions).values({
        habitId,
        userId: session.user.id,
        completedAt,
        points: 0,
        isMissedCompletion: true,
      }).returning();

      // Recalculate all streaks from scratch
      const allCompletions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(eq(schema.habitCompletions.habitId, habitId))
        .orderBy(schema.habitCompletions.completedAt);

      let currentStreak = 0;
      let maxStreak = habit.maxStreak;
      let totalPoints = 0;

      if (allCompletions.length > 0) {
        currentStreak = 1;
        totalPoints = allCompletions[0].points;

        for (let i = 1; i < allCompletions.length; i++) {
          const current = new Date(allCompletions[i].completedAt);
          const previous = new Date(allCompletions[i - 1].completedAt);

          const daysDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }

          maxStreak = Math.max(maxStreak, currentStreak);
          totalPoints += allCompletions[i].points;
        }
      }

      // Deduct fixed 10 point cost and ensure points don't go below 0
      totalPoints = Math.max(0, totalPoints - PAST_COMPLETION_COST);

      // Update habit with recalculated streaks, points, and set lastMissedCompletionDate
      const [updatedHabit] = await app.db.update(schema.habits)
        .set({
          currentStreak,
          maxStreak,
          totalPoints,
          pointStreakReset: true,
          lastMissedCompletionDate: completedAt, // Track the date of the missed completion
        })
        .where(eq(schema.habits.id, habitId))
        .returning();

      // Check for achievement unlocks
      await checkAndUnlockAchievements(app, session.user.id, habitId, updatedHabit);

      app.logger.info(
        { userId: session.user.id, habitId, completionId: completion.id, pointsCost: PAST_COMPLETION_COST, streak: currentStreak, totalPoints },
        'Past habit completion recorded with point deduction and streak reset'
      );

      return {
        completion,
        updatedHabit,
        pointsEarned: 0,
        pointsCost: PAST_COMPLETION_COST,
        totalPoints,
        message: `Past completion added. ${PAST_COMPLETION_COST} points deducted. Your next completion will earn 1 point (streak point worthiness reset).`
      };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, habitId }, 'Failed to record past completion');
      throw error;
    }
  });

  // DELETE /api/habits/:habitId/complete-today - Remove the most recent completion for today
  app.fastify.delete('/api/habits/:habitId/complete-today', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { habitId } = request.params as { habitId: string };

    app.logger.info({ userId: session.user.id, habitId }, 'Removing today\'s completion');

    try {
      // Get the habit
      const habit = await app.db.query.habits.findFirst({
        where: eq(schema.habits.id, habitId),
      });

      if (!habit) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Habit not found');
        return reply.status(404).send({ error: 'Habit not found' });
      }

      if (habit.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, habitId }, 'Unauthorized completion removal attempt');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      // Find today's completions
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const todayCompletions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(and(
          eq(schema.habitCompletions.habitId, habitId),
          gte(schema.habitCompletions.completedAt, dayStart),
          lt(schema.habitCompletions.completedAt, dayEnd)
        ))
        .orderBy(desc(schema.habitCompletions.createdAt));

      if (todayCompletions.length === 0) {
        app.logger.warn({ userId: session.user.id, habitId }, 'No completions found for today');
        return reply.status(404).send({ error: 'No completions found for today' });
      }

      // Remove the most recent completion
      const mostRecentCompletion = todayCompletions[0];
      await app.db.delete(schema.habitCompletions).where(eq(schema.habitCompletions.id, mostRecentCompletion.id));

      // Recalculate streaks
      const allCompletions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(eq(schema.habitCompletions.habitId, habitId))
        .orderBy(schema.habitCompletions.completedAt);

      let currentStreak = 0;
      let maxStreak = habit.maxStreak;
      let totalPoints = 0;

      if (allCompletions.length > 0) {
        currentStreak = 1;
        totalPoints = allCompletions[0].points;

        for (let i = 1; i < allCompletions.length; i++) {
          const current = new Date(allCompletions[i].completedAt);
          const previous = new Date(allCompletions[i - 1].completedAt);

          const daysDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }

          maxStreak = Math.max(maxStreak, currentStreak);
          totalPoints += allCompletions[i].points;
        }
      }

      // Check if there are any missed completions and get the most recent one
      const hasMissed = await hasMissedCompletions(app, habitId);
      const lastMissedDate = hasMissed ? await getLastMissedCompletionDate(app, habitId) : null;

      // Update habit with recalculated values and lastMissedCompletionDate
      const [updatedHabit] = await app.db.update(schema.habits)
        .set({
          currentStreak,
          totalPoints,
          pointStreakReset: hasMissed,
          lastMissedCompletionDate: lastMissedDate,
        })
        .where(eq(schema.habits.id, habitId))
        .returning();

      app.logger.info(
        { userId: session.user.id, habitId, completionId: mostRecentCompletion.id, hasMissedCompletions: hasMissed },
        'Today\'s completion removed and streaks recalculated'
      );

      return { updatedHabit };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, habitId }, 'Failed to remove today\'s completion');
      throw error;
    }
  });

  // DELETE /api/completions/:id - Delete a completion
  app.fastify.delete('/api/completions/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    app.logger.info({ userId: session.user.id, completionId: id }, 'Deleting completion');

    try {
      // Get the completion
      const completion = await app.db.query.habitCompletions.findFirst({
        where: eq(schema.habitCompletions.id, id),
      });

      if (!completion) {
        app.logger.warn({ userId: session.user.id, completionId: id }, 'Completion not found');
        return reply.status(404).send({ error: 'Completion not found' });
      }

      if (completion.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, completionId: id }, 'Unauthorized deletion attempt');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      // Delete the completion
      await app.db.delete(schema.habitCompletions).where(eq(schema.habitCompletions.id, id));

      // Recalculate habit streaks and points
      const habit = await app.db.query.habits.findFirst({
        where: eq(schema.habits.id, completion.habitId),
      });

      if (habit) {
        // Get all remaining completions sorted by date
        const completions = await app.db
          .select()
          .from(schema.habitCompletions)
          .where(eq(schema.habitCompletions.habitId, habit.id))
          .orderBy(schema.habitCompletions.completedAt);

        let currentStreak = 0;
        let maxStreak = habit.maxStreak;
        let totalPoints = 0;

        if (completions.length > 0) {
          // Calculate new streaks
          currentStreak = 1;
          totalPoints = completions[0].points;

          for (let i = 1; i < completions.length; i++) {
            const current = new Date(completions[i].completedAt);
            const previous = new Date(completions[i - 1].completedAt);

            const daysDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }

            maxStreak = Math.max(maxStreak, currentStreak);
            totalPoints += completions[i].points;
          }
        }

        // Check if there are any missed completions and get the most recent one
        const hasMissed = await hasMissedCompletions(app, habit.id);
        const lastMissedDate = hasMissed ? await getLastMissedCompletionDate(app, habit.id) : null;

        await app.db.update(schema.habits)
          .set({
            currentStreak,
            totalPoints,
            pointStreakReset: hasMissed,
            lastMissedCompletionDate: lastMissedDate,
          })
          .where(eq(schema.habits.id, habit.id));
      }

      app.logger.info({ userId: session.user.id, completionId: id }, 'Completion deleted successfully');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, completionId: id }, 'Failed to delete completion');
      throw error;
    }
  });
}
