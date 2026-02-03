import { createApplication } from "@specific-dev/framework";
import { eq } from 'drizzle-orm';
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerHabitRoutes } from './routes/habits.js';
import { registerCompletionRoutes } from './routes/completions.js';
import { registerAchievementRoutes } from './routes/achievements.js';
import { registerDashboardRoutes } from './routes/dashboard.js';

const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Initialize anonymous user for unauthenticated requests
const ANONYMOUS_USER_ID = 'anonymous-user';
const ANONYMOUS_USER_EMAIL = 'anonymous@system';
const ANONYMOUS_USER_NAME = 'Anonymous User';

async function initializeAnonymousUser() {
  try {
    // Check if anonymous user already exists
    const existingUser = await app.db.query.user.findFirst({
      where: eq(authSchema.user.id, ANONYMOUS_USER_ID),
    });

    if (!existingUser) {
      // Create anonymous user if it doesn't exist
      await app.db.insert(authSchema.user).values({
        id: ANONYMOUS_USER_ID,
        name: ANONYMOUS_USER_NAME,
        email: ANONYMOUS_USER_EMAIL,
        emailVerified: true,
      });
      app.logger.info({ userId: ANONYMOUS_USER_ID }, 'Anonymous user created');
    } else {
      app.logger.debug({ userId: ANONYMOUS_USER_ID }, 'Anonymous user already exists');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to initialize anonymous user');
    throw error;
  }
}

// Initialize anonymous user before registering routes
await initializeAnonymousUser();

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerHabitRoutes(app);
registerCompletionRoutes(app);
registerAchievementRoutes(app);
registerDashboardRoutes(app);

await app.run();
app.logger.info('Application running');
