
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
import { colors, commonStyles } from '@/styles/commonStyles';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/HabitCard';
import { HabitsOverview } from '@/components/HabitsOverview';
import { MonthCalendarModal } from '@/components/MonthCalendarModal';
import { AlertModal } from '@/components/AlertModal';
import { PointsNotification } from '@/components/PointsNotification';
import { AddHabitModal, ConfirmModal } from '@/components/AddHabitModal';
import { EditHabitModal } from '@/components/EditHabitModal';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { Habit, HabitCompletion } from '@/types/habit';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
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
    fetchCompletions,
    refetch 
  } = useHabits();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedHabitForEdit, setSelectedHabitForEdit] = useState<Habit | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'error'>('info');

  const [pointsNotificationVisible, setPointsNotificationVisible] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Calculate today's completion count for each habit - MUST BE DEFINED BEFORE USE
  const getTodayCompletionCount = (habitId: string): number => {
    const dashboardHabit = dashboard?.habits.find(h => h.id === habitId);
    if (!dashboardHabit) {
      return 0;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = dashboardHabit.recentCompletions.filter(c => {
      const completionDate = new Date(c.completedAt).toISOString().split('T')[0];
      return completionDate === today;
    });

    return todayCompletions.length;
  };

  const handleRefresh = async () => {
    console.log('[HomeScreen] User pulled to refresh');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const showPointsNotification = (points: number) => {
    console.log('[HomeScreen] Showing points notification:', points);
    setPointsEarned(points);
    setPointsNotificationVisible(true);
  };

  const handleAddCompletion = async (habitId: string) => {
    console.log('[HomeScreen] User tapped quick add button for habit:', habitId);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await addCompletion(habitId);
      
      // Show points notification - check multiple sources for points earned
      let pointsToShow = 0;
      if (response) {
        // First check if pointsEarned is in the response
        if (response.pointsEarned !== undefined) {
          pointsToShow = response.pointsEarned;
        } 
        // Fallback to completion.points
        else if (response.completion && response.completion.points !== undefined) {
          pointsToShow = response.completion.points;
        }
        
        // Always show notification, even for 1 point
        console.log('[HomeScreen] Showing points notification:', pointsToShow);
        showPointsNotification(pointsToShow);
      }
    } catch (err: any) {
      console.error('[HomeScreen] Failed to add completion:', err);
      
      if (err.isAlreadyCompleted) {
        showAlert('Info', err.message, 'info');
      } else {
        showAlert('Error', 'Failed to add completion. Please try again.', 'error');
      }
    }
  };

  const handleRemoveCompletion = async (habitId: string) => {
    console.log('[HomeScreen] User tapped decrement button for habit:', habitId);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await removeCompletion(habitId);
      showAlert('Success!', 'Completion removed', 'success');
    } catch (err: any) {
      console.error('[HomeScreen] Failed to remove completion:', err);
      showAlert('Error', 'Failed to remove completion. Please try again.', 'error');
    }
  };

  const handleCalendarPress = async (habit: Habit) => {
    console.log('[HomeScreen] User tapped calendar button for habit:', habit.id);
    setSelectedHabit(habit);
    setLoadingCompletions(true);
    setCalendarModalVisible(true);
    
    try {
      const completions = await fetchCompletions(habit.id);
      setHabitCompletions(completions);
    } catch (err) {
      console.error('[HomeScreen] Failed to fetch completions:', err);
      showAlert('Error', 'Failed to load calendar data', 'error');
    } finally {
      setLoadingCompletions(false);
    }
  };

  const handleAddPastCompletion = async (date: Date) => {
    if (!selectedHabit) {
      return;
    }

    console.log('[HomeScreen] Adding past completion for date:', date);
    
    try {
      const response = await addPastCompletion(selectedHabit.id, date);
      
      const updatedCompletions = await fetchCompletions(selectedHabit.id);
      setHabitCompletions(updatedCompletions);
      
      // Build a detailed message about the cost
      let costMessage = '10 points deducted. Your next completion will earn 1 point (streak point worthiness reset).';
      if (response && typeof response === 'object') {
        // Use the message from backend if available
        if ('message' in response && response.message) {
          costMessage = response.message;
        }
      }
      
      showAlert('Success!', `Past completion added. ${costMessage}`, 'success');
    } catch (err: any) {
      console.error('[HomeScreen] Failed to add past completion:', err);
      
      // Check for "not enough points" error
      if (err.message && err.message.includes('Not enough points')) {
        showAlert('Not Enough Points', 'You need at least 10 points to add a missed completion. Complete more habits to earn points!', 'error');
      } else if (err.isAlreadyCompleted) {
        showAlert('Info', err.message, 'info');
      } else {
        showAlert('Error', 'Failed to add past completion', 'error');
      }
    }
  };

  const handleCreateHabit = async (
    name: string,
    color: string,
    goalCount: number,
    goalPeriodDays: number
  ) => {
    console.log('[HomeScreen] Creating new habit:', { name, color, goalCount, goalPeriodDays });
    try {
      await createHabit(name, color, goalCount, goalPeriodDays);
    } catch (err) {
      console.error('[HomeScreen] Failed to create habit:', err);
      throw err;
    }
  };

  const handleSettingsPress = (habit: Habit) => {
    console.log('[HomeScreen] User tapped settings for habit:', habit.id);
    setSelectedHabitForEdit(habit);
    setEditModalVisible(true);
  };

  const handleUpdateHabit = async (
    habitId: string,
    name: string,
    color: string,
    goalCount: number,
    goalPeriodDays: number
  ) => {
    console.log('[HomeScreen] Updating habit:', habitId);
    try {
      await updateHabit(habitId, name, color, goalCount, goalPeriodDays);
      showAlert('Success!', 'Habit updated successfully', 'success');
    } catch (err) {
      console.error('[HomeScreen] Failed to update habit:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    console.log('[HomeScreen] User confirmed logout');
    setLogoutConfirmVisible(false);
    try {
      await signOut();
      router.replace('/auth');
    } catch (err) {
      console.error('[HomeScreen] Logout failed:', err);
      showAlert('Error', 'Failed to logout. Please try again.', 'error');
    }
  };

  // Build recent completions map for HabitsOverview
  const recentCompletionsMap: Record<string, string[]> = {};
  const todayCompletionCountsMap: Record<string, number> = {};
  if (dashboard) {
    dashboard.habits.forEach(h => {
      recentCompletionsMap[h.id] = h.recentCompletions.map(c => c.completedAt);
      todayCompletionCountsMap[h.id] = getTodayCompletionCount(h.id);
    });
  }

  const totalPointsText = dashboard ? `${dashboard.totalPoints}` : '0';
  const recentBadgesCount = dashboard?.recentAchievements?.length || 0;
  const recentBadgesText = `${recentBadgesCount}`;

  return (
    <View style={commonStyles.container}>
      <Stack.Screen
        options={{
          title: 'Habit Tracker',
          headerLargeTitle: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('[HomeScreen] User tapped profile button');
                setProfileModalVisible(true);
              }}
              style={styles.headerButton}
            >
              <IconSymbol
                ios_icon_name="person.circle"
                android_material_icon_name="account-circle"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('[HomeScreen] User tapped add habit button');
                setModalVisible(true);
              }}
              style={styles.headerButton}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <PointsNotification
        points={pointsEarned}
        visible={pointsNotificationVisible}
        onHide={() => setPointsNotificationVisible(false)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="warning"
              size={20}
              color="#dc2626"
            />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Habits Overview - Fixed at top */}
        <HabitsOverview 
          habits={habits} 
          onAddCompletion={handleAddCompletion}
          recentCompletions={recentCompletionsMap}
          todayCompletionCounts={todayCompletionCountsMap}
        />

        {/* Points & Badges Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={24}
              color={colors.accent}
            />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{totalPointsText}</Text>
              <Text style={styles.summaryLabel}>Total Points</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji-events"
              size={24}
              color={colors.success}
            />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{recentBadgesText}</Text>
              <Text style={styles.summaryLabel}>Recent Badges</Text>
            </View>
          </View>
        </View>

        {/* Add New Habit Box */}
        <TouchableOpacity
          style={styles.addHabitBox}
          onPress={() => {
            console.log('[HomeScreen] User tapped Add New Habit box');
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.addHabitText}>Add New Habit</Text>
        </TouchableOpacity>

        {/* Habits List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          
          {loading && habits.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : habits.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="plus.circle"
                android_material_icon_name="add-circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>No habits yet</Text>
              <Text style={styles.emptyStateText}>
                Tap the + button to create your first habit
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {habits.map((habit) => {
                const dashboardHabit = dashboard?.habits.find(h => h.id === habit.id);
                const recentCompletions = dashboardHabit?.recentCompletions.map(c => c.completedAt) || [];
                const todayCount = getTodayCompletionCount(habit.id);
                
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onComplete={() => handleAddCompletion(habit.id)}
                    onCalendarPress={() => handleCalendarPress(habit)}
                    onSettingsPress={() => handleSettingsPress(habit)}
                    onDecrement={() => handleRemoveCompletion(habit.id)}
                    recentCompletions={recentCompletions}
                    todayCompletionCount={todayCount}
                  />
                );
              })}
            </React.Fragment>
          )}
        </View>
      </ScrollView>

      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleCreateHabit}
      />

      <EditHabitModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedHabitForEdit(null);
        }}
        onSave={handleUpdateHabit}
        habit={selectedHabitForEdit}
      />

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Profile</Text>
              <TouchableOpacity
                onPress={() => setProfileModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.profileContent}>
              <View style={styles.profileInfo}>
                <IconSymbol
                  ios_icon_name="person.circle.fill"
                  android_material_icon_name="account-circle"
                  size={64}
                  color={colors.primary}
                />
                <Text style={styles.profileEmail}>{user?.email || 'Not signed in'}</Text>
                {user?.name && <Text style={styles.profileName}>{user.name}</Text>}
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  setProfileModalVisible(false);
                  setLogoutConfirmVisible(true);
                }}
              >
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={logoutConfirmVisible}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmVisible(false)}
        destructive={true}
      />

      {selectedHabit && (
        <MonthCalendarModal
          visible={calendarModalVisible}
          onClose={() => {
            setCalendarModalVisible(false);
            setSelectedHabit(null);
            setHabitCompletions([]);
          }}
          habit={selectedHabit}
          completions={habitCompletions}
          onAddCompletion={handleAddPastCompletion}
          loading={loadingCompletions}
        />
      )}

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextContainer: {
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  addHabitBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addHabitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  profileModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  profileContent: {
    padding: 20,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  profileName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
