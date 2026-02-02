
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedGet } from '@/utils/api';

interface AchievementData {
  type: string;
  title: string;
  description: string;
  points: number;
  locked: boolean;
  icon?: string;
}

export default function BadgesScreen() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    console.log('[BadgesScreen] Fetching all achievements...');
    try {
      setLoading(true);
      const data = await authenticatedGet<AchievementData[]>('/api/achievements/available');
      console.log('[BadgesScreen] Fetched achievements:', data.length);
      setAchievements(data);
      setError(null);
    } catch (err) {
      console.error('[BadgesScreen] Error fetching achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter(a => !a.locked).length;
  const totalCount = achievements.length;
  const progressText = `${unlockedCount} / ${totalCount}`;

  return (
    <View style={commonStyles.container}>
      <Stack.Screen
        options={{
          title: 'All Badges',
          headerBackTitle: 'Back',
          headerShown: true,
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={48}
            color="#dc2626"
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAchievements}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={32}
                color={colors.success}
              />
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressValue}>{progressText}</Text>
                <Text style={styles.progressLabel}>Badges Unlocked</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${(unlockedCount / totalCount) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Achievements</Text>
            <Text style={styles.sectionSubtitle}>
              Complete habits to unlock badges and earn points!
            </Text>
          </View>

          {achievements.map((achievement, index) => {
            const isLocked = achievement.locked;
            const pointsText = `${achievement.points}`;
            const emojiIcon = achievement.icon || '🏆';
            
            return (
              <View 
                key={index}
                style={[
                  styles.achievementCard,
                  isLocked && styles.achievementCardLocked
                ]}
              >
                <View style={[styles.achievementIcon, isLocked && styles.achievementIconLocked]}>
                  <Text style={styles.achievementEmoji}>{emojiIcon}</Text>
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, isLocked && styles.achievementTitleLocked]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, isLocked && styles.achievementDescriptionLocked]}>
                    {achievement.description}
                  </Text>
                  <View style={styles.achievementFooter}>
                    <View style={styles.pointsBadge}>
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={14}
                        color={isLocked ? colors.textSecondary : colors.accent}
                      />
                      <Text style={[styles.pointsText, isLocked && styles.pointsTextLocked]}>
                        {pointsText}
                      </Text>
                    </View>
                    {!isLocked && (
                      <View style={styles.unlockedBadge}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={16}
                          color={colors.success}
                        />
                        <Text style={styles.unlockedText}>Unlocked</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
    elevation: 1,
  },
  achievementCardLocked: {
    opacity: 1,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: colors.textSecondary,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  achievementDescriptionLocked: {
    color: colors.textSecondary,
  },
  achievementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  pointsTextLocked: {
    color: colors.textSecondary,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});
