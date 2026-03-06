import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, API } from '../config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';

export default function SignInScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const redirectUri = AuthSession.makeRedirectUri();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (Platform.OS === 'web' && response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleAccessToken(authentication.accessToken);
            }
        }
    }, [response]);

    const handleAccessToken = async (accessToken: string) => {
        setIsLoading(true);
        try {
            const backendRes = await fetch(API.GOOGLE_LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1',
                },
                body: JSON.stringify({ accessToken }),
            });

            const data = await backendRes.json();

            if (data.next === 'REGISTER') {
                router.replace({
                    pathname: '/signup/register',
                    params: {
                        tempToken: data.tempToken,
                        email: data.profile?.email || '',
                        displayName: data.profile?.name || '',
                    },
                });
            } else if (data.next === 'APP') {
                await login(data.token, data.user);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', data.message || 'Login failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMobileGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const scheme = AuthSession.makeRedirectUri().replace(/\/?$/, '');
            const authUrl = `${BASE_URL}/api/google/start?redirect_scheme=${encodeURIComponent(scheme)}`;

            const result = await WebBrowser.openAuthSessionAsync(
                authUrl + '&ngrok-skip-browser-warning=1',
                scheme
            );

            if (result.type === 'success' && result.url) {
                const url = new URL(result.url);
                const accessToken = url.searchParams.get('access_token');
                if (accessToken) {
                    await handleAccessToken(accessToken);
                } else {
                    Alert.alert('Error', 'No access token received');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Google Sign-In failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        if (Platform.OS === 'web') {
            if (!request) return;
            promptAsync();
        } else {
            handleMobileGoogleSignIn();
        }
    };

    const goToEmail = () => {
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.container}>
                <View style={s.header}>
                    <Text style={s.title}>Sign In</Text>
                    <Text style={s.subtitle}>
                        Save time by linking your social account. We will never share any personal data.
                    </Text>
                </View>

                <View style={s.actions}>
                    <TouchableOpacity
                        style={[s.btn, s.btnEmail]}
                        activeOpacity={0.85}
                        onPress={goToEmail}
                        disabled={isLoading}
                    >
                        <Text style={[s.btnText, s.btnTextEmail]}>Continue with email</Text>
                    </TouchableOpacity>

                    <View style={s.orRow}>
                        <View style={s.orLine} />
                        <Text style={s.orText}>OR</Text>
                        <View style={s.orLine} />
                    </View>

                    <TouchableOpacity
                        style={[
                            s.googleCircle,
                            (((!request && Platform.OS === 'web') || isLoading) ? s.disabledBtn : null)
                        ]}
                        activeOpacity={0.85}
                        onPress={handleGoogleSignIn}
                        disabled={(Platform.OS === 'web' && !request) || isLoading}
                    >
                        <Ionicons name="logo-google" size={18} color="#EA4335" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 28 },
    title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 10 },
    subtitle: {
        textAlign: 'center',
        color: '#777',
        fontSize: 12,
        lineHeight: 18,
        paddingHorizontal: 10,
    },
    actions: { gap: 14, alignItems: 'center' },
    btn: {
        width: '100%',
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    btnEmail: { backgroundColor: '#EDEDED' },
    btnText: { fontSize: 14, fontWeight: '700' },
    btnTextEmail: { color: '#111' },
    orRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    orLine: { flex: 1, height: 1, backgroundColor: '#E6E6E6' },
    orText: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
    googleCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E6E6E6',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 2,
    },
    disabledBtn: { opacity: 0.5, backgroundColor: '#f5f5f5' },
});
