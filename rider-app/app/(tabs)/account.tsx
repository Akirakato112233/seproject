import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { API } from "../../config";

interface RegistrationData {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  countryCode: string;
  selfieUri?: string;
  vehicleRegistrationNo?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleType?: string;
  nameEN?: string;
  emergencyContacts?: { _id: string; name: string; phone: string; countryCode: string }[];
}

export default function AccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRegistration();
    }, [])
  );

  const fetchRegistration = async () => {
    try {
      setError(false);
      const res = await fetch(`${API.RIDERS}/registrations/latest`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch registration:", err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRegistration();
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? All account data will be permanently erased.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!data?._id) return;
            try {
              const res = await fetch(
                `${API.RIDERS}/registrations/${data._id}`,
                { method: "DELETE" }
              );
              const json = await res.json();
              if (json.success) {
                await logout();
                router.replace("/create-account");
              } else {
                Alert.alert("Error", "Failed to delete account.");
              }
            } catch {
              Alert.alert("Error", "Network error. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#0E3A78" />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#94A3B8" />
        <Text style={s.errorText}>Failed to load account data</Text>
        <TouchableOpacity style={s.retryBtn} onPress={fetchRegistration}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayName = data?.fullName || data?.nameEN || "—";
  const phoneDisplay = data
    ? `${data.countryCode} ${data.phone?.replace(/^0/, "")}`
    : "—";
  const plateNo = data?.vehicleRegistrationNo || "—";
  const vehicleLabel =
    data?.vehicleBrand && data?.vehicleModel
      ? `${data.vehicleBrand} ${data.vehicleModel}`
      : data?.vehicleType || "—";

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E3A78" />
        }
      >
        {/* Personal Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <View style={s.profileRow}>
            <Text style={s.label}>Profile Photo</Text>
            {data?.selfieUri ? (
              <Image source={{ uri: data.selfieUri }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Ionicons name="person" size={28} color="#94A3B8" />
              </View>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* Name */}
        <View style={s.fieldSection}>
          <Text style={s.fieldLabel}>Name</Text>
          <Text style={s.fieldValue}>{displayName}</Text>
        </View>

        <View style={s.divider} />

        {/* Mobile Number */}
        <View style={s.fieldSection}>
          <Text style={s.fieldLabel}>Mobile Number</Text>
          <Text style={s.fieldValue}>{phoneDisplay}</Text>
        </View>

        <View style={s.divider} />

        {/* Email Address */}
        <View style={s.fieldSection}>
          <Text style={s.fieldLabel}>Email Address</Text>
          <Text style={s.fieldValue}>Not set</Text>
        </View>

        <View style={s.divider} />

        {/* Emergency Contacts */}
        <TouchableOpacity
          style={s.fieldSectionRow}
          onPress={() => {
            if (data?._id) {
              router.push({
                pathname: "/emergency-contacts",
                params: { registrationId: data._id },
              });
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Emergency Contacts</Text>
            <Text style={s.fieldValue}>
              {data?.emergencyContacts?.length ?? 0} out of 3 contacts set up
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <View style={s.divider} />

        {/* Vehicle Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Vehicle Information</Text>
          <Text style={s.vehiclePlate}>{plateNo}</Text>
          <Text style={s.vehicleModel}>{vehicleLabel}</Text>
        </View>

        <View style={s.divider} />

        {/* Manage Your Account */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Manage Your Account</Text>

          <TouchableOpacity onPress={handleLogout} style={s.logoutRow}>
            <Ionicons name="log-out-outline" size={20} color="#0E3A78" />
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteAccount} style={{ marginTop: 16 }}>
            <Text style={s.deleteText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={s.deleteHint}>All account data will be erased</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
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
  content: { flex: 1 },

  section: { paddingHorizontal: 20, paddingVertical: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 4 },

  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  label: { fontSize: 15, color: "#0F172A" },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 20 },

  fieldSection: { paddingHorizontal: 20, paddingVertical: 16 },
  fieldSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fieldLabel: { fontSize: 13, color: "#94A3B8", marginBottom: 4 },
  fieldValue: { fontSize: 16, fontWeight: "500", color: "#0F172A" },

  vehiclePlate: { fontSize: 16, fontWeight: "600", color: "#0F172A", marginTop: 8 },
  vehicleModel: { fontSize: 14, color: "#64748B", marginTop: 2 },

  errorText: { fontSize: 16, color: "#64748B", marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#0E3A78",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },

  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "500", color: "#0E3A78" },

  deleteText: { fontSize: 16, fontWeight: "500", color: "#EF4444" },
  deleteHint: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
});
