import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { DeliveryProvider } from '../context/DeliveryContext';
import { SignupProvider } from '../context/SignupContext';

function RootLayoutNav() {
    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <SignupProvider>
                <DeliveryProvider>
                    <RootLayoutNav />
                </DeliveryProvider>
            </SignupProvider>
        </AuthProvider>
    );
}
