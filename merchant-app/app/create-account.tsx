import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API, BASE_URL, NGROK_HEADERS } from '../config';

// Complete auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';
const ROLE = 'merchant';

// สำหรับ OAuth redirect (mobile) - ใช้ ngrok หรือ BASE_URL
const BACKEND_URL = process.env.EXPO_PUBLIC_BASE_URL || BASE_URL;

/**
 * Create Account Screen - Google Sign-In for Merchant
 * Flow เหมือน user app: Web ใช้ expo-auth-session, Mobile ใช้ backend OAuth
 */
export default function CreateAccountScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const processedResponseRef = useRef<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  const handleAccessToken = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const backendRes = await fetch(API.GOOGLE_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
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
            demo: '1',
          },
        });
      } else if (data.next === 'APP') {
        await login(data.token, data.user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || response?.type !== 'success') return;
    const { authentication } = response;
    const token = authentication?.accessToken;
    if (!token) return;
    // ป้องกัน process ซ้ำเมื่อ response ยังคงอยู่
    const key = token.slice(0, 30);
    if (processedResponseRef.current === key) return;
    processedResponseRef.current = key;
    handleAccessToken(token);
  }, [response]);

  const handleMobileGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const fullUri = AuthSession.makeRedirectUri();
      const scheme = fullUri.replace(/\/--\/auth.*$/, '') || fullUri;
      const authUrl = `${BACKEND_URL}/api/google/start?redirect_scheme=${encodeURIComponent(scheme)}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl + (BACKEND_URL.includes('ngrok') ? '&ngrok-skip-browser-warning=1' : ''),
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
    } catch {
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
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Merchant Portal</Text>
          <Text style={s.subtitle}>
            Sign in with your Google account to manage your shop. We will never share any personal data.
          </Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, s.btnGoogle, (Platform.OS === 'web' && !request) && s.disabledBtn]}
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={isLoading || (Platform.OS === 'web' && !request)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={s.googleIconWrapper}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <Text style={s.btnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={s.entryRow}>
            <TouchableOpacity
              style={[s.entryBtn, s.entryBtnLaundry]}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
            >
              <Ionicons name="shirt-outline" size={20} color="#fff" />
              <Text style={s.entryBtnText}>ร้านรับซัก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.entryBtn, s.entryBtnCoin]}
              onPress={() => router.replace('/(coin)')}
              activeOpacity={0.7}
            >
              <Ionicons name="hardware-chip-outline" size={20} color="#fff" />
              <Text style={s.entryBtnText}>ร้านหยอดเหรียญ</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={s.skipBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={s.skipText}>ข้าม เข้าใช้งานเลย (ร้านรับซัก)</Text>
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
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  actions: {
    gap: 20,
    alignItems: 'center',
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
  entryRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  entryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  entryBtnLaundry: {
    backgroundColor: '#0E3A78',
  },
  entryBtnCoin: {
    backgroundColor: '#0d9488',
  },
  entryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  skipBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  terms: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: '#b0b0b0',
  }
});
