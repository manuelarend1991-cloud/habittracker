
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Habit } from '@/types/habit';

interface HabitsOverviewProps {
  habits: Habit[];
  onAddCompletion: (habitId: string) => void;
  recentCompletions?: Record<string, { completedAt: string; isMissedCompletion?: boolean }[]>;
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

  // Calculate next completion points
  const getNextCompletionPoints = (habit: Habit): number => {
    // If point streak was reset (by missed completion), next is always 1
    if (habit.pointStreakReset) {
      return 1;
    }
    // Otherwise, next completion is worth (currentStreak + 1)
    return habit.currentStreak + 1;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Habits Overview</Text>
      
      {habits.map((habit) => {
        const currentStreakText = `Current: ${habit.currentStreak}`;
        const bestStreakText = `Best: ${habit.maxStreak}`;
        const todayCount = todayCompletionCounts[habit.id] || 0;
        const isDailyGoalReached = todayCount >= habit.goalCount;
        const nextPoints = getNextCompletionPoints(habit);
        const completionRatioText = `${todayCount}/${habit.goalCount}`;

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

              {/* Plus Button with Points and Completion Ratio */}
              <View style={styles.buttonContainer}>
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
                
                {/* Top Right: Next Points Indicator */}
                {!isDailyGoalReached && (
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{nextPoints}</Text>
                  </View>
                )}
                
                {/* Bottom Right: Completion Ratio */}
                <View style={styles.ratioBadge}>
                  <Text style={styles.ratioText}>{completionRatioText}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Row: Mini 7-Day Calendar with Dates Inside Circles */}
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
                    <View style={styles.dayIndicatorRow}>
                      <View style={styles.dayIndicatorContainer}>
                        <View
                          style={[
                            styles.dayIndicator,
                            isCompleted && { backgroundColor: habit.color }
                          ]}
                        >
                          {/* Date inside the circle */}
                          <Text style={[
                            styles.dayNumberInside,
                            isCompleted && styles.dayNumberInsideCompleted
                          ]}>
                            {dayNum}
                          </Text>
                        </View>
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
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  title: {
    fontSize: 18,
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
    gap: 6,
    marginBottom: 2,
  },
  iconEmoji: {
    fontSize: 16,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  streakDivider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    position: 'relative',
    width: 36,
    height: 36,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  pointsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  pointsText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratioBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  ratioText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 3,
    paddingLeft: 22,
  },
  dayColumn: {
    alignItems: 'center',
    width: 26,
  },
  dayName: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  dayIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    overflow: 'visible',
  },
  dayIndicatorContainer: {
    position: 'relative',
    width: 18,
    height: 18,
    overflow: 'visible',
  },
  dayIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberInside: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  dayNumberInsideCompleted: {
    color: '#ffffff',
  },
  miniPlasterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlasterEmoji: {
    fontSize: 8,
  },
  streakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 28,
    height: 2,
    borderRadius: 1,
    transform: [{ translateY: -1 }],
  },
});
