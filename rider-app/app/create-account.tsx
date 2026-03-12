import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Complete auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';

// Role for this app (backend uses this to return APP or REGISTER)
const ROLE = 'rider';

export default function CreateAccountScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const insets = useSafeAreaInsets();
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
                router.push({
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
            const { BASE_URL } = await import('../config');
            const uri = AuthSession.makeRedirectUri();
            const scheme = uri.split('/--/')[0].split('?')[0];
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
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
                router.replace('/create-account');
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

    return (
        <View style={s.safe}>
            <ImageBackground
                source={require('../assets/images/image.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            >
                <View style={s.overlay} />
            </ImageBackground>

            <SafeAreaView style={s.safeContent} edges={['top', 'bottom']}>
                <View style={s.content}>
                    {/* Top branding */}
                    <View style={s.brandSection}>
                        <Text style={s.partner}>Wit Partner</Text>
                        <Text style={s.headline}>
                            Drive and <Text style={s.highlight}>Earn</Text>
                        </Text>
                        <Text style={s.headline}>with Wit</Text>
                    </View>

                    {/* Create account + button — overlay on background, no card */}
                    <View style={[s.bottomBlock, { paddingBottom: 24 + insets.bottom, marginBottom: 36 }]}>
                        <Text style={s.cardTitle}>Create an account</Text>
                        <Text style={s.cardSub}>
                            Save time by linking your social account. We will{'\n'}never share any personal data.
                        </Text>

                        <TouchableOpacity
                            style={[
                                s.btn,
                                s.btnGoogle,
                                (Platform.OS === 'web' ? !request : isLoading) && s.disabledBtn,
                            ]}
                            activeOpacity={0.85}
                            onPress={handleGoogleSignIn}
                            disabled={Platform.OS === 'web' ? !request : isLoading}
                        >
                            <View style={s.googleIconWrapper}>
                                <Ionicons name="logo-google" size={20} color="#EA4335" />
                            </View>
                            <Text style={s.btnText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <Text style={s.terms}>
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#000' },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },

    safeContent: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 0,
    },

    brandSection: {
        paddingTop: 8,
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

    bottomBlock: {
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    cardSub: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 8,
    },

    btn: {
        alignSelf: 'center',
        width: '78%',
        maxWidth: 280,
        height: 48,
        borderRadius: 24,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    btnGoogle: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    googleIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },

    terms: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        lineHeight: 16,
        paddingHorizontal: 20,
    },
    disabledBtn: {
        opacity: 0.5,
        backgroundColor: '#b0b0b0',
    },
});
