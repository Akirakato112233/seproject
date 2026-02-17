import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useShop } from '../../context/ShopContext';

export default function ServicesLayout() {
  const router = useRouter();
  const { refreshShop } = useShop();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await refreshShop();
    setSyncing(false);
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Option',
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/(tabs)/settings')}
              style={{ padding: 12, marginLeft: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSync}
              disabled={syncing}
              style={{ padding: 12, marginRight: 4 }}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="sync-outline" size={24} color="#fff" />
              )}
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="add-choice" options={{ title: 'Menu' }} />
      <Stack.Screen name="add-category" options={{ title: 'Add Category' }} />
      <Stack.Screen name="add-item" options={{ title: 'Add Service' }} />
    </Stack>
  );
}
