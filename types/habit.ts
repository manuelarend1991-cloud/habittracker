
export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  goalCount: number;
  goalPeriodDays: number;
  currentStreak: number;
  maxStreak: number;
  totalPoints: number;
  pointStreakReset?: boolean;
  lastMissedCompletionDate?: string | null;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  points: number;
  createdAt: string;
  isMissedCompletion?: boolean;
}

export interface Achievement {
  id: string;
  habitId?: string;
  achievementType: string;
  title: string;
  description: string;
  points: number;
  icon?: string;
  unlockedAt?: string;
  createdAt: string;
}

export interface DashboardData {
  habits: {
    id: string;
    name: string;
    color: string;
    icon: string;
    goalCount: number;
    goalPeriodDays: number;
    currentStreak: number;
    maxStreak: number;
    totalPoints: number;
    pointStreakReset?: boolean;
    lastMissedCompletionDate?: string | null;
    nextCompletionPoints: number;
    completionsToday: number;
    recentCompletions: {
      id: string;
      completedAt: string;
      points: number;
      isMissedCompletion?: boolean;
    }[];
  }[];
  totalPoints: number;
  recentAchievements: Achievement[];
}
