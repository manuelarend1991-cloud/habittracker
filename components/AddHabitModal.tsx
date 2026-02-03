
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, habitColors } from '@/styles/commonStyles';
import { EmojiPicker } from './EmojiPicker';

// Reusable Confirmation Modal Component
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={confirmStyles.overlay}>
        <View style={confirmStyles.modal}>
          <Text style={confirmStyles.title}>{title}</Text>
          <Text style={confirmStyles.message}>{message}</Text>
          <View style={confirmStyles.buttons}>
            <TouchableOpacity
              style={[confirmStyles.button, confirmStyles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={confirmStyles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                confirmStyles.button,
                confirmStyles.confirmButton,
                destructive && confirmStyles.destructiveButton,
              ]}
              onPress={onConfirm}
            >
              <Text style={confirmStyles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const confirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string, goalCount: number, goalPeriodDays: number, icon: string) => Promise<void>;
}

export function AddHabitModal({ visible, onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(habitColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('⭐');
  const [goalCount, setGoalCount] = useState('1');
  const [goalPeriodDays, setGoalPeriodDays] = useState('7');
  const [streakRequiredDays, setStreakRequiredDays] = useState('2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    console.log('[AddHabitModal] User tapped Add Habit button');
    if (!name.trim()) {
      setError('Please enter a habit name');
      return;
    }

    const count = parseInt(goalCount) || 1;
    const period = parseInt(goalPeriodDays) || 7;

    if (count < 1 || period < 1) {
      setError('Goal count and period must be at least 1');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[AddHabitModal] Calling onAdd with:', { name: name.trim(), selectedColor, count, period, selectedIcon });
      await onAdd(name.trim(), selectedColor, count, period, selectedIcon);
      
      console.log('[AddHabitModal] Habit added successfully, resetting form');
      // Reset form
      setName('');
      setGoalCount('1');
      setGoalPeriodDays('7');
      setStreakRequiredDays('2');
      setSelectedColor(habitColors[0]);
      setSelectedIcon('⭐');
      setError(null);
      // Don't close modal here - let parent handle it
    } catch (err: any) {
      console.error('[AddHabitModal] Error adding habit:', err);
      // Extract detailed error message
      let errorMessage = 'Failed to create habit. Please try again.';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.status) {
        errorMessage = `Server error (${err.status}). Please try again.`;
      }
      
      console.error('[AddHabitModal] Displaying error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goalCountNum = parseInt(goalCount) || 0;
  const goalPeriodNum = parseInt(goalPeriodDays) || 0;
  const streakDaysNum = parseInt(streakRequiredDays) || 0;
  const goalDescription = `Complete ${goalCountNum}x per day, ${streakDaysNum} times in ${goalPeriodNum} days for a streak`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Habit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning Exercise"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Icon (Emoji)</Text>
            <View style={styles.selectedEmojiContainer}>
              <Text style={styles.selectedEmoji}>{selectedIcon}</Text>
              <Text style={styles.selectedEmojiLabel}>Selected Icon</Text>
            </View>
            <View style={styles.emojiPickerContainer}>
              <EmojiPicker
                selectedEmoji={selectedIcon}
                onSelectEmoji={setSelectedIcon}
                color={selectedColor}
              />
            </View>

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {habitColors.map((color) => {
                const isSelected = color === selectedColor;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      isSelected && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Habit Settings</Text>
            
            <Text style={styles.label}>Completions Required Per Day</Text>
            <Text style={styles.helpText}>
              How many times per day must this habit be completed to count as &quot;done&quot; for that day?
            </Text>
            <TextInput
              style={styles.input}
              value={goalCount}
              onChangeText={setGoalCount}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Days Required for Streak</Text>
            <Text style={styles.helpText}>
              How many days with completion are needed...
            </Text>
            <TextInput
              style={styles.input}
              value={streakRequiredDays}
              onChangeText={setStreakRequiredDays}
              keyboardType="number-pad"
              placeholder="2"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>...within this Period (Days)</Text>
            <Text style={styles.helpText}>
              ...within how many consecutive days?
            </Text>
            <TextInput
              style={styles.input}
              value={goalPeriodDays}
              onChangeText={setGoalPeriodDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{goalDescription}</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={loading || !name.trim()}
            >
              <Text style={styles.addButtonText}>
                {loading ? 'Adding...' : 'Add Habit'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
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
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedEmojiContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  selectedEmojiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emojiPickerContainer: {
    height: 300,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  checkmark: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  summaryBox: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
