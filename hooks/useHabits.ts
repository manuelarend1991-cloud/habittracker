
import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitCompletion, DashboardData } from '@/types/habit';
import { authenticatedGet, authenticatedPost, authenticatedDelete, authenticatedPut } from '@/utils/api';

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
    }
  }, []);

  const addCompletion = useCallback(async (habitId: string) => {
    console.log('[useHabits] Adding completion for habit:', habitId);
    try {
      const completedAt = new Date().toISOString();
      const response = await authenticatedPost<{ 
        completion: HabitCompletion; 
        updatedHabit: Habit;
        pointsEarned?: number;
        message?: string;
      }>(
        `/api/habits/${habitId}/complete`,
        { completedAt }
      );
      console.log('[useHabits] Completion added:', response);
      
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === habitId ? response.updatedHabit : h)
      );
      
      await fetchDashboard();
      return response;
    } catch (err: any) {
      console.error('[useHabits] Error adding completion:', err);
      
      // Check if it's an ApiError with status 400 or 409
      if (err.status === 400 || err.status === 409) {
        // Use the backend error message if available, otherwise use default
        const errorMessage = err.message || err.data?.error || "You've completed this task, already!";
        const customError = new Error(errorMessage);
        (customError as any).isAlreadyCompleted = true;
        throw customError;
      }
      
      throw err;
    }
  }, [fetchDashboard]);

  const removeCompletion = useCallback(async (habitId: string) => {
    console.log('[useHabits] Removing last completion for habit:', habitId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await authenticatedDelete<{ updatedHabit: Habit }>(
        `/api/habits/${habitId}/complete-today`
      );
      console.log('[useHabits] Completion removed:', response);
      
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === habitId ? response.updatedHabit : h)
      );
      
      await fetchDashboard();
      return response;
    } catch (err: any) {
      console.error('[useHabits] Error removing completion:', err);
      throw err;
    }
  }, [fetchDashboard]);

  const addPastCompletion = useCallback(async (habitId: string, date: Date) => {
    console.log('[useHabits] Adding past completion for habit:', habitId, 'date:', date);
    try {
      const completedAt = date.toISOString();
      const response = await authenticatedPost<{ 
        completion: HabitCompletion; 
        updatedHabit: Habit;
        pointsEarned?: number;
        pointsCost?: number;
        message?: string;
      }>(
        `/api/habits/${habitId}/complete-past`,
        { completedAt }
      );
      console.log('[useHabits] Past completion added:', response);
      
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === habitId ? response.updatedHabit : h)
      );
      
      await fetchDashboard();
      return response;
    } catch (err: any) {
      console.error('[useHabits] Error adding past completion:', err);
      
      // Check if it's an ApiError with status 400 or 409
      if (err.status === 400 || err.status === 409) {
        // Use the backend error message if available, otherwise use default
        const errorMessage = err.message || err.data?.error || 'Completion already exists for this date';
        const customError = new Error(errorMessage);
        (customError as any).isAlreadyCompleted = true;
        throw customError;
      }
      
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
      
      setHabits(prevHabits => [...prevHabits, newHabit]);
      
      await fetchDashboard();
    } catch (err) {
      console.error('[useHabits] Error creating habit:', err);
      throw err;
    }
  }, [fetchDashboard]);

  const updateHabit = useCallback(async (habitId: string, name: string, color: string, goalCount: number, goalPeriodDays: number) => {
    console.log('[useHabits] Updating habit:', habitId, { name, color, goalCount, goalPeriodDays });
    try {
      const updatedHabit = await authenticatedPut<Habit>(`/api/habits/${habitId}`, {
        name,
        color,
        goalCount,
        goalPeriodDays,
      });
      console.log('[useHabits] Habit updated:', updatedHabit);
      
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === habitId ? updatedHabit : h)
      );
      
      await fetchDashboard();
    } catch (err) {
      console.error('[useHabits] Error updating habit:', err);
      throw err;
    }
  }, [fetchDashboard]);

  const deleteHabit = useCallback(async (habitId: string) => {
    console.log('[useHabits] Deleting habit:', habitId);
    try {
      await authenticatedDelete(`/api/habits/${habitId}`);
      console.log('[useHabits] Habit deleted');
      
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
      
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
    removeCompletion,
    addPastCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    fetchCompletions,
    refetch: fetchHabits,
  };
}
