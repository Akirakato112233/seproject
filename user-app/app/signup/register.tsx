import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '../../config';
import { useAuth } from '../../context/AuthContext';

/**
 * Register Screen - For new users from Google Sign-In
 * Collects additional info: display name, phone, address
 */
export default function RegisterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        email: string;
        displayName: string;
        tempToken: string;
        googleId?: string; // Keep for backward compatibility
    }>();

    const [displayName, setDisplayName] = useState(params.displayName || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const isValid = displayName.trim().length >= 2;

    const handleRegister = async () => {
        if (!isValid) {
            Alert.alert('Error', 'Please enter your name (at least 2 characters)');
            return;
        }

        setLoading(true);

        try {
            // Use new API if tempToken is available, otherwise use old API
            const apiUrl = params.tempToken ? API.GOOGLE_REGISTER : API.REGISTER_GOOGLE;
            const body = params.tempToken
                ? {
                    tempToken: params.tempToken,
                    displayName: displayName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                }
                : {
                    email: params.email,
                    displayName: displayName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    googleId: params.googleId,
                };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if ((data.success || data.next === 'APP') && data.user) {
                // Registration successful - save token and go to home
                if (data.token) {
                    await login(data.token, data.user);
                }
                console.log('User registered:', data.user);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', data.message || 'Registration failed');
            }
        } catch (error: any) {
            console.error('Register error:', error);
            Alert.alert('Error', error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView
                style={s.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={s.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={s.header}>
                        <Text style={s.title}>Complete Your Profile</Text>
                        <Text style={s.subtitle}>
                            Just a few more details to get you started
                        </Text>
                    </View>

                    <View style={s.form}>
                        {/* Email - Read only */}
                        <View style={s.inputGroup}>
                            <Text style={s.label}>Email</Text>
                            <View style={[s.input, s.inputDisabled]}>
                                <Text style={s.inputText}>{params.email}</Text>
                            </View>
                        </View>

                        {/* Display Name */}
                        <View style={s.inputGroup}>
                            <Text style={s.label}>Display Name *</Text>
                            <TextInput
                                style={s.input}
                                placeholder="Enter your name"
                                value={displayName}
                                onChangeText={setDisplayName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Phone */}
                        <View style={s.inputGroup}>
                            <Text style={s.label}>Phone Number</Text>
                            <TextInput
                                style={s.input}
                                placeholder="+66 xxx-xxx-xxxx"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Address */}
                        <View style={s.inputGroup}>
                            <Text style={s.label}>Address</Text>
                            <TextInput
                                style={[s.input, s.inputMultiline]}
                                placeholder="Enter your address"
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[s.cta, !isValid && s.ctaDisabled]}
                        activeOpacity={0.85}
                        onPress={handleRegister}
                        disabled={!isValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={s.ctaText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
    },
    form: {
        gap: 20,
        marginBottom: 30,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        backgroundColor: '#FAFAFA',
    },
    inputDisabled: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
    },
    inputText: {
        fontSize: 15,
        color: '#666',
    },
    inputMultiline: {
        height: 80,
        paddingTop: 14,
        paddingBottom: 14,
    },
    cta: {
        height: 52,
        borderRadius: 26,
        backgroundColor: '#0E3A78',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        shadowColor: '#0E3A78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    ctaDisabled: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    ctaText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
});
