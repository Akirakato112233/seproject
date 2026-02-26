import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AvatarPlaceholder from "./AvatarPlaceholder";
import type { EmergencyContact } from "../types";

interface ContactRowProps {
  /** The emergency contact data to display */
  contact: EmergencyContact;
  /** Called when the user taps the row (navigate to edit) */
  onPress: (contact: EmergencyContact) => void;
}

/**
 * A single row in the Emergency Contacts list.
 * Shows a placeholder avatar, name, formatted phone number,
 * and a chevron arrow indicating tap-to-edit.
 */
export default function ContactRow({ contact, onPress }: ContactRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(contact)}>
      <AvatarPlaceholder size={48} />
      <View style={styles.info}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.phone}>
          {contact.countryCode} {contact.phone}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  phone: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
});
