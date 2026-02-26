import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { API } from "../config";

interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  countryCode: string;
}

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{
    registrationId: string;
  }>();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await fetch(
        `${API.RIDERS}/registrations/${registrationId}/emergency-contacts`
      );
      const json = await res.json();
      if (json.success) {
        setContacts(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch emergency contacts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts();
  }, [registrationId]);

  useFocusEffect(
    useCallback(() => {
      if (registrationId) fetchContacts();
    }, [registrationId])
  );

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <TouchableOpacity
      style={s.contactRow}
      onPress={() =>
        router.push({
          pathname: "/edit-emergency-contact",
          params: {
            registrationId,
            contactId: item._id,
            contactName: item.name,
            contactPhone: item.phone,
          },
        })
      }
    >
      <View style={[s.contactAvatar, s.avatarPlaceholder]}>
        <Ionicons name="person" size={22} color="#94A3B8" />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.contactName}>{item.name}</Text>
        <Text style={s.contactPhone}>
          {item.countryCode} {item.phone}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Emergency Contacts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Description */}
      <Text style={s.description}>
        If you use Emergency SOS, we'll share your details and live location
        with your saved contacts.
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0E3A78"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id}
          renderItem={renderContact}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E3A78" />
          }
          ListEmptyComponent={
            <Text style={s.emptyText}>No emergency contacts yet.</Text>
          }
        />
      )}

      {/* Add Button — ซ่อนถ้าครบ 3 แล้ว */}
      {contacts.length < 3 && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() =>
              router.push({
                pathname: "/add-emergency-contact",
                params: { registrationId },
              })
            }
          >
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
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
  description: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  contactAvatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  contactName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  contactPhone: { fontSize: 14, color: "#64748B", marginTop: 2 },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 40,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  addBtn: {
    backgroundColor: "#0E3A78",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  addBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
