/**
 * Handles OAuth redirect: wit-rider://--/auth?access_token=...
 * Backend redirects here after Google sign-in. We exchange the token and then replace
 * to the correct screen so there is no "back" stack that triggers GO_BACK.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const ROLE = 'rider';

export default function AuthCallbackScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ access_token?: string }>();
    const { login } = useAuth();
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (done) return;
        const token = params.access_token;
        if (!token) {
            setDone(true);
            router.replace('/create-account');
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { API } = await import('../config');
                const backendRes = await fetch(API.GOOGLE_LOGIN, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': '1',
                    },
                    body: JSON.stringify({ accessToken: token, role: ROLE }),
                });
                const data = await backendRes.json();

                if (cancelled) return;
                setDone(true);

                if (data.next === 'REGISTER') {
                    router.replace('/create-account');
                    setTimeout(() => {
                        router.push({
                            pathname: '/signup/register',
                            params: {
                                tempToken: data.tempToken,
                                email: data.profile?.email || '',
                                displayName: data.profile?.name || '',
                                role: ROLE,
                            },
                        });
                    }, 0);
                } else if (data.next === 'APP') {
                    await login(data.token, data.user);
                    router.replace('/(tabs)');
                } else {
                    router.replace('/create-account');
                }
            } catch {
                if (!cancelled) {
                    setDone(true);
                    router.replace('/create-account');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [params.access_token, done, login, router]);

    return (
        <View style={s.container}>
            <ActivityIndicator size="large" color="#0E3A78" />
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
