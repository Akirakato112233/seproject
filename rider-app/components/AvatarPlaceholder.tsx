import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AvatarPlaceholderProps {
  /** Remote image URI; when provided, displays the actual photo */
  uri?: string;
  /** Diameter of the avatar circle in dp (default 48) */
  size?: number;
  /** Ionicons icon name for the fallback (default "person") */
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Circular avatar that shows a remote image when available,
 * otherwise falls back to a grey placeholder icon.
 *
 * Used in: Edit Account (profile photo), Emergency Contacts list.
 */
export default function AvatarPlaceholder({
  uri,
  size = 48,
  fallbackIcon = "person",
}: AvatarPlaceholderProps) {
  const borderRadius = size / 2;
  const iconSize = Math.round(size * 0.46);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Ionicons name={fallbackIcon} size={iconSize} color="#94A3B8" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#F1F5F9",
  },
  placeholder: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
});
