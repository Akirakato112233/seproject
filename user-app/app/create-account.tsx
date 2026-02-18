import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
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
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Complete auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com';

/**
 * Create Account Screen - Google Sign-In
 */
export default function CreateAccountScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // @ts-ignore - useProxy is deprecated but works for Expo Go
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: Platform.OS !== 'web',
  });

  console.log('Platform:', Platform.OS);
  console.log('Generated redirectUri:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID, // Required for web platform
    scopes: ['profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    if (request) {
      console.log('Redirect URI created:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    handleResponse();
  }, [response]);

  const handleResponse = async () => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        try {
          // Call backend to check if user exists
          const { API } = await import('../config');
          const backendRes = await fetch(API.GOOGLE_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: authentication.accessToken }),
          });

          const data = await backendRes.json();
          console.log('Backend response:', data);

          if (data.next === 'REGISTER') {
            // User doesn't exist or not onboarded → go to register
            router.replace({
              pathname: '/signup/register',
              params: {
                tempToken: data.tempToken,
                email: data.profile?.email || '',
                displayName: data.profile?.name || '',
              },
            });
          } else if (data.next === 'APP') {
            // User exists → save token and go to app
            await login(data.token, data.user);
            console.log('User logged in:', data.user);
            router.replace('/(tabs)');
          } else {
            Alert.alert('Error', data.message || 'Login failed');
          }
        } catch (error) {
          console.error('Error during login:', error);
          Alert.alert('Error', 'Failed to login');
        }
      }
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google Sign-In failed');
    }
  };

  const handleGoogleSignIn = () => {
    if (!request) {
      console.log('Auth Request not ready');
      return;
    }
    console.log('Google button pressed');
    // @ts-ignore - useProxy is deprecated but works for Expo Go
    promptAsync({ useProxy: Platform.OS !== 'web', showInRecents: false });
  };

  // DEV: ข้ามหน้า login ไปหน้า Home เลย
  const devSkipLogin = async () => {
    try {
      // ดึงข้อมูล dev user จาก backend
      const response = await fetch('http://192.168.0.247:3000/api/auth/dev-user');
      const data = await response.json();
      console.log('Dev user API response data:', data);
      
      if (data.success && data.user) {
        await login('dev_token', data.user);
        console.log('✅ Dev user loaded:', data.user);
      } else {
        // Fallback ถ้าไม่สามารถดึงข้อมูลจาก backend ได้
        await login('dev_token', { 
          _id: '698e27ff93d8fdbda13bb05c', 
          displayName: 'Dev user', 
          email: 'dev-user@example.com',
          balance: 9999
        } as any);
        console.log('⚠️ Using fallback dev user');
      }
    } catch (error) {
      console.error('❌ Error fetching dev user:', error);
      // Fallback ถ้าเกิด error
      await login('dev_token', { 
        _id: '698e27ff93d8fdbda13bb05c', 
        displayName: 'Dev user', 
        email: 'dev-user@example.com',
        balance: 9999
      } as any);
      console.log('⚠️ Using fallback dev user due to error');
    }
    
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Welcome</Text>
          <Text style={s.subtitle}>
            Sign in with your Google account to continue. We will never share any personal data.
          </Text>
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, s.btnGoogle, !request && s.disabledBtn]}
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={!request}
          >
            <View style={s.googleIconWrapper}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
            </View>
            <Text style={s.btnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* DEV: Skip Login Button */}
          {__DEV__ && (
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#FF6B00' }]}
              activeOpacity={0.85}
              onPress={devSkipLogin}
            >
              <Text style={s.btnText}>DEV: Skip Login</Text>
            </TouchableOpacity>
          )}

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
