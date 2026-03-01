import { Stack } from 'expo-router';

export default function SignupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register" />
    </Stack>
  );
}
