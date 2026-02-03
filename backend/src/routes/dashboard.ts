import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, gte, lt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { calculateNextCompletionPoints } from './completions.js';

// Default user ID for unauthenticated users
const DEFAULT_USER_ID = 'anonymous-user';

// Helper function to get user ID - uses authenticated user if available, otherwise returns default
async function getUserId(request: FastifyRequest): Promise<string> {
  try {
    // Try to get user from request context (set by Better Auth middleware)
    const user = (request as any).user;
    if (user?.id) {
      return user.id;
    }
  } catch (error) {
    // No valid session, use default
  }
  return DEFAULT_USER_ID;
}

export function registerDashboardRoutes(app: App) {

  // GET /api/dashboard - Get dashboard summary (works with or without authentication)
  app.fastify.get('/api/dashboard', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const userId = await getUserId(request);

    app.logger.info({ userId }, 'Fetching dashboard');

    try {
      // Get all habits for user with completions
      const habits = await app.db.query.habits.findMany({
        where: eq(schema.habits.userId, userId),
        with: {
          completions: true,
        },
      });

      // Get fresh totalPoints from database to ensure we have the latest values
      // (not cached from the relation query)
      const habitRecords = await app.db
        .select()
        .from(schema.habits)
        .where(eq(schema.habits.userId, userId));

      // Get total points from fresh data
      let totalPoints = 0;
      habitRecords.forEach((habit) => {
        totalPoints += habit.totalPoints;
      });

      // Get last 7 days completions for each habit
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const habitsWithRecent = await Promise.all(habits.map(async (habit) => {
        const recentCompletions = habit.completions
          .filter((c) => new Date(c.completedAt) >= sevenDaysAgo)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 7);

        // Count today's completions
        const todayStart = new Date(now);
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

        const completionsToday = habit.completions.filter((c) => {
          const completedDate = new Date(c.completedAt);
          return completedDate >= todayStart && completedDate < todayEnd;
        }).length;

        // Calculate nextCompletionPoints based on goal completion status
        const nextCompletionPoints = await calculateNextCompletionPoints(
          app,
          habit.id,
          completionsToday,
          habit.goalCount
        );

        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          goalCount: habit.goalCount,
          currentStreak: habit.currentStreak,
          maxStreak: habit.maxStreak,
          completionsToday,
          nextCompletionPoints,
          lastMissedCompletionDate: habit.lastMissedCompletionDate,
          recentCompletions: recentCompletions.map((c) => ({
            id: c.id,
            completedAt: c.completedAt,
            points: c.points,
            isMissedCompletion: c.isMissedCompletion,
          })),
        };
      }));

      // Get last 3 achievements
      const recentAchievements = await app.db.query.achievements.findMany({
        where: eq(schema.achievements.userId, userId),
        orderBy: [desc(schema.achievements.unlockedAt)],
        limit: 3,
      });

      const dashboard = {
        habits: habitsWithRecent,
        totalPoints,
        recentAchievements: recentAchievements.map((a) => ({
          id: a.id,
          habitId: a.habitId,
          achievementType: a.achievementType,
          title: a.title,
          description: a.description,
          points: a.points,
          unlockedAt: a.unlockedAt,
        })),
      };

      app.logger.info(
        { userId, habitsCount: habits.length, totalPoints },
        'Dashboard fetched successfully'
      );

      return dashboard;
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch dashboard');
      throw error;
    }
  });
}
