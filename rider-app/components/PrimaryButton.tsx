import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

interface PrimaryButtonProps {
  /** Button label text */
  label: string;
  /** Called when the button is pressed */
  onPress: () => void;
  /** Prevents interaction and dims the button */
  disabled?: boolean;
  /** Extra styles applied to the outer container */
  style?: ViewStyle;
}

/**
 * Full-width rounded button used as the main CTA across screens
 * (e.g. "Add", "Continue", "Save").
 *
 * Follows the WIT design system: dark navy background (#0E3A78),
 * white bold text, fully rounded corners.
 */
export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#0E3A78",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
