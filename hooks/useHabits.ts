
import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitCompletion, DashboardData } from '@/types/habit';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    console.log('[useHabits] Fetching habits...');
    try {
      setLoading(true);
      const data = await authenticatedGet<Habit[]>('/api/habits');
      console.log('[useHabits] Fetched habits:', data);
      setHabits(data);
      setError(null);
    } catch (err) {
      console.error('[useHabits] Error fetching habits:', err);
      setError('Failed to load habits');
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    console.log('[useHabits] Fetching dashboard data...');
    try {
      const data = await authenticatedGet<DashboardData>('/api/dashboard');
      console.log('[useHabits] Fetched dashboard:', data);
      setDashboard(data);
    } catch (err) {
      console.error('[useHabits] Error fetching dashboard:', err);
      // Don't set error state for dashboard, it's not critical
    }
  }, []);

  const addCompletion = useCallback(async (habitId: string) => {
    console.log('[useHabits] Adding completion for habit:', habitId);
    try {
      const completedAt = new Date().toISOString();
      const response = await authenticatedPost<{ completion: HabitCompletion; updatedHabit: Habit }>(
        `/api/habits/${habitId}/complete`,
        { completedAt }
      );
      console.log('[useHabits] Completion added:', response);
      
      // Update local state with the updated habit
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === habitId ? response.updatedHabit : h)
      );
      
      // Refetch dashboard to get updated stats
      await fetchDashboard();
    } catch (err) {
      console.error('[useHabits] Error adding completion:', err);
      throw err;
    }
  }, [fetchDashboard]);

  const createHabit = useCallback(async (name: string, color: string, goalCount: number, goalPeriodDays: number) => {
    console.log('[useHabits] Creating habit:', { name, color, goalCount, goalPeriodDays });
    try {
      const newHabit = await authenticatedPost<Habit>('/api/habits', {
        name,
        color,
        goalCount,
        goalPeriodDays,
      });
      console.log('[useHabits] Habit created:', newHabit);
      
      // Add to local state
      setHabits(prevHabits => [...prevHabits, newHabit]);
      
      // Refetch dashboard
      await fetchDashboard();
    } catch (err) {
      console.error('[useHabits] Error creating habit:', err);
      throw err;
    }
  }, [fetchDashboard]);

  const deleteHabit = useCallback(async (habitId: string) => {
    console.log('[useHabits] Deleting habit:', habitId);
    try {
      await authenticatedDelete(`/api/habits/${habitId}`);
      console.log('[useHabits] Habit deleted');
      
      // Remove from local state
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
      
      // Refetch dashboard
      await fetchDashboard();
    } catch (err) {
      console.error('[useHabits] Error deleting habit:', err);
      throw err;
    }
  }, [fetchDashboard]);

  useEffect(() => {
    fetchHabits();
    fetchDashboard();
  }, [fetchHabits, fetchDashboard]);

  const fetchCompletions = useCallback(async (habitId: string) => {
    console.log('[useHabits] Fetching completions for habit:', habitId);
    try {
      const completions = await authenticatedGet<HabitCompletion[]>(`/api/habits/${habitId}/completions`);
      console.log('[useHabits] Fetched completions:', completions);
      return completions;
    } catch (err) {
      console.error('[useHabits] Error fetching completions:', err);
      return [];
    }
  }, []);

  return {
    habits,
    dashboard,
    loading,
    error,
    addCompletion,
    createHabit,
    deleteHabit,
    fetchCompletions,
    refetch: fetchHabits,
  };
}
