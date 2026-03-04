import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface ToggleRowProps {
    /** Label text shown on the left side */
    label: string;
    /** Current on/off state of the toggle */
    value: boolean;
    /** Callback fired when the user flips the toggle */
    onValueChange: (newValue: boolean) => void;
    /** If true the switch is greyed-out and non-interactive */
    disabled?: boolean;
    /** Optional icon element rendered before the label */
    icon?: React.ReactNode;
}

/**
 * A single row containing a label (with optional leading icon)
 * and a Switch toggle on the right.
 *
 * Shared between: Communications (Email / Call) and
 * Linked Accounts (Google).
 */
export default function ToggleRow({
    label,
    value,
    onValueChange,
    disabled = false,
    icon,
}: ToggleRowProps) {
    return (
        <View style={styles.row}>
            <View style={styles.left}>
                {icon && <View style={styles.iconWrap}>{icon}</View>}
                <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
            </View>
            <Switch
                value={disabled ? false : value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                thumbColor="#FFFFFF"
                disabled={disabled}
                style={{ opacity: disabled ? 0.5 : 1 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconWrap: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
    },
    labelDisabled: {
        color: '#94A3B8',
    },
});
