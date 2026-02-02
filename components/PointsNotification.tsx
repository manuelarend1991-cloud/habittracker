
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';

interface PointsNotificationProps {
  points: number;
  visible: boolean;
  onHide: () => void;
}

export function PointsNotification({ points, visible, onHide }: PointsNotificationProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      console.log('[PointsNotification] Showing notification for', points, 'points');
      
      // Animate in
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withSpring(1);
      scale.value = withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );

      // Auto-hide after 2.5 seconds
      translateY.value = withDelay(
        2500,
        withSpring(-100, { damping: 15 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        })
      );
      opacity.value = withDelay(2500, withSpring(0));
    }
  }, [visible, points]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  if (!visible) {
    return null;
  }

  const pointsText = `+${points}`;
  const labelText = points === 1 ? 'point' : 'points';
  
  // Add streak indicator for points > 1
  const streakText = points > 1 ? ` (Day ${points} streak!)` : '';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <IconSymbol
          ios_icon_name="star.fill"
          android_material_icon_name="star"
          size={24}
          color={colors.accent}
        />
        <View style={styles.textContainer}>
          <Text style={styles.pointsText}>{pointsText}</Text>
          <Text style={styles.labelText}>{labelText}{streakText}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
