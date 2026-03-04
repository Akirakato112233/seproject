import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
    /** Title displayed in the center of the header */
    title: string;
    /** Called when the back arrow is pressed */
    onBack: () => void;
    /** Optional right-side element (e.g. edit button) */
    rightElement?: React.ReactNode;
}

/**
 * Reusable top header bar with a back arrow, centered title,
 * and an optional right-side action element.
 *
 * Used across: Edit Account, Emergency Contacts, Add/Edit Contact,
 * Communications, Linked Accounts, Settings.
 */
export default function ScreenHeader({ title, onBack, rightElement }: ScreenHeaderProps) {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            {rightElement ? rightElement : <View style={styles.placeholder} />}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },
    placeholder: {
        width: 24,
    },
});
