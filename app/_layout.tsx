import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tabs */}
      <Stack.Screen name="(tabs)" />
      {/* Existing shop stack */}
      <Stack.Screen name="shop" />
      {/* Search list page (we’ll create /search) */}
      <Stack.Screen name="search" />
    </Stack>
  );
}