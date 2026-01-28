import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding */}
      <Stack.Screen name="create-account" />
      <Stack.Screen name="signup" />
      {/* Auth */}
      <Stack.Screen name="sign-in" />
      {/* Tabs */}
      <Stack.Screen name="(tabs)" />
      {/* Existing shop stack */}
      <Stack.Screen name="shop" />
      {/* Search list page (we’ll create /search) */}
      <Stack.Screen name="search" />
    </Stack>
  );
}