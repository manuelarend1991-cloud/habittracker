
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Habit } from '@/types/habit';

interface HabitsOverviewProps {
  habits: Habit[];
  onAddCompletion: (habitId: string) => void;
  recentCompletions?: Record<string, Array<{ completedAt: string; isMissedCompletion?: boolean }>>;
  todayCompletionCounts?: Record<string, number>;
}

export function HabitsOverview({ 
  habits, 
  onAddCompletion, 
  recentCompletions = {},
  todayCompletionCounts = {}
}: HabitsOverviewProps) {
  if (habits.length === 0) {
    return null;
  }

  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  // Check if a habit has completion on a specific date
  const hasCompletionOnDate = (habitId: string, date: Date): boolean => {
    const habitCompletionDates = recentCompletions[habitId] || [];
    const dateStr = date.toISOString().split('T')[0];
    return habitCompletionDates.some(completion => {
      const completionDateStr = new Date(completion.completedAt).toISOString().split('T')[0];
      return completionDateStr === dateStr;
    });
  };

  // Check if a completion on a specific date is a missed completion
  const isMissedCompletionOnDate = (habitId: string, date: Date): boolean => {
    const habitCompletionDates = recentCompletions[habitId] || [];
    const dateStr = date.toISOString().split('T')[0];
    const completion = habitCompletionDates.find(completion => {
      const completionDateStr = new Date(completion.completedAt).toISOString().split('T')[0];
      return completionDateStr === dateStr;
    });
    return completion?.isMissedCompletion === true;
  };

  // Check if two consecutive days form a streak (both completed)
  const isStreakConnection = (habitId: string, dayIndex: number): boolean => {
    if (dayIndex >= last7Days.length - 1) {
      return false;
    }
    const currentDay = last7Days[dayIndex];
    const nextDay = last7Days[dayIndex + 1];
    return hasCompletionOnDate(habitId, currentDay) && hasCompletionOnDate(habitId, nextDay);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Habits Overview</Text>
      
      {habits.map((habit) => {
        const currentStreakText = `Current: ${habit.currentStreak}`;
        const bestStreakText = `Best: ${habit.maxStreak}`;
        const todayCount = todayCompletionCounts[habit.id] || 0;
        const isDailyGoalReached = todayCount >= habit.goalCount;

        return (
          <View key={habit.id} style={styles.habitRow}>
            {/* Top Row: Icon, Full Habit Name, Streaks, Plus Button */}
            <View style={styles.topRow}>
              <View style={styles.leftSection}>
                <View style={styles.nameRow}>
                  <Text style={styles.iconEmoji}>{habit.icon || '⭐'}</Text>
                  <Text style={styles.habitName} numberOfLines={1}>
                    {habit.name}
                  </Text>
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakText}>{currentStreakText}</Text>
                  <Text style={styles.streakDivider}>•</Text>
                  <Text style={styles.streakText}>{bestStreakText}</Text>
                </View>
              </View>

              {/* Plus Button */}
              <TouchableOpacity
                style={[
                  styles.addButton, 
                  { backgroundColor: habit.color },
                  isDailyGoalReached && styles.addButtonDisabled
                ]}
                onPress={() => onAddCompletion(habit.id)}
                activeOpacity={isDailyGoalReached ? 1 : 0.8}
                disabled={isDailyGoalReached}
              >
                {isDailyGoalReached ? (
                  <Text style={styles.buttonText}>✓</Text>
                ) : (
                  <Text style={styles.buttonText}>+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Row: Mini 7-Day Calendar with Streak Lines */}
            <View style={styles.calendarRow}>
              {last7Days.map((date, index) => {
                const dayNum = date.getDate().toString();
                const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
                const isCompleted = hasCompletionOnDate(habit.id, date);
                const isMissed = isMissedCompletionOnDate(habit.id, date);
                const showStreakLine = isStreakConnection(habit.id, index);
                
                return (
                  <View key={index} style={styles.dayColumn}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Text style={styles.dayNumber}>{dayNum}</Text>
                    <View style={styles.dayIndicatorRow}>
                      <View style={styles.dayIndicatorContainer}>
                        <View
                          style={[
                            styles.dayIndicator,
                            isCompleted && { backgroundColor: habit.color }
                          ]}
                        />
                        {isMissed && (
                          <View style={styles.miniPlasterBadge}>
                            <Text style={styles.miniPlasterEmoji}>🩹</Text>
                          </View>
                        )}
                        {showStreakLine && (
                          <View style={[styles.streakLine, { backgroundColor: habit.color }]} />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  habitRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  iconEmoji: {
    fontSize: 13,
  },
  habitName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  streakDivider: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 2,
    paddingLeft: 17,
  },
  dayColumn: {
    alignItems: 'center',
    width: 24,
  },
  dayName: {
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 0.5,
  },
  dayNumber: {
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 1.5,
  },
  dayIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 12,
    overflow: 'visible',
  },
  dayIndicatorContainer: {
    position: 'relative',
    width: 12,
    height: 12,
    overflow: 'visible',
  },
  dayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  miniPlasterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlasterEmoji: {
    fontSize: 6,
  },
  streakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 26, // Width should be: gap (2px) + next indicator width (24px) = 26px to reach center of next indicator
    height: 2,
    borderRadius: 1,
    transform: [{ translateY: -1 }],
  },
});
