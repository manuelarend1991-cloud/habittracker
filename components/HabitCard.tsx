
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Habit } from '@/types/habit';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onCalendarPress: () => void;
  onSettingsPress?: () => void;
  onDecrement?: () => void;
  onPress?: () => void;
  recentCompletions?: string[];
  todayCompletionCount?: number;
}

export function HabitCard({ 
  habit, 
  onComplete, 
  onCalendarPress,
  onSettingsPress,
  onDecrement,
  onPress, 
  recentCompletions = [],
  todayCompletionCount = 0
}: HabitCardProps) {
  const goalText = `Goal: ${habit.goalCount}x per ${habit.goalPeriodDays} days`;
  const currentStreakText = `Current: ${habit.currentStreak}`;
  const bestStreakText = `Best: ${habit.maxStreak}`;
  const todayCountText = `${todayCompletionCount}`;
  const todayGoalText = `/ ${habit.goalCount}`;

  return (
    <View
      style={[styles.card, { borderLeftColor: habit.color, borderLeftWidth: 4 }]}
    >
      {/* Header: Habit Name and Settings Icon */}
      <View style={styles.header}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="gear"
            android_material_icon_name="settings"
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Streak Stats */}
      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={[styles.streakValue, { color: habit.color }]}>{currentStreakText}</Text>
        </View>
        <View style={styles.streakItem}>
          <Text style={styles.streakLabel}>Best Streak</Text>
          <Text style={[styles.streakValue, { color: habit.color }]}>{bestStreakText}</Text>
        </View>
      </View>

      {/* Current Settings */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingsText}>{goalText}</Text>
      </View>

      {/* Today's Counter and Calendar */}
      <View style={styles.counterRow}>
        <View style={styles.counterSection}>
          <Text style={styles.counterLabel}>Today</Text>
          <View style={styles.counterDisplay}>
            <Text style={[styles.counterValue, { color: habit.color }]}>{todayCountText}</Text>
            <Text style={styles.counterGoal}>{todayGoalText}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
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

          {onDecrement && todayCompletionCount > 0 && (
            <TouchableOpacity
              style={[styles.decrementButton, { borderColor: habit.color }]}
              onPress={onDecrement}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="minus"
                android_material_icon_name="remove"
                size={20}
                color={habit.color}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.incrementButton, { backgroundColor: habit.color }]}
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
      </View>
    </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  iconButton: {
    padding: 4,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  streakItem: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsRow: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
  },
  settingsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  counterSection: {
    flex: 1,
  },
  counterLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  counterDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  counterGoal: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarButton: {
    padding: 8,
  },
  decrementButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
});
