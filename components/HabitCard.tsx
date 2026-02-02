
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Habit } from '@/types/habit';
import { colors } from '@/styles/commonStyles';

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
  onCalendarPress: () => void;
  onSettingsPress?: () => void;
  onDecrement?: () => void;
  onPress?: () => void;
  recentCompletions?: string[];
  todayCompletionCount?: number;
  pointStreakReset?: boolean;
}

export function HabitCard({ 
  habit, 
  onComplete, 
  onCalendarPress,
  onSettingsPress,
  onDecrement,
  onPress, 
  recentCompletions = [],
  todayCompletionCount = 0,
  pointStreakReset = false
}: HabitCardProps) {
  const goalText = `Goal: ${habit.goalCount}x per day`;
  const currentStreakText = `${habit.currentStreak}`;
  const bestStreakText = `${habit.maxStreak}`;
  const todayCountText = `${todayCompletionCount}`;
  const todayGoalText = `/ ${habit.goalCount}`;
  
  // Calculate progress percentage for today
  const progressPercentage = Math.min((todayCompletionCount / habit.goalCount) * 100, 100);
  const progressPercentageText = `${Math.round(progressPercentage)}%`;
  
  // Check if daily goal is reached
  const isDailyGoalReached = todayCompletionCount >= habit.goalCount;
  
  // Calculate next completion worth
  // If pointStreakReset is true, next completion is worth 1 point
  // Otherwise, it's worth currentStreak + 1 (since we're continuing the streak)
  const nextCompletionWorth = pointStreakReset ? 1 : habit.currentStreak + 1;
  const nextCompletionText = `Next: ${nextCompletionWorth} pt${nextCompletionWorth !== 1 ? 's' : ''}`;

  return (
    <View
      style={[styles.card, { borderLeftColor: habit.color, borderLeftWidth: 4 }]}
    >
      {/* Header: Icon, Habit Name and Settings Icon */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.iconEmoji}>{habit.icon || '⭐'}</Text>
          <Text style={styles.habitName}>{habit.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
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
        <View style={styles.streakItem}>
          <Text style={styles.streakLabel}>Next Worth</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.streakValue, { color: habit.color }]}>{nextCompletionText}</Text>
            {pointStreakReset && (
              <Text style={{ fontSize: 14 }}>⚠️</Text>
            )}
          </View>
        </View>
      </View>

      {/* Current Settings */}
      <View style={styles.settingsRow}>
        <Text style={styles.settingsText}>{goalText}</Text>
      </View>

      {/* Today's Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
          <Text style={styles.progressPercentage}>{progressPercentageText}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: habit.color 
              }
            ]} 
          />
        </View>
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
            <Text style={[styles.calendarIcon, { color: habit.color }]}>📅</Text>
          </TouchableOpacity>

          {onDecrement && todayCompletionCount > 0 && (
            <TouchableOpacity
              style={[styles.decrementButton, { borderColor: habit.color }]}
              onPress={onDecrement}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: habit.color }]}>−</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.incrementButton, 
              { backgroundColor: habit.color },
              isDailyGoalReached && styles.incrementButtonDisabled
            ]}
            onPress={onComplete}
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconEmoji: {
    fontSize: 20,
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
  settingsIcon: {
    fontSize: 22,
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
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
  calendarIcon: {
    fontSize: 24,
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
  incrementButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
});
