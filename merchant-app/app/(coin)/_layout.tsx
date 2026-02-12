import { Stack } from 'expo-router';
import React from 'react';
import { MachineProvider } from '../../context/MachineContext';

/**
 * Layout for coin-operated machine shop flow (ตู้หยอดเหรียญ).
 * Screens: Shop Status / Live Monitor, Add Machine, etc.
 */
export default function CoinLayout() {
  return (
    <MachineProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="monitor" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="machine-settings" />
      </Stack>
    </MachineProvider>
  );
}
