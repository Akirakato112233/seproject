import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';

function RootLayoutNav() {
  // Frontend-only mode: No auth checks required.
  // Simply render the slot to allow navigation to any screen.
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <RootLayoutNav />
      </LocationProvider>
    </AuthProvider>
  );
}