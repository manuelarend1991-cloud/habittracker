
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { usePlacement } from 'expo-superwall';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function UpgradeScreen() {
  const router = useRouter();
  const { registerPlacement, state } = usePlacement({
    onPresent: (info) => {
      console.log('[UpgradeScreen] Paywall presented:', info);
    },
    onDismiss: (info, result) => {
      console.log('[UpgradeScreen] Paywall dismissed:', info, 'Result:', result);
      // If user purchased, navigate back
      if (result === 'purchased' || result === 'restored') {
        router.back();
      }
    },
    onError: (error) => {
      console.error('[UpgradeScreen] Paywall error:', error);
    },
  });

  const handleUpgrade = async () => {
    console.log('[UpgradeScreen] User tapped Upgrade button');
    await registerPlacement({
      placement: 'habit_tracker_premium',
      feature: () => {
        console.log('[UpgradeScreen] User has premium access');
        router.back();
      },
    });
  };

  const premiumFeatureText = 'Track unlimited habits';
  const premiumFeature2Text = 'Full access to all features';
  const premiumFeature3Text = 'Priority support';
  const premiumFeature4Text = 'No ads';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Upgrade to Premium',
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>Unlock unlimited habit tracking</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>{premiumFeatureText}</Text>
          </View>

          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>{premiumFeature2Text}</Text>
          </View>

          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>{premiumFeature3Text}</Text>
          </View>

          <View style={styles.featureRow}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>{premiumFeature4Text}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleUpgrade}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  restoreButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
