
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Habit } from '@/types/habit';

interface HabitsOverviewProps {
  habits: Habit[];
}

export function HabitsOverview({ habits }: HabitsOverviewProps) {
  if (habits.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Habits Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.nameColumn}>
              <Text style={styles.headerText}>Habit</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.headerText}>Current</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.headerText}>Best</Text>
            </View>
          </View>

          {/* Habit Rows */}
          {habits.map((habit) => {
            const currentStreakText = `${habit.currentStreak}`;
            const maxStreakText = `${habit.maxStreak}`;

            return (
              <View key={habit.id} style={styles.habitRow}>
                <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
                <View style={styles.nameColumn}>
                  <Text style={styles.habitName} numberOfLines={1}>
                    {habit.name}
                  </Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={[styles.statValue, { color: habit.color }]}>
                    {currentStreakText}
                  </Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={[styles.statValue, { color: habit.color }]}>
                    {maxStreakText}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2563eb',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  scrollView: {
    marginHorizontal: -4,
  },
  table: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  nameColumn: {
    flex: 1,
    minWidth: 120,
    paddingRight: 12,
  },
  statColumn: {
    width: 70,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
