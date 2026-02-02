
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
import { IconSymbol } from './IconSymbol';
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

  const handleDatePress = (date: Date) => {
    if (isFutureDate(date)) {
      return; // Can't add completions for future dates
    }

    if (hasCompletionOnDate(date)) {
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
    setConfirmModalVisible(false);
    setSelectedDate(null);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="chevron-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.monthName}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Week Day Headers */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarScroll}>
            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const completed = hasCompletionOnDate(date);
                const today = isToday(date);
                const future = isFutureDate(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                const dayNumber = date.getDate().toString();

                return (
                  <TouchableOpacity
                    key={index}
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
                      <Text
                        style={[
                          styles.dayText,
                          completed && styles.completedDayText,
                          future && styles.futureDayText,
                        ]}
                      >
                        {dayNumber}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
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
              <View style={[styles.legendBox, { backgroundColor: colors.backgroundAlt }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            Tap any available day to add a missed completion
          </Text>
        </View>

        {/* Confirmation Modal */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Add Missed Completion"
          message="Are you sure you want to add a missed completion? This will cost 10 points."
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
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
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
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
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
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  instructions: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
