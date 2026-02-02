import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

// Habits table
export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').default('star').notNull(),
  goalCount: integer('goal_count').notNull(),
  goalPeriodDays: integer('goal_period_days').notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  maxStreak: integer('max_streak').default(0).notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  pointStreakReset: boolean('point_streak_reset').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Habit completions table
export const habitCompletions = pgTable('habit_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Achievements table
export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  habitId: uuid('habit_id').references(() => habits.id, { onDelete: 'cascade' }),
  achievementType: text('achievement_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  points: integer('points').notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const habitsRelations = relations(habits, ({ many }) => ({
  completions: many(habitCompletions),
  achievements: many(achievements),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  habit: one(habits, {
    fields: [achievements.habitId],
    references: [habits.id],
  }),
}));
