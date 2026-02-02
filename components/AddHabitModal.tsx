
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
import { IconSymbol } from './IconSymbol';
import { DEFAULT_HABIT_ICONS } from '@/constants/habitIcons';

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
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_HABIT_ICONS[0].name);
  const [goalCount, setGoalCount] = useState('1');
  const [goalPeriodDays, setGoalPeriodDays] = useState('7');
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
      await onAdd(name.trim(), selectedColor, count, period, selectedIcon);
      
      // Reset form
      setName('');
      setGoalCount('1');
      setGoalPeriodDays('7');
      setSelectedColor(habitColors[0]);
      setSelectedIcon(DEFAULT_HABIT_ICONS[0].name);
      onClose();
    } catch (err) {
      console.error('[AddHabitModal] Error adding habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const goalCountNum = parseInt(goalCount) || 0;
  const goalPeriodNum = parseInt(goalPeriodDays) || 0;
  const goalDescription = `${goalCountNum}x per ${goalPeriodNum} days`;

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
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
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

            <Text style={styles.label}>Icon</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.iconScrollView}
              contentContainerStyle={styles.iconScrollContent}
            >
              {DEFAULT_HABIT_ICONS.map((icon) => {
                const isSelected = icon.name === selectedIcon;
                return (
                  <TouchableOpacity
                    key={icon.name}
                    style={[
                      styles.iconOption,
                      isSelected && styles.iconOptionSelected,
                      { borderColor: selectedColor }
                    ]}
                    onPress={() => setSelectedIcon(icon.name)}
                  >
                    <IconSymbol
                      ios_icon_name={icon.name}
                      android_material_icon_name={icon.name}
                      size={28}
                      color={isSelected ? selectedColor : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color="#ffffff"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Daily Repetitions Required</Text>
            <Text style={styles.helpText}>
              How many times per day must this habit be completed?
            </Text>
            <TextInput
              style={styles.input}
              value={goalCount}
              onChangeText={setGoalCount}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helpText}>
              The + button will be disabled once you reach this number for the day.
            </Text>

            <Text style={styles.label}>Goal Period (Days)</Text>
            <Text style={styles.helpText}>
              Track your streak over this many days
            </Text>
            <TextInput
              style={styles.input}
              value={goalPeriodDays}
              onChangeText={setGoalPeriodDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalDescription}>{goalDescription}</Text>

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
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconScrollView: {
    marginBottom: 8,
  },
  iconScrollContent: {
    gap: 12,
    paddingRight: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderWidth: 3,
    backgroundColor: colors.card,
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
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalInput: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  goalSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: -20,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  goalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
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
