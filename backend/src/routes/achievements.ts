import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

// Define all 50 possible achievements with emoji icons
const ALL_ACHIEVEMENTS = [
  // Streak achievements
  { type: 'streak_7', title: '7-Day Streak', description: 'Completed a habit 7 days in a row', points: 50, icon: '🔥' },
  { type: 'streak_14', title: '14-Day Streak', description: 'Completed a habit 14 days in a row', points: 100, icon: '⚡' },
  { type: 'streak_30', title: '30-Day Streak', description: 'Completed a habit 30 days in a row', points: 250, icon: '💪' },
  { type: 'streak_100', title: '100-Day Streak', description: 'Completed a habit 100 days in a row', points: 500, icon: '🏆' },

  // Habit creation achievements
  { type: 'first_habit', title: 'Getting Started', description: 'Created your first habit', points: 10, icon: '🌱' },
  { type: 'five_habits', title: 'Building Momentum', description: 'Created 5 habits', points: 50, icon: '🌿' },
  { type: 'ten_habits', title: 'Habit Master', description: 'Created 10 habits', points: 100, icon: '🌳' },
  { type: 'twenty_habits', title: 'Habit Legend', description: 'Created 20 habits', points: 200, icon: '🌲' },

  // Completion achievements
  { type: 'first_completion', title: 'First Step', description: 'Completed your first habit', points: 5, icon: '✅' },
  { type: 'ten_completions', title: 'On the Path', description: 'Completed 10 habits total', points: 25, icon: '🛤️' },
  { type: 'fifty_completions', title: 'Habit Enthusiast', description: 'Completed 50 habits total', points: 100, icon: '🚀' },
  { type: 'hundred_completions', title: 'Completion Champion', description: 'Completed 100 habits total', points: 250, icon: '👑' },
  { type: 'five_hundred_completions', title: 'Unstoppable', description: 'Completed 500 habits total', points: 500, icon: '⭐' },

  // Points achievements
  { type: 'hundred_points', title: 'Point Collector', description: 'Earned 100 points', points: 25, icon: '💰' },
  { type: 'five_hundred_points', title: 'Point Accumulator', description: 'Earned 500 points', points: 100, icon: '💎' },
  { type: 'thousand_points', title: 'Point Master', description: 'Earned 1000 points', points: 250, icon: '💸' },
  { type: 'five_thousand_points', title: 'Point Legend', description: 'Earned 5000 points', points: 500, icon: '🤑' },

  // Multi-habit achievements
  { type: 'simultaneous_streaks_2', title: 'Dual Threat', description: 'Maintain 2 simultaneous 7-day streaks', points: 75, icon: '👯' },
  { type: 'simultaneous_streaks_3', title: 'Triple Threat', description: 'Maintain 3 simultaneous 7-day streaks', points: 150, icon: '🎪' },
  { type: 'simultaneous_streaks_5', title: 'Streaking Master', description: 'Maintain 5 simultaneous 7-day streaks', points: 300, icon: '🎭' },

  // Daily consistency
  { type: 'daily_7_days', title: 'Week Warrior', description: 'Complete at least one habit every day for 7 days', points: 75, icon: '⚔️' },
  { type: 'daily_30_days', title: 'Monthly Grind', description: 'Complete at least one habit every day for 30 days', points: 250, icon: '🛡️' },

  // Weekly consistency
  { type: 'weekly_4_weeks', title: 'Weekly Wonder', description: 'Complete at least 4 habits per week for 4 weeks', points: 100, icon: '🎯' },

  // Streak milestones (specific habits)
  { type: 'habit_3_day_streak', title: 'Three-in-a-Row', description: 'Get a 3-day streak on any habit', points: 15, icon: '🎲' },
  { type: 'habit_14_day_streak', title: 'Two Week Wonder', description: 'Get a 14-day streak on any habit', points: 75, icon: '📅' },
  { type: 'habit_50_day_streak', title: 'Fifty Days Strong', description: 'Get a 50-day streak on any habit', points: 300, icon: '📈' },

  // Time-based achievements
  { type: 'early_bird', title: 'Early Bird', description: 'Complete a habit before 8 AM', points: 10, icon: '🌅' },
  { type: 'night_owl', title: 'Night Owl', description: 'Complete a habit after 10 PM', points: 10, icon: '🦉' },

  // Behavioral achievements
  { type: 'comeback', title: 'Comeback Kid', description: 'Restart a habit after breaking a streak', points: 50, icon: '🔄' },
  { type: 'variety_5', title: 'Variety is the Spice', description: 'Complete 5 different habits on the same day', points: 75, icon: '🌈' },

  // Progressive achievements
  { type: 'level_10', title: 'Level 10', description: 'Reach 10 total achievements', points: 50, icon: '🎖️' },
  { type: 'level_25', title: 'Level 25', description: 'Reach 25 total achievements', points: 150, icon: '🥇' },
  { type: 'level_50', title: 'Master Achiever', description: 'Unlock all 50 achievements', points: 1000, icon: '🎯' },

  // Seasonal achievements
  { type: 'spring_2024', title: 'Spring Sprout', description: 'Maintain a 7-day streak during spring', points: 50, icon: '🌸' },
  { type: 'summer_2024', title: 'Summer Sizzle', description: 'Maintain a 14-day streak during summer', points: 100, icon: '☀️' },
  { type: 'fall_2024', title: 'Fall Focus', description: 'Maintain a 14-day streak during fall', points: 100, icon: '🍂' },
  { type: 'winter_2024', title: 'Winter Warrior', description: 'Maintain a 14-day streak during winter', points: 100, icon: '❄️' },

  // Legacy/special
  { type: 'perfect_week', title: 'Perfect Week', description: 'Complete all habit goals for 7 consecutive days', points: 200, icon: '✨' },
  { type: 'consistency_100', title: 'Consistency is Key', description: 'Complete at least 100 habits in a single month', points: 250, icon: '🎪' },
  { type: 'diversity_expert', title: 'Diversity Expert', description: 'Create habits in 10+ different categories', points: 150, icon: '🎨' },
  { type: 'midnight_achiever', title: 'Midnight Achiever', description: 'Earn an achievement between midnight and 1 AM', points: 25, icon: '🌙' },

  // Milestone achievements
  { type: 'one_year_member', title: 'One Year Member', description: 'Use the app for one year', points: 500, icon: '🎂' },
];

export function registerAchievementRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/achievements - Get all unlocked achievements for user
  app.fastify.get('/api/achievements', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching achievements');

    try {
      const userAchievements = await app.db.query.achievements.findMany({
        where: eq(schema.achievements.userId, session.user.id),
      });

      app.logger.info({ userId: session.user.id, count: userAchievements.length }, 'Achievements fetched');
      return userAchievements;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch achievements');
      throw error;
    }
  });

  // GET /api/achievements/available - Get all possible achievements with locked/unlocked status
  app.fastify.get('/api/achievements/available', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching available achievements');

    try {
      const unlockedAchievements = await app.db.query.achievements.findMany({
        where: eq(schema.achievements.userId, session.user.id),
      });

      const unlockedTypes = new Set(unlockedAchievements.map((a) => a.achievementType));

      const availableAchievements = ALL_ACHIEVEMENTS.map((achievement) => ({
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        points: achievement.points,
        icon: achievement.icon,
        locked: !unlockedTypes.has(achievement.type),
      }));

      app.logger.info({ userId: session.user.id, total: availableAchievements.length }, 'Available achievements fetched');
      return availableAchievements;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch available achievements');
      throw error;
    }
  });
}
