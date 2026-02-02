
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
import { AddHabitModal, ConfirmModal } from '@/components/AddHabitModal';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { habits, dashboard, loading, error, addCompletion, createHabit, refetch } = useHabits();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    console.log('[HomeScreen] User pulled to refresh');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddCompletion = async (habitId: string) => {
    console.log('[HomeScreen] User tapped quick add button for habit:', habitId);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addCompletion(habitId);
    } catch (err) {
      console.error('[HomeScreen] Failed to add completion:', err);
      setErrorMessage('Failed to add completion. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
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
      throw err; // Let the modal handle the error
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
      setErrorMessage('Failed to logout. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

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

      {/* Error Toast */}
      {errorMessage && (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{errorMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Error State */}
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
                // Find recent completions for this habit from dashboard
                const dashboardHabit = dashboard?.habits.find(h => h.id === habit.id);
                const recentCompletions = dashboardHabit?.recentCompletions.map(c => c.completedAt) || [];
                
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onComplete={() => handleAddCompletion(habit.id)}
                    recentCompletions={recentCompletions}
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

      {/* Logout Confirmation */}
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
  errorToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  errorToastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
