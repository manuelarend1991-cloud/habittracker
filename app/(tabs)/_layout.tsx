
import React from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Stack } from 'expo-router';

export default function TabLayout() {
  const tabs = [
    {
      name: 'Home',
      route: '/(home)',
      ios_icon_name: 'house.fill',
      android_material_icon_name: 'home',
    },
  ];

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
