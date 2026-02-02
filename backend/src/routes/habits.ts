import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerHabitRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/habits - Get all habits for authenticated user
  app.fastify.get('/api/habits', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching habits for user');

    try {
      const userHabits = await app.db.query.habits.findMany({
        where: eq(schema.habits.userId, session.user.id),
      });

      app.logger.info({ userId: session.user.id, count: userHabits.length }, 'Habits fetched successfully');
      return userHabits;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch habits');
      throw error;
    }
  });

  // POST /api/habits - Create a new habit
  app.fastify.post('/api/habits', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const body = request.body as { name: string; color: string; goalCount: number; goalPeriodDays: number };

    app.logger.info({ userId: session.user.id, body }, 'Creating habit');

    try {
      const [newHabit] = await app.db.insert(schema.habits).values({
        userId: session.user.id,
        name: body.name,
        color: body.color,
        goalCount: body.goalCount,
        goalPeriodDays: body.goalPeriodDays,
        currentStreak: 0,
        maxStreak: 0,
        totalPoints: 0,
      }).returning();

      app.logger.info({ userId: session.user.id, habitId: newHabit.id }, 'Habit created successfully');
      return newHabit;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, body }, 'Failed to create habit');
      throw error;
    }
  });

  // PUT /api/habits/:id - Update a habit
  app.fastify.put('/api/habits/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; color?: string; goalCount?: number; goalPeriodDays?: number };

    app.logger.info({ userId: session.user.id, habitId: id, body }, 'Updating habit');

    try {
      // Find the habit and verify ownership
      const habit = await app.db.query.habits.findFirst({
        where: eq(schema.habits.id, id),
      });

      if (!habit) {
        app.logger.warn({ userId: session.user.id, habitId: id }, 'Habit not found');
        return reply.status(404).send({ error: 'Habit not found' });
      }

      if (habit.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, habitId: id }, 'Unauthorized habit update attempt');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      // Build update object only with provided fields
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.color !== undefined) updateData.color = body.color;
      if (body.goalCount !== undefined) updateData.goalCount = body.goalCount;
      if (body.goalPeriodDays !== undefined) updateData.goalPeriodDays = body.goalPeriodDays;

      const [updatedHabit] = await app.db.update(schema.habits)
        .set(updateData)
        .where(eq(schema.habits.id, id))
        .returning();

      app.logger.info({ userId: session.user.id, habitId: id }, 'Habit updated successfully');
      return updatedHabit;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, habitId: id, body }, 'Failed to update habit');
      throw error;
    }
  });

  // DELETE /api/habits/:id - Delete a habit
  app.fastify.delete('/api/habits/:id', async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    app.logger.info({ userId: session.user.id, habitId: id }, 'Deleting habit');

    try {
      // Find the habit and verify ownership
      const habit = await app.db.query.habits.findFirst({
        where: eq(schema.habits.id, id),
      });

      if (!habit) {
        app.logger.warn({ userId: session.user.id, habitId: id }, 'Habit not found');
        return reply.status(404).send({ error: 'Habit not found' });
      }

      if (habit.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, habitId: id }, 'Unauthorized habit deletion attempt');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      await app.db.delete(schema.habits).where(eq(schema.habits.id, id));

      app.logger.info({ userId: session.user.id, habitId: id }, 'Habit deleted successfully');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, habitId: id }, 'Failed to delete habit');
      throw error;
    }
  });
}
