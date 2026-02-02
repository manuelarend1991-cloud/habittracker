
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Habit } from '@/types/habit';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onCalendarPress: () => void;
  onPress?: () => void;
  recentCompletions?: string[];
}

export function HabitCard({ 
  habit, 
  onComplete, 
  onCalendarPress,
  onPress, 
  recentCompletions = [] 
}: HabitCardProps) {
  const goalText = `${habit.goalCount}x per ${habit.goalPeriodDays} days`;
  const currentStreakText = `${habit.currentStreak}`;
  const maxStreakText = `${habit.maxStreak}`;

  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  // Check if a date has completions
  const hasCompletionOnDate = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return recentCompletions.some(completionDate => {
      const completionDateStr = new Date(completionDate).toISOString().split('T')[0];
      return completionDateStr === dateStr;
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: habit.color, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <Text style={styles.goalText}>{goalText}</Text>
        </View>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={onCalendarPress}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar-today"
            size={24}
            color={habit.color}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {/* Current Streak */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={[styles.statValue, { color: habit.color }]}>{currentStreakText}</Text>
        </View>

        {/* Max Streak */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Best</Text>
          <Text style={[styles.statValue, { color: habit.color }]}>{maxStreakText}</Text>
        </View>

        {/* 7-Day Mini Calendar */}
        <View style={styles.miniCalendar}>
          {last7Days.map((date, index) => {
            const dayNum = date.getDate().toString();
            const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()];
            const isCompleted = hasCompletionOnDate(date);
            
            return (
              <View key={index} style={styles.dayBox}>
                <Text style={styles.dayNumber}>{dayNum}</Text>
                <View
                  style={[
                    styles.dayIndicator,
                    isCompleted && { backgroundColor: habit.color }
                  ]}
                />
                <Text style={styles.dayName}>{dayName}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Add Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: habit.color }]}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  calendarButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  miniCalendar: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  dayBox: {
    alignItems: 'center',
    width: 28,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  dayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    marginBottom: 2,
  },
  dayName: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
});
