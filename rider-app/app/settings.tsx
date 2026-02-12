import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDelivery } from "../context/DeliveryContext";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen() {
    const router = useRouter();
    const { isOnline, autoAccept, toggleAutoAccept } = useDelivery();
    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: () => {
                    logout();
                    router.replace("/");
                },
            },
        ]);
    };

    const handleToggleAutoAccept = () => {
        if (!isOnline) {
            Alert.alert("Offline", "You must be online to change Auto Accept settings.");
            return;
        }
        toggleAutoAccept();
    };

    return (
        <SafeAreaView style={s.container} edges={["top"]}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>All Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={s.content}>
                {/* Account Section */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Account</Text>
                    <TouchableOpacity style={s.row}>
                        <View>
                            <Text style={s.rowTitle}>Natthapong Saehaw</Text>
                            <Text style={s.rowSub}>1กง222 • +66 935792318</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <View style={s.divider} />

                {/* Communications */}
                <TouchableOpacity style={s.row}>
                    <Text style={s.rowTitle}>Communications</Text>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <View style={s.divider} />

                {/* Linked accounts */}
                <TouchableOpacity style={s.row}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                        <Text style={s.rowTitle}>Linked accounts</Text>
                        <Text style={s.rowSub}>Use your third-party accounts to sign in to yours WIT Driver app.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <View style={s.divider} />

                {/* Job Settings */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Job Settings</Text>
                    <View style={s.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardTitle}>Auto Accept</Text>
                            <Text style={s.cardSub}>Automatically accepts orders.</Text>
                        </View>
                        <Switch
                            value={autoAccept}
                            onValueChange={handleToggleAutoAccept}
                            trackColor={{ false: "#E2E8F0", true: "#4ADE80" }} // Light gray / Green
                            thumbColor={"#FFFFFF"}
                            disabled={!isOnline}
                            style={{ opacity: isOnline ? 1 : 0.5 }}
                        />
                    </View>
                </View>

                {/* App Settings */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>App Settings</Text>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={s.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
    backBtn: { padding: 4 },
    content: { flex: 1 },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    rowTitle: { fontSize: 16, fontWeight: "500", color: "#0F172A" },
    rowSub: { fontSize: 14, color: "#64748B", marginTop: 4 },
    divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 8 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    cardTitle: { fontSize: 16, fontWeight: "500", color: "#0F172A" },
    cardSub: { fontSize: 14, color: "#64748B", marginTop: 4 },
    logoutText: { fontSize: 16, fontWeight: "500", color: "#EF4444", paddingVertical: 8 },
});
