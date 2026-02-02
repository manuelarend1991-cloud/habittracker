import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

const BASE_POINTS = 10;

function calculatePoints(currentStreak: number): number {
  return Math.floor(BASE_POINTS * (1 + currentStreak / 10));
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

      // Allow multiple completions per day, but check if we're starting a new day streak
      let newStreak = habit.currentStreak;
      let streakChanged = false;

      if (todayCompletions.length === 0) {
        // This is the first completion of the day, check if we're continuing a streak
        const yesterday = new Date(completedAt);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setUTCHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(yesterdayStart);
        yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() + 1);

        const yesterdayCompletion = await app.db.query.habitCompletions.findFirst({
          where: and(
            eq(schema.habitCompletions.habitId, habitId),
            gte(schema.habitCompletions.completedAt, yesterdayStart),
            lt(schema.habitCompletions.completedAt, yesterdayEnd)
          ),
        });

        if (yesterdayCompletion) {
          newStreak = habit.currentStreak + 1;
        } else {
          newStreak = 1;
        }
        streakChanged = true;
      }

      const points = calculatePoints(newStreak - 1); // Calculate based on streak before this completion

      // Record completion
      const [completion] = await app.db.insert(schema.habitCompletions).values({
        habitId,
        userId: session.user.id,
        completedAt,
        points,
      }).returning();

      // Update habit with new streak and total points
      const maxStreak = streakChanged ? Math.max(habit.maxStreak, newStreak) : habit.maxStreak;
      const totalPoints = habit.totalPoints + points;

      const [updatedHabit] = await app.db.update(schema.habits)
        .set({
          currentStreak: newStreak,
          maxStreak,
          totalPoints,
        })
        .where(eq(schema.habits.id, habitId))
        .returning();

      // Check for achievement unlocks
      await checkAndUnlockAchievements(app, session.user.id, habitId, updatedHabit);

      app.logger.info(
        { userId: session.user.id, habitId, completionId: completion.id, points, streak: newStreak },
        'Habit completion recorded'
      );

      return { completion, updatedHabit };
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

      // Get all completions to recalculate streaks
      const allCompletions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(eq(schema.habitCompletions.habitId, habitId))
        .orderBy(schema.habitCompletions.completedAt);

      // Calculate points based on streak before this completion
      let streakBeforeCompletion = 1;
      for (let i = allCompletions.length - 1; i >= 0; i--) {
        const current = new Date(allCompletions[i].completedAt);
        const currentDayStart = new Date(current);
        currentDayStart.setUTCHours(0, 0, 0, 0);

        if (currentDayStart.getTime() === dayStart.getTime()) {
          // Same day - shouldn't happen due to above check, but handle it
          return reply.status(409).send({ error: 'Completion already exists for this date' });
        }

        if (currentDayStart.getTime() < dayStart.getTime()) {
          // This is before our new completion, count the current streak
          streakBeforeCompletion = 1;
          let checkDate = new Date(currentDayStart);

          for (let j = i + 1; j < allCompletions.length; j++) {
            const checkCompletion = new Date(allCompletions[j].completedAt);
            const checkDayStart = new Date(checkCompletion);
            checkDayStart.setUTCHours(0, 0, 0, 0);

            const daysDiff = Math.floor((checkDayStart.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              streakBeforeCompletion++;
              checkDate = checkDayStart;
            } else {
              break;
            }
          }
          break;
        }
      }

      const points = calculatePoints(streakBeforeCompletion);

      // Record completion
      const [completion] = await app.db.insert(schema.habitCompletions).values({
        habitId,
        userId: session.user.id,
        completedAt,
        points,
      }).returning();

      // Recalculate all streaks from scratch
      const updatedCompletions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(eq(schema.habitCompletions.habitId, habitId))
        .orderBy(schema.habitCompletions.completedAt);

      let currentStreak = 0;
      let maxStreak = habit.maxStreak;
      let totalPoints = 0;

      if (updatedCompletions.length > 0) {
        currentStreak = 1;
        totalPoints = updatedCompletions[0].points;

        for (let i = 1; i < updatedCompletions.length; i++) {
          const current = new Date(updatedCompletions[i].completedAt);
          const previous = new Date(updatedCompletions[i - 1].completedAt);

          const daysDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }

          maxStreak = Math.max(maxStreak, currentStreak);
          totalPoints += updatedCompletions[i].points;
        }
      }

      // Calculate cost as 1.5x the points earned at that streak level
      const COST_MULTIPLIER = 1.5;
      const pointsCost = Math.floor(points * COST_MULTIPLIER);
      totalPoints -= pointsCost;

      // Update habit with recalculated streaks and points
      const [updatedHabit] = await app.db.update(schema.habits)
        .set({
          currentStreak,
          maxStreak,
          totalPoints,
        })
        .where(eq(schema.habits.id, habitId))
        .returning();

      // Check for achievement unlocks
      await checkAndUnlockAchievements(app, session.user.id, habitId, updatedHabit);

      app.logger.info(
        { userId: session.user.id, habitId, completionId: completion.id, pointsEarned: points, pointsCost, streak: currentStreak, totalPoints },
        'Past habit completion recorded with proportional point deduction'
      );

      return {
        completion,
        updatedHabit,
        pointsEarned: points,
        pointsCost,
        message: `Past completion added. ${pointsCost} points deducted.`
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

      // Update habit with recalculated values
      const [updatedHabit] = await app.db.update(schema.habits)
        .set({
          currentStreak,
          totalPoints,
        })
        .where(eq(schema.habits.id, habitId))
        .returning();

      app.logger.info(
        { userId: session.user.id, habitId, completionId: mostRecentCompletion.id },
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

        await app.db.update(schema.habits)
          .set({
            currentStreak,
            totalPoints,
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
