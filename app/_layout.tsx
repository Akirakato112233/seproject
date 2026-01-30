import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
  const { user, loading, isDevMode } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) return;
    if (loading) return;

    const inAuthGroup = segments[0] === 'create-account' || segments[0] === 'signup' || segments[0] === 'sign-in';

    // Allow access if user is signed in OR in dev mode
    if (user || isDevMode) {
      // User is signed in (or dev mode) - go to app
      if (inAuthGroup || segments.length === 0) {
        console.log('User signed in or DEV mode, redirecting to tabs');
        router.replace('/(tabs)');
      }
    } else {
      // User is NOT signed in - go to create-account
      if (!inAuthGroup) {
        console.log('No user, redirecting to create-account');
        router.replace('/create-account');
      }
    }
  }, [user, loading, isDevMode, segments, navigationState?.key]);

  // Show loading while checking auth
  if (loading || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0E3A78" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}