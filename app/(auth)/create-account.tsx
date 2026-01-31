import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { auth, signInWithGoogleCredential } from '@/services/firebase';

// Complete auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

/**
 * Create Account Screen - Google Sign-In with Firebase
 */
export default function CreateAccountScreen() {
  const router = useRouter();
  const { setDevMode } = useAuth();
  const [loading, setLoading] = useState(false);

  // Hardcoded redirect URI (must match Google Cloud Console)
  const redirectUri = 'https://auth.expo.io/@0822189639/WIT';

  console.log('Using Redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '543704041787-hp11jtovnoufjfkchdcb78g1bo8kk90q.apps.googleusercontent.com',
    redirectUri,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google Sign-In failed');
      setLoading(false);
    } else if (response?.type === 'cancel') {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (authentication: any) => {
    if (!authentication?.accessToken) {
      Alert.alert('Error', 'No access token received');
      setLoading(false);
      return;
    }

    try {
      // Get user info from Google using access token
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${authentication.accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();

      console.log('Google user info:', userInfo);
      const email = userInfo.email;
      const displayName = userInfo.name || userInfo.given_name || email.split('@')[0];
      const googleId = userInfo.id;

      // Check if user exists in our database
      const checkResponse = await fetch(API.CHECK_USER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await checkResponse.json();

      if (data.exists) {
        // User exists - go to home
        console.log('User found:', data.user);
        router.replace('/(customer)/(tabs)');
      } else {
        // User doesn't exist - go to register
        router.push({
          pathname: '/signup/register',
          params: { email, displayName, googleId },
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', error.message || 'Google Sign-In failed');
      setLoading(false);
    }
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
            style={[s.btn, s.btnGoogle]}
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={!request || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <View style={s.googleIconWrapper}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <Text style={s.btnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* DEV MODE: Test User Login */}
          {__DEV__ && (
            <TouchableOpacity
              style={[s.btn, s.btnDev]}
              activeOpacity={0.85}
              onPress={() => {
                console.log('DEV: Logging in as test user');
                setDevMode(true);
                router.replace('/(customer)/(tabs)');
              }}
            >
              <Ionicons name="bug-outline" size={20} color="#fff" />
              <Text style={s.btnText}>Login as Test User (DEV)</Text>
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
  btnDev: {
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
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
});
