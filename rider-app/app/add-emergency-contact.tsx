import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { API } from "../config";

export default function AddEmergencyContactScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{
    registrationId: string;
  }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode] = useState("+66");
  const [saving, setSaving] = useState(false);

  const hasUnsavedChanges = name.trim().length > 0 || phone.trim().length > 0;

  const confirmDiscard = useCallback(() => {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }
    Alert.alert("Discard changes?", "You have unsaved data. Are you sure you want to go back?", [
      { text: "Stay", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  }, [hasUnsavedChanges]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (hasUnsavedChanges) {
          confirmDiscard();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [hasUnsavedChanges])
  );

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter the contact person's name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Missing phone", "Please enter a mobile number.");
      return;
    }
    if (!/^\d{9,10}$/.test(phone.trim())) {
      Alert.alert("Invalid phone", "Phone number must be 9-10 digits.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `${API.RIDERS}/registrations/${registrationId}/emergency-contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            countryCode,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        router.back();
      } else {
        Alert.alert("Error", json.message || "Failed to save contact.");
      }
    } catch (err) {
      console.error("Failed to add emergency contact:", err);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={confirmDiscard} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add Emergency Contacts</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.form}>
          {/* Name */}
          <Text style={s.label}>Name</Text>
          <TextInput
            style={s.input}
            placeholder="Name of contact person"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {/* Phone */}
          <View style={s.phoneRow}>
            <View style={s.countryCodeBox}>
              <Text style={s.flagText}>🇹🇭</Text>
              <Text style={s.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </View>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Mobile number"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Disclaimer */}
          <Text style={s.disclaimer}>
            By saving, you've confirmed that the person agrees to receive
            messages from WIT.
          </Text>
        </View>

        {/* Continue Button */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.continueBtn, saving && { opacity: 0.6 }]}
            onPress={handleContinue}
            disabled={saving}
          >
            <Text style={s.continueBtnText}>
              {saving ? "Saving..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#0F172A" },
  form: { paddingHorizontal: 24, paddingTop: 28 },
  label: { fontSize: 15, fontWeight: "500", color: "#0F172A", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 16,
  },
  phoneRow: { flexDirection: "row", gap: 10 },
  countryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  flagText: { fontSize: 20 },
  countryCodeText: { fontSize: 16, fontWeight: "500", color: "#0F172A" },
  disclaimer: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  bottomBar: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  continueBtn: {
    backgroundColor: "#0E3A78",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  continueBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
