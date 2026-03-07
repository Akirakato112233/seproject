import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';

function RootLayoutNav() {
    // Use Stack so that push navigation works across route groups (e.g. (tabs) → shop/...)
    return <Stack screenOptions={{ headerShown: false }} />;
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
