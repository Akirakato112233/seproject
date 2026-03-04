import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhoneInputProps {
    /** Current phone number value */
    value: string;
    /** Callback when user types in the phone field */
    onChangeText: (text: string) => void;
    /** Country dialing code displayed in the prefix box (default "+66") */
    countryCode?: string;
    /** Placeholder shown inside the text input (default "Mobile number") */
    placeholder?: string;
}

/**
 * Composite phone number input with a country code prefix box
 * (flag + code + chevron) and a standard TextInput for the number.
 *
 * Used in: Add Emergency Contact, Edit Emergency Contact.
 */
export default function PhoneInput({
    value,
    onChangeText,
    countryCode = '+66',
    placeholder = 'Mobile number',
}: PhoneInputProps) {
    return (
        <View style={styles.row}>
            <View style={styles.codeBox}>
                <Text style={styles.flag}>🇹🇭</Text>
                <Text style={styles.codeText}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChangeText}
                keyboardType="phone-pad"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 16,
    },
    flag: {
        fontSize: 20,
    },
    codeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0F172A',
        marginBottom: 16,
    },
});
