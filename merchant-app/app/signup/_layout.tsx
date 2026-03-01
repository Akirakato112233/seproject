import { Stack } from 'expo-router';

export default function SignupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register" />
      <Stack.Screen name="service-preference" />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
