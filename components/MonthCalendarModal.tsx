
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
  const [isAdding, setIsAdding] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Reset to current month when modal opens
  useEffect(() => {
    if (visible) {
      console.log('[MonthCalendarModal] Modal opened, resetting to current month');
      setCurrentMonth(new Date());
      setSelectedDate(null);
      setConfirmModalVisible(false);
    }
  }, [visible]);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
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

  // Check if there's a streak connection to the next day (horizontally)
  const hasHorizontalStreakLine = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Check if both current and next day are completed
    return hasCompletionOnDate(date) && hasCompletionOnDate(nextDay);
  };

  // Check if there's a streak connection to the day below (vertically, 7 days later)
  const hasVerticalStreakLine = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }
    
    const nextWeekDay = new Date(date);
    nextWeekDay.setDate(nextWeekDay.getDate() + 7);
    
    // Check if both current and next week's same day are completed
    return hasCompletionOnDate(date) && hasCompletionOnDate(nextWeekDay);
  };

  const handleDatePress = (date: Date) => {
    console.log('[MonthCalendarModal] User tapped date:', date.toISOString());
    
    if (isFutureDate(date)) {
      console.log('[MonthCalendarModal] Cannot add completion for future date');
      return; // Can't add completions for future dates
    }

    if (hasCompletionOnDate(date)) {
      console.log('[MonthCalendarModal] Date already has completion');
      return; // Already completed
    }

    // Select the date and show confirmation modal
    setSelectedDate(date);
    setConfirmModalVisible(true);
  };

  const handleConfirmAddCompletion = async () => {
    if (!selectedDate) {
      return;
    }

    console.log('[MonthCalendarModal] User confirmed adding completion for:', selectedDate.toISOString());
    setConfirmModalVisible(false);
    setIsAdding(true);
    
    try {
      await onAddCompletion(selectedDate);
      setSelectedDate(null);
    } catch (error) {
      console.error('[MonthCalendarModal] Error adding completion:', error);
      setSelectedDate(null);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAddCompletion = () => {
    console.log('[MonthCalendarModal] User cancelled adding completion');
    setConfirmModalVisible(false);
    setSelectedDate(null);
  };

  const goToPreviousMonth = () => {
    console.log('[MonthCalendarModal] User tapped previous month button');
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    console.log('[MonthCalendarModal] Navigating to:', newMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    console.log('[MonthCalendarModal] User tapped next month button');
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    console.log('[MonthCalendarModal] Navigating to:', newMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));
    setCurrentMonth(newMonth);
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render a single day cell (extracted to avoid babel plugin issues with null checks)
  const renderDayCell = (date: Date | null, index: number) => {
    // Handle empty cells (null dates) - MUST CHECK FIRST
    if (date === null) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }

    // Now we know date is not null, safe to access properties
    const completed = hasCompletionOnDate(date);
    const isMissed = isMissedCompletionOnDate(date);
    const today = isToday(date);
    const future = isFutureDate(date);
    const isSelected = selectedDate !== null && selectedDate.toDateString() === date.toDateString();
    const dayNumber = date.getDate().toString();
    const showHorizontalLine = hasHorizontalStreakLine(date);
    const showVerticalLine = hasVerticalStreakLine(date);

    return (
      <View key={`day-${index}`} style={styles.dayCellWrapper}>
        <TouchableOpacity
          style={[
            styles.dayCell,
            completed && { backgroundColor: habit.color },
            today && styles.todayCell,
            future && styles.futureCell,
            isSelected && styles.selectedCell,
          ]}
          onPress={() => handleDatePress(date)}
          disabled={future || completed || isAdding}
          activeOpacity={0.7}
        >
          {isAdding && isSelected ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={styles.dayCellContent}>
              <Text
                style={[
                  styles.dayText,
                  completed && styles.completedDayText,
                  future && styles.futureDayText,
                ]}
              >
                {dayNumber}
              </Text>
              {isMissed && (
                <View style={styles.plasterBadge}>
                  <Text style={styles.plasterEmoji}>🩹</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
        
        {/* Horizontal streak line (to the right) */}
        {showHorizontalLine && (
          <View style={[styles.horizontalStreakLine, { backgroundColor: habit.color }]} />
        )}
        
        {/* Vertical streak line (below) */}
        {showVerticalLine && (
          <View style={[styles.verticalStreakLine, { backgroundColor: habit.color }]} />
        )}
      </View>
    );
  };

  const confirmMessageText = 'Are you sure you want to add a missed completion?\n\n💰 Cost: 10 points (fixed)\n\n⚠️ Warning: This will reset your point streak worthiness. Your next completion will earn only 1 point, regardless of your current streak length.\n\n✅ The streak counter itself will continue counting.\n\n🩹 Visual Indicator: This completion will be marked with a plaster badge in the calendar to distinguish it from regular completions.\n\nNote: If you don\'t have enough points, this action will be blocked.';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{habit.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthName}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Week Day Headers */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={`weekday-${index}`} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarScroll}>
            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => renderDayCell(date, index))}
            </View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: habit.color }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { borderWidth: 2, borderColor: colors.primary }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: habit.color }]} />
              <Text style={styles.legendText}>Streak</Text>
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            Tap any available day to add a missed completion. Lines connect consecutive completed days.
          </Text>
        </View>

        {/* Confirmation Modal */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Add Missed Completion"
          message={confirmMessageText}
          confirmText="Yes, add it"
          cancelText="Cancel"
          onConfirm={handleConfirmAddCompletion}
          onCancel={handleCancelAddCompletion}
        />
      </View>
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
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: colors.text,
    fontWeight: '300',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '300',
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarScroll: {
    maxHeight: 350,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrapper: {
    width: '14.28%',
    position: 'relative',
  },
  dayCell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    position: 'relative',
  },
  dayCellContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plasterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plasterEmoji: {
    fontSize: 10,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  futureCell: {
    opacity: 0.3,
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  completedDayText: {
    color: '#ffffff',
  },
  futureDayText: {
    color: colors.textSecondary,
  },
  horizontalStreakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '50%',
    height: 3,
    borderRadius: 1.5,
    transform: [{ translateY: -1.5 }],
  },
  verticalStreakLine: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 3,
    height: '50%',
    borderRadius: 1.5,
    transform: [{ translateX: -1.5 }],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  instructions: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
