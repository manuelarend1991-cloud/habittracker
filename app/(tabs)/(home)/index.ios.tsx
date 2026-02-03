
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MonthCalendarModal } from '@/components/MonthCalendarModal';
import { EditHabitModal } from '@/components/EditHabitModal';
import { AddHabitModal, ConfirmModal } from '@/components/AddHabitModal';
import { HabitCard } from '@/components/HabitCard';
import { HabitsOverview } from '@/components/HabitsOverview';
import { useHabits } from '@/hooks/useHabits';
import { Habit, HabitCompletion } from '@/types/habit';
import { PointsNotification } from '@/components/PointsNotification';
import { colors, commonStyles } from '@/styles/commonStyles';
import { AlertModal } from '@/components/AlertModal';
import { useAuth } from '@/contexts/AuthContext';
import { useWidget } from '@/contexts/WidgetContext';
import { IconSymbol } from '@/components/IconSymbol';

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Beginner', minPoints: 0 },
  { level: 2, name: 'Novice', minPoints: 100 },
  { level: 3, name: 'Apprentice', minPoints: 250 },
  { level: 4, name: 'Intermediate', minPoints: 500 },
  { level: 5, name: 'Advanced', minPoints: 1000 },
  { level: 6, name: 'Expert', minPoints: 2000 },
  { level: 7, name: 'Master', minPoints: 4000 },
  { level: 8, name: 'Grandmaster', minPoints: 8000 },
  { level: 9, name: 'Legend', minPoints: 16000 },
  { level: 10, name: 'Mythic', minPoints: 32000 },
];

function getLevelInfo(totalPoints: number) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints >= LEVEL_THRESHOLDS[i].minPoints) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
    } else {
      break;
    }
  }

  const pointsForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  const pointsToNextLevel = nextLevel.minPoints - totalPoints;
  const progress = pointsForNextLevel > 0 
    ? (totalPoints - currentLevel.minPoints) / pointsForNextLevel 
    : 1;

  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    pointsForNextLevel,
    pointsToNextLevel: Math.max(0, pointsToNextLevel),
    progress: Math.min(1, Math.max(0, progress)),
  };
}

export default function HomeScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [pointsNotification, setPointsNotification] = useState<{ visible: boolean; points: number }>({
    visible: false,
    points: 0,
  });
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const router = useRouter();
  const { signOut } = useAuth();
  const { updateWidgetData } = useWidget();
  const {
    habits,
    dashboard,
    loading,
    error,
    addCompletion,
    removeCompletion,
    addPastCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    fetchCompletions,
    refetch,
  } = useHabits();

  // Update widget data whenever dashboard changes
  React.useEffect(() => {
    if (dashboard) {
      console.log('[HomeScreen] Dashboard updated, refreshing widget data');
      updateWidgetData(dashboard);
    }
  }, [dashboard, updateWidgetData]);

  const getTodayCompletionCount = (habitId: string): number => {
    const habit = dashboard?.habits.find(h => h.id === habitId);
    return habit?.completionsToday || 0;
  };

  const handleRefresh = async () => {
    console.log('[HomeScreen] User triggered refresh');
    await refetch();
  };

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setAlertModal({ visible: true, title, message, type });
  };

  const showPointsNotification = (points: number) => {
    setPointsNotification({ visible: true, points });
    setTimeout(() => {
      setPointsNotification({ visible: false, points: 0 });
    }, 2000);
  };

  const handleAddCompletion = async (habitId: string) => {
    console.log('[HomeScreen] User tapped add completion button for habit:', habitId);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await addCompletion(habitId);
      
      if (response.pointsEarned && response.pointsEarned > 0) {
        showPointsNotification(response.pointsEarned);
      }
      
      if (response.message) {
        showAlert('Success', response.message, 'success');
      }
    } catch (err: any) {
      console.error('[HomeScreen] Error adding completion:', err);
      if (err.isAlreadyCompleted) {
        showAlert('Already Completed', err.message, 'info');
      } else {
        showAlert('Error', 'Failed to add completion. Please try again.', 'error');
      }
    }
  };

  const handleRemoveCompletion = async (habitId: string) => {
    console.log('[HomeScreen] User tapped remove completion button for habit:', habitId);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await removeCompletion(habitId);
    } catch (err: any) {
      console.error('[HomeScreen] Error removing completion:', err);
      showAlert('Error', 'Failed to remove completion. Please try again.', 'error');
    }
  };

  const handleCalendarPress = async (habit: Habit) => {
    console.log('[HomeScreen] User tapped calendar button for habit:', habit.name);
    setSelectedHabit(habit);
    setLoadingCompletions(true);
    setCalendarModalVisible(true);
    
    const habitCompletions = await fetchCompletions(habit.id);
    setCompletions(habitCompletions);
    setLoadingCompletions(false);
  };

  const handleAddPastCompletion = async (date: Date) => {
    if (!selectedHabit) {
      return;
    }

    console.log('[HomeScreen] User adding past completion for habit:', selectedHabit.name, 'date:', date);

    if (!dashboard) {
      showAlert('Error', 'Dashboard data not loaded', 'error');
      return;
    }

    if (dashboard.totalPoints < 10) {
      showAlert(
        'Insufficient Points',
        'You need at least 10 points to add a past completion. Adding a past completion costs 10 points and acts as a plaster to keep your streak alive.',
        'error'
      );
      return;
    }

    try {
      const response = await addPastCompletion(selectedHabit.id, date);
      
      const updatedCompletions = await fetchCompletions(selectedHabit.id);
      setCompletions(updatedCompletions);
      
      const costMessage = response.pointsCost ? ` (Cost: ${response.pointsCost} points)` : '';
      showAlert('Success', `Past completion added${costMessage}`, 'success');
    } catch (err: any) {
      console.error('[HomeScreen] Error adding past completion:', err);
      if (err.isAlreadyCompleted) {
        showAlert('Already Completed', err.message, 'info');
      } else {
        showAlert('Error', 'Failed to add past completion. Please try again.', 'error');
      }
    }
  };

  const handleAddHabitPress = () => {
    console.log('[HomeScreen] User tapped Add Habit button');
    setAddModalVisible(true);
  };

  const handleCreateHabit = async (
    name: string,
    color: string,
    goalCount: number,
    goalPeriodDays: number,
    icon: string
  ) => {
    console.log('[HomeScreen] User creating new habit:', { name, color, goalCount, goalPeriodDays, icon });
    try {
      await createHabit(name, color, goalCount, goalPeriodDays, icon);
      setAddModalVisible(false);
      showAlert('Success', 'Habit created successfully!', 'success');
    } catch (err) {
      console.error('[HomeScreen] Error creating habit:', err);
      showAlert('Error', 'Failed to create habit. Please try again.', 'error');
    }
  };

  const handleSettingsPress = (habit: Habit) => {
    console.log('[HomeScreen] User tapped settings button for habit:', habit.name);
    setEditingHabit(habit);
    setEditModalVisible(true);
  };

  const handleUpdateHabit = async (
    habitId: string,
    name: string,
    color: string,
    goalCount: number,
    goalPeriodDays: number,
    icon: string
  ) => {
    console.log('[HomeScreen] User updating habit:', habitId, { name, color, goalCount, goalPeriodDays, icon });
    try {
      await updateHabit(habitId, name, color, goalCount, goalPeriodDays, icon);
      setEditModalVisible(false);
      setEditingHabit(null);
      showAlert('Success', 'Habit updated successfully!', 'success');
    } catch (err) {
      console.error('[HomeScreen] Error updating habit:', err);
      showAlert('Error', 'Failed to update habit. Please try again.', 'error');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    console.log('[HomeScreen] User deleting habit:', habitId);
    try {
      await deleteHabit(habitId);
      setEditModalVisible(false);
      setEditingHabit(null);
      showAlert('Success', 'Habit deleted successfully!', 'success');
    } catch (err) {
      console.error('[HomeScreen] Error deleting habit:', err);
      showAlert('Error', 'Failed to delete habit. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    console.log('[HomeScreen] User tapped logout button');
    setLogoutConfirmVisible(true);
  };

  const handleShowAllBadges = () => {
    console.log('[HomeScreen] User tapped Show All Badges button');
    router.push('/badges');
  };

  if (loading && habits.length === 0) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Stack.Screen options={{ title: 'Habit Tracker' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalPoints = dashboard?.totalPoints || 0;
  const levelInfo = getLevelInfo(totalPoints);
  const recentBadges = dashboard?.recentAchievements || [];

  const recentCompletionsMap: Record<string, { completedAt: string; isMissedCompletion?: boolean }[]> = {};
  const todayCompletionCounts: Record<string, number> = {};
  const nextCompletionPoints: Record<string, number> = {};
  const goalCounts: Record<string, number> = {};

  if (dashboard) {
    dashboard.habits.forEach(habit => {
      recentCompletionsMap[habit.id] = habit.recentCompletions;
      todayCompletionCounts[habit.id] = habit.completionsToday;
      nextCompletionPoints[habit.id] = habit.nextCompletionPoints;
      goalCounts[habit.id] = habit.goalCount;
    });
  }

  return (
    <View style={commonStyles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Habit Tracker',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
              <TouchableOpacity onPress={() => setInfoModalVisible(true)}>
                <IconSymbol 
                  ios_icon_name="info.circle" 
                  android_material_icon_name="info" 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <IconSymbol 
                  ios_icon_name="rectangle.portrait.and.arrow.right" 
                  android_material_icon_name="logout" 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <HabitsOverview
          habits={habits}
          onAddCompletion={handleAddCompletion}
          recentCompletions={recentCompletionsMap}
          todayCompletionCounts={todayCompletionCounts}
          nextCompletionPoints={nextCompletionPoints}
          goalCounts={goalCounts}
        />

        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsTitle}>Total Points</Text>
            <TouchableOpacity onPress={handleShowAllBadges}>
              <Text style={styles.showAllBadgesButton}>Show all badges</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pointsValue}>{totalPoints}</Text>
          
          <View style={styles.levelContainer}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelText}>Level {levelInfo.level}</Text>
              <Text style={styles.levelName}>{levelInfo.levelName}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${levelInfo.progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {levelInfo.pointsToNextLevel} points to next level
            </Text>
          </View>

          {recentBadges.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.badgesTitle}>Recent Badges ({recentBadges.length})</Text>
              <View style={styles.badgesRow}>
                {recentBadges.slice(0, 3).map((badge) => {
                  const badgeIcon = badge.icon || '🏆';
                  return (
                    <View key={badge.id} style={styles.badgeItem}>
                      <Text style={styles.badgeIcon}>{badgeIcon}</Text>
                      <Text style={styles.badgeName} numberOfLines={1}>
                        {badge.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {habits.map((habit) => {
          const todayCount = getTodayCompletionCount(habit.id);
          const habitDashboardData = dashboard?.habits.find(h => h.id === habit.id);
          const recentCompletionDates = habitDashboardData?.recentCompletions.map(c => c.completedAt) || [];
          const nextPoints = habitDashboardData?.nextCompletionPoints || 1;

          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={() => handleAddCompletion(habit.id)}
              onCalendarPress={() => handleCalendarPress(habit)}
              onSettingsPress={() => handleSettingsPress(habit)}
              onDecrement={() => handleRemoveCompletion(habit.id)}
              recentCompletions={recentCompletionDates}
              todayCompletionCount={todayCount}
              pointStreakReset={habit.pointStreakReset}
              nextCompletionPoints={nextPoints}
            />
          );
        })}

        <TouchableOpacity style={styles.addButton} onPress={handleAddHabitPress}>
          <Text style={styles.addButtonText}>+ Add New Habit</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddHabitModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleCreateHabit}
      />

      <EditHabitModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setEditingHabit(null);
        }}
        onSave={handleUpdateHabit}
        onDelete={handleDeleteHabit}
        habit={editingHabit}
      />

      <MonthCalendarModal
        visible={calendarModalVisible}
        onClose={() => {
          setCalendarModalVisible(false);
          setSelectedHabit(null);
          setCompletions([]);
        }}
        habit={selectedHabit!}
        completions={completions}
        onAddCompletion={handleAddPastCompletion}
        loading={loadingCompletions}
      />

      <PointsNotification
        visible={pointsNotification.visible}
        points={pointsNotification.points}
        onHide={() => setPointsNotification({ visible: false, points: 0 })}
      />

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ visible: false, title: '', message: '', type: 'info' })}
      />

      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoModalVisible(false)}
        >
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>How Points Work</Text>
            <Text style={styles.infoModalText}>
              • Complete your daily goal to earn points{'\n'}
              • Points earned = current day number in your streak{'\n'}
              • Day 1 = 1 point, Day 2 = 2 points, Day 3 = 3 points, etc.{'\n'}
              • Missing a day breaks your streak and resets points to 1{'\n'}
              • Use a plaster (costs 10 points) to keep your streak alive{'\n'}
              • After using a plaster, points reset to 1 for the next completion{'\n'}
              • For non-daily habits, points still count based on streak days
            </Text>
            <TouchableOpacity
              style={styles.infoModalButton}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.infoModalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmModal
        visible={logoutConfirmVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        destructive
        onConfirm={async () => {
          setLogoutConfirmVisible(false);
          try {
            await signOut();
            router.replace('/auth');
          } catch (err) {
            console.error('[HomeScreen] Error during logout:', err);
            showAlert('Error', 'Failed to logout. Please try again.', 'error');
          }
        }}
        onCancel={() => setLogoutConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  showAllBadgesButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  levelContainer: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badgesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoModalText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoModalButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  infoModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
