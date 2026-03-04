import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Complete auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';
const BACKEND_URL = 'https://nonheritably-panpsychistic-joannie.ngrok-free.dev';

// Role for this app
const ROLE = 'rider';

export default function CreateAccountScreen() {
    const router = useRouter();
    const { login, setDevMode } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const redirectUri = AuthSession.makeRedirectUri();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CLIENT_ID,
        iosClientId: GOOGLE_CLIENT_ID,
        androidClientId: GOOGLE_CLIENT_ID,
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
            const { API } = await import('../config');
            const backendRes = await fetch(API.GOOGLE_LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1',
                },
                body: JSON.stringify({ accessToken, role: ROLE }),
            });

            const data = await backendRes.json();

            if (data.next === 'REGISTER') {
                router.replace({
                    pathname: '/signup/register',
                    params: {
                        tempToken: data.tempToken,
                        email: data.profile?.email || '',
                        displayName: data.profile?.name || '',
                        role: ROLE,
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
            const scheme = 'exp://192.168.2.40:8081'; // TODO: update IP if needed
            const authUrl = `${BACKEND_URL}/api/google/start?redirect_scheme=${encodeURIComponent(scheme)}`;

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

    const handleDevModeMain = () => {
        setDevMode(true);
        router.replace('/(tabs)');
    };

    const handleDevModeRegister = () => {
        router.push('/signup/register' as any);
    };

    return (
        <SafeAreaView style={s.safe}>
            <ImageBackground
                source={require('../assets/images/image.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            >
                {/* Dark overlay */}
                <View style={s.overlay} />
            </ImageBackground>

            {/* Content */}
            <View style={s.content}>
                {/* Top branding */}
                <View style={s.brandSection}>
                    <Text style={s.partner}>Wit Partner</Text>
                    <Text style={s.headline}>
                        Drive and <Text style={s.highlight}>Earn</Text>
                    </Text>
                    <Text style={s.headline}>with Wit</Text>
                </View>

                {/* Bottom card */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Create an account</Text>
                    <Text style={s.cardSub}>
                        Save time by linking your social account. We will never share any personal
                        data.
                    </Text>

                    {/* Google Sign In */}
                    <TouchableOpacity
                        style={[s.btn, s.btnGoogle, !request && s.disabledBtn]}
                        activeOpacity={0.85}
                        onPress={handleGoogleSignIn}
                        disabled={!request}
                    >
                        <View style={s.googleIconWrapper}>
                            <Ionicons name="logo-google" size={18} color="#EA4335" />
                        </View>
                        <Text style={s.btnText}>Continue with Google</Text>
                    </TouchableOpacity>

                    {/* Dev Mode - Skip to main */}
                    <TouchableOpacity
                        style={s.btnDev}
                        activeOpacity={0.8}
                        onPress={handleDevModeMain}
                    >
                        <Ionicons name="code-slash" size={16} color="#64748B" />
                        <Text style={s.btnDevText}>Dev Mode (Skip Login)</Text>
                    </TouchableOpacity>

                    {/* Dev Mode - Go to Register */}
                    <TouchableOpacity
                        style={s.btnDevRegister}
                        activeOpacity={0.8}
                        onPress={handleDevModeRegister}
                    >
                        <Ionicons name="person-add-outline" size={16} color="#1976D2" />
                        <Text style={s.btnDevRegisterText}>Dev Mode (Register)</Text>
                    </TouchableOpacity>

                    <Text style={s.terms}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#000' },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },

    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 0,
    },

    brandSection: {
        marginTop: 20,
    },
    partner: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    headline: {
        color: '#fff',
        fontSize: 40,
        fontWeight: '900',
        lineHeight: 46,
    },
    highlight: {
        color: '#00D4FF',
    },

    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 28,
        paddingBottom: 40,
        gap: 16,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
    },
    cardSub: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 13,
        lineHeight: 20,
        paddingHorizontal: 10,
    },

    btn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    btnGoogle: {
        backgroundColor: '#0E3A78',
        shadowColor: '#0E3A78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    googleIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    btnDev: {
        width: '100%',
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F8FAFC',
    },
    btnDevText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },

    terms: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 11,
        lineHeight: 16,
        paddingHorizontal: 20,
    },
    disabledBtn: {
        opacity: 0.5,
        backgroundColor: '#b0b0b0',
    },
    btnDevRegister: {
        width: '100%',
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#1976D2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#EFF6FF',
    },
    btnDevRegisterText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1976D2',
    },
});
