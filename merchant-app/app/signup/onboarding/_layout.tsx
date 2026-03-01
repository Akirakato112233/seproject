import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ProgressBar } from '../../../components/registration/ProgressBar';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { useAuth } from '../../../context/AuthContext';

export default function OnboardingLayout() {
  const { currentStep, merchantUserId, setMerchantUser } = useRegistrationStore();
  const { user } = useAuth();

  // ถ้า store ไม่มี merchantUserId แต่ user login อยู่ ให้ดึงจาก auth
  useEffect(() => {
    if (!merchantUserId && user) {
      const id = user._id || (user as { id?: string }).id;
      if (id) setMerchantUser(String(id));
    }
  }, [merchantUserId, user, setMerchantUser]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <ProgressBar current={currentStep} total={9} />
        <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <View
              key={n}
              style={{
                flex: 1,
                height: 2,
                backgroundColor: n <= currentStep ? '#0E3A78' : '#E8E8E8',
                borderRadius: 1,
              }}
            />
          ))}
        </View>
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="step-1" />
        <Stack.Screen name="step-2" />
        <Stack.Screen name="step-3" />
        <Stack.Screen name="step-4" />
        <Stack.Screen name="step-5" />
        <Stack.Screen name="step-6" />
        <Stack.Screen name="step-7" />
        <Stack.Screen name="step-8" />
        <Stack.Screen name="step-9" />
      </Stack>
    </View>
  );
}
