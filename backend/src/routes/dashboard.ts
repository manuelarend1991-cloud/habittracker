import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, gte, lt } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerDashboardRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/dashboard - Get dashboard summary
  app.fastify.get('/api/dashboard', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching dashboard');

    try {
      // Get all habits for user with completions
      const habits = await app.db.query.habits.findMany({
        where: eq(schema.habits.userId, session.user.id),
        with: {
          completions: true,
        },
      });

      // Get fresh totalPoints from database to ensure we have the latest values
      // (not cached from the relation query)
      const habitRecords = await app.db
        .select()
        .from(schema.habits)
        .where(eq(schema.habits.userId, session.user.id));

      // Get total points from fresh data
      let totalPoints = 0;
      habitRecords.forEach((habit) => {
        totalPoints += habit.totalPoints;
      });

      // Get last 7 days completions for each habit
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const habitsWithRecent = habits.map((habit) => {
        const recentCompletions = habit.completions
          .filter((c) => new Date(c.completedAt) >= sevenDaysAgo)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 7);

        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          currentStreak: habit.currentStreak,
          maxStreak: habit.maxStreak,
          lastMissedCompletionDate: habit.lastMissedCompletionDate,
          recentCompletions: recentCompletions.map((c) => ({
            id: c.id,
            completedAt: c.completedAt,
            points: c.points,
            isMissedCompletion: c.isMissedCompletion,
          })),
        };
      });

      // Get last 3 achievements
      const recentAchievements = await app.db.query.achievements.findMany({
        where: eq(schema.achievements.userId, session.user.id),
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
        { userId: session.user.id, habitsCount: habits.length, totalPoints },
        'Dashboard fetched successfully'
      );

      return dashboard;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch dashboard');
      throw error;
    }
  });
}
