
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Habit } from '@/types/habit';
import { IconSymbol } from './IconSymbol';

interface HabitsOverviewProps {
  habits: Habit[];
  onAddCompletion: (habitId: string) => void;
  recentCompletions?: Record<string, string[]>;
}

export function HabitsOverview({ habits, onAddCompletion, recentCompletions = {} }: HabitsOverviewProps) {
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
    return habitCompletionDates.some(completionDate => {
      const completionDateStr = new Date(completionDate).toISOString().split('T')[0];
      return completionDateStr === dateStr;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Habits Overview</Text>
      
      {habits.map((habit) => {
        const currentStreakText = `Current: ${habit.currentStreak}`;
        const bestStreakText = `Best: ${habit.maxStreak}`;

        return (
          <View key={habit.id} style={styles.habitRow}>
            {/* Left: Habit Name and Streaks */}
            <View style={styles.leftSection}>
              <Text style={styles.habitName} numberOfLines={1}>
                {habit.name}
              </Text>
              <View style={styles.streakInfo}>
                <Text style={styles.streakText}>{currentStreakText}</Text>
                <Text style={styles.streakDivider}>•</Text>
                <Text style={styles.streakText}>{bestStreakText}</Text>
              </View>
            </View>

            {/* Center: Mini 7-Day Calendar */}
            <View style={styles.miniCalendar}>
              {last7Days.map((date, index) => {
                const dayNum = date.getDate().toString();
                const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
                const isCompleted = hasCompletionOnDate(habit.id, date);
                
                return (
                  <View key={index} style={styles.dayColumn}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Text style={styles.dayNumber}>{dayNum}</Text>
                    <View
                      style={[
                        styles.dayIndicator,
                        isCompleted && { backgroundColor: habit.color }
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Right: Plus Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: habit.color }]}
              onPress={() => onAddCompletion(habit.id)}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={20}
                color="#ffffff"
              />
            </TouchableOpacity>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  leftSection: {
    flex: 1,
    minWidth: 100,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
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
  miniCalendar: {
    flexDirection: 'row',
    gap: 4,
    flex: 0,
  },
  dayColumn: {
    alignItems: 'center',
    width: 28,
  },
  dayName: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 3,
  },
  dayIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
});
