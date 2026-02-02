
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
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  habitRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    marginBottom: 1,
  },
  iconEmoji: {
    fontSize: 14,
  },
  habitName: {
    fontSize: 14,
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
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  streakDivider: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    position: 'relative',
    width: 32,
    height: 32,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
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
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  pointsText: {
    fontSize: 8,
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
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  ratioText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#ffffff',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 2,
    paddingLeft: 18,
  },
  dayColumn: {
    alignItems: 'center',
    width: 24,
  },
  dayName: {
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 1,
  },
  dayIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    overflow: 'visible',
  },
  dayIndicatorContainer: {
    position: 'relative',
    width: 16,
    height: 16,
    overflow: 'visible',
  },
  dayIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberInside: {
    fontSize: 7,
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
    width: 9,
    height: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlasterEmoji: {
    fontSize: 7,
  },
  streakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 26,
    height: 2,
    borderRadius: 1,
    transform: [{ translateY: -1 }],
  },
});
</write file="components/HabitsOverview.tsx">

Now I need to update the MonthCalendarModal to also show dates inside the completion circles for consistency:

<write file="components/MonthCalendarModal.tsx">
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Habit, HabitCompletion } from '@/types/habit';
import { ConfirmModal } from './AddHabitModal';

interface MonthCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  habit: Habit;
  completions: HabitCompletion[];
  onAddCompletion: (date: Date) => Promise<void>;
  loading: boolean;
}

export function MonthCalendarModal({
  visible,
  onClose,
  habit,
  completions,
  onAddCompletion,
  loading,
}: MonthCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentMonth(new Date());
      setSelectedDate(null);
    }
  }, [visible]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const hasCompletionOnDate = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return completions.some(completion => {
      const completionDateStr = new Date(completion.completedAt).toISOString().split('T')[0];
      return completionDateStr === dateStr;
    });
  };

  const isMissedCompletionOnDate = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const completion = completions.find(completion => {
      const completionDateStr = new Date(completion.completedAt).toISOString().split('T')[0];
      return completionDateStr === dateStr;
    });
    return completion?.isMissedCompletion === true;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const hasHorizontalStreakLine = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return hasCompletionOnDate(date) && hasCompletionOnDate(nextDay);
  };

  const hasVerticalStreakLine = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    
    const nextWeekDay = new Date(date);
    nextWeekDay.setDate(nextWeekDay.getDate() + 7);
    
    return hasCompletionOnDate(date) && hasCompletionOnDate(nextWeekDay);
  };

  const handleDatePress = (date: Date) => {
    if (isFutureDate(date)) {
      return;
    }
    
    if (hasCompletionOnDate(date)) {
      return;
    }
    
    setSelectedDate(date);
    setConfirmModalVisible(true);
  };

  const handleConfirmAddCompletion = async () => {
    if (!selectedDate) {
      return;
    }
    
    setConfirmModalVisible(false);
    await onAddCompletion(selectedDate);
    setSelectedDate(null);
  };

  const handleCancelAddCompletion = () => {
    setConfirmModalVisible(false);
    setSelectedDate(null);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const renderDayCell = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }

    const dayNum = date.getDate();
    const isCompleted = hasCompletionOnDate(date);
    const isMissed = isMissedCompletionOnDate(date);
    const isTodayDate = isToday(date);
    const isFuture = isFutureDate(date);
    const hasHorizontalLine = hasHorizontalStreakLine(date);
    const hasVerticalLine = hasVerticalStreakLine(date);

    return (
      <TouchableOpacity
        key={index}
        style={styles.dayCell}
        onPress={() => handleDatePress(date)}
        disabled={isFuture || isCompleted}
        activeOpacity={isFuture || isCompleted ? 1 : 0.7}
      >
        <View style={styles.dayCellContent}>
          <View
            style={[
              styles.dayCircle,
              isCompleted && { backgroundColor: habit.color },
              isTodayDate && !isCompleted && styles.todayCircle,
              isFuture && styles.futureCircle,
            ]}
          >
            {/* Date inside the circle */}
            <Text
              style={[
                styles.dayNumberInCircle,
                isCompleted && styles.dayNumberCompleted,
                isTodayDate && !isCompleted && styles.dayNumberToday,
                isFuture && styles.dayNumberFuture,
              ]}
            >
              {dayNum}
            </Text>
          </View>
          
          {isMissed && (
            <View style={styles.plasterBadge}>
              <Text style={styles.plasterEmoji}>🩹</Text>
            </View>
          )}
          
          {hasHorizontalLine && (
            <View style={[styles.horizontalStreakLine, { backgroundColor: habit.color }]} />
          )}
          
          {hasVerticalLine && (
            <View style={[styles.verticalStreakLine, { backgroundColor: habit.color }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const monthYearText = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{monthYearText}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>→</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={habit.color} />
            </View>
          ) : (
            <ScrollView style={styles.calendarContainer}>
              <View style={styles.weekDaysHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {generateCalendarDays().map((date, index) => renderDayCell(date, index))}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: habit.color }]}>
                    <Text style={styles.legendCircleText}>1</Text>
                  </View>
                  <Text style={styles.legendText}>Completed</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: habit.color }]}>
                    <Text style={styles.legendCircleText}>1</Text>
                  </View>
                  <View style={styles.legendPlasterBadge}>
                    <Text style={styles.legendPlasterEmoji}>🩹</Text>
                  </View>
                  <Text style={styles.legendText}>Missed (Added)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.legendCircle}>
                    <Text style={styles.legendCircleTextEmpty}>1</Text>
                  </View>
                  <Text style={styles.legendText}>Not Completed</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      <ConfirmModal
        visible={confirmModalVisible}
        title="Add Missed Completion"
        message={`Add a completion for ${selectedDate?.toLocaleDateString()}? This will cost 10 points and reset your point worthiness.`}
        confirmText="Add (10 pts)"
        cancelText="Cancel"
        onConfirm={handleConfirmAddCompletion}
        onCancel={handleCancelAddCompletion}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 24,
    color: colors.primary,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  calendarContainer: {
    flex: 1,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayCellContent: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  futureCircle: {
    opacity: 0.3,
  },
  dayNumberInCircle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayNumberCompleted: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayNumberFuture: {
    color: colors.textSecondary,
  },
  plasterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plasterEmoji: {
    fontSize: 12,
  },
  horizontalStreakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 40,
    height: 3,
    borderRadius: 1.5,
    transform: [{ translateY: -1.5 }],
  },
  verticalStreakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 3,
    height: 40,
    borderRadius: 1.5,
    transform: [{ translateX: -1.5 }],
  },
  legend: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  legendCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  legendCircleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  legendCircleTextEmpty: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  legendPlasterBadge: {
    position: 'absolute',
    left: 16,
    top: -2,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendPlasterEmoji: {
    fontSize: 10,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
});
