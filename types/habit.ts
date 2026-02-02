
export interface Habit {
  id: string;
  name: string;
  color: string;
  goalCount: number;
  goalPeriodDays: number;
  currentStreak: number;
  maxStreak: number;
  totalPoints: number;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  points: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  habitId?: string;
  achievementType: string;
  title: string;
  description: string;
  points: number;
  unlockedAt?: string;
  createdAt: string;
}

export interface DashboardData {
  habits: Array<{
    id: string;
    name: string;
    color: string;
    currentStreak: number;
    maxStreak: number;
    recentCompletions: HabitCompletion[];
  }>;
  totalPoints: number;
  recentAchievements: Achievement[];
}
