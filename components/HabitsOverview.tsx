
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Habit } from '@/types/habit';
import { IconSymbol } from './IconSymbol';

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
            {/* Left: Icon, Habit Name and Streaks */}
            <View style={styles.leftSection}>
              <View style={styles.nameRow}>
                <IconSymbol
                  ios_icon_name={habit.icon || 'star'}
                  android_material_icon_name={habit.icon || 'star'}
                  size={16}
                  color="#ffffff"
                />
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

            {/* Right Section: Mini Calendar and Plus Button */}
            <View style={styles.rightSection}>
              {/* Mini 7-Day Calendar */}
              <View style={styles.miniCalendar}>
                {last7Days.map((date, index) => {
                  const dayNum = date.getDate().toString();
                  const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
                  const isCompleted = hasCompletionOnDate(habit.id, date);
                  const isMissed = isMissedCompletionOnDate(habit.id, date);
                  
                  return (
                    <View key={index} style={styles.dayColumn}>
                      <Text style={styles.dayName}>{dayName}</Text>
                      <Text style={styles.dayNumber}>{dayNum}</Text>
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
                      </View>
                    </View>
                  );
                })}
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
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={20}
                    color="#ffffff"
                  />
                ) : (
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={20}
                    color="#ffffff"
                  />
                )}
              </TouchableOpacity>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2563eb',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  streakDivider: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniCalendar: {
    flexDirection: 'row',
    gap: 4,
  },
  dayColumn: {
    alignItems: 'center',
    width: 24,
  },
  dayName: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 3,
  },
  dayIndicatorContainer: {
    position: 'relative',
    width: 16,
    height: 16,
  },
  dayIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
});
