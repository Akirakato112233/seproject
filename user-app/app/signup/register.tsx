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
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const isValid = displayName.trim().length >= 2 && phone.trim().length >= 9 && phone[0] === '0';

    const handleRegister = async () => {
        if (displayName.trim().length < 2) {
            Alert.alert('Error', 'Please enter a valid display name');
            return;
        }

        if (phone.length > 0 && phone[0] !== '0') {
            Alert.alert('Error', 'Phone number must start with 0');
            return;
        }

        if (phone.trim().length < 9) {
            Alert.alert('Error', 'Please enter a valid phone number');
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
                }
                : {
                    email: params.email,
                    displayName: displayName.trim(),
                    phone: phone.trim(),
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
                            <Text style={s.label}>Phone Number *</Text>
                            <TextInput
                                style={s.input}
                                placeholder="เบอร์โทรศัพท์สำหรับให้riderติดต่อ"
                                value={phone}
                                onChangeText={(text) => {
                                    const cleaned = text.replace(/[^0-9]/g, '');
                                    setPhone(cleaned);
                                    if (cleaned.length === 1 && cleaned !== '0') {
                                        Alert.alert('รูปแบบไม่ถูกต้อง', 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0');
                                    }
                                }}
                                keyboardType="phone-pad"
                                maxLength={10}
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
