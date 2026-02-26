import React from "react";
import { View, StyleSheet } from "react-native";

interface DividerProps {
  /** Left margin in dp (default 20 to align with content padding) */
  marginLeft?: number;
  /** Divider line color (default #F1F5F9) */
  color?: string;
}

/**
 * Thin horizontal line used as a visual separator between sections.
 * The default left margin keeps it aligned with body content
 * while letting the background peek through on the left.
 */
export default function Divider({
  marginLeft = 20,
  color = "#F1F5F9",
}: DividerProps) {
  return (
    <View style={[styles.line, { marginLeft, backgroundColor: color }]} />
  );
}

const styles = StyleSheet.create({
  line: {
    height: 1,
  },
});
