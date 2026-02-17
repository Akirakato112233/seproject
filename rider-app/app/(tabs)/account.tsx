import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AccountScreen() {
  const { user, isDevMode } = useAuth();
  return (
    <View style={s.container}>
      <Text style={s.title}>Account</Text>
      {isDevMode && (
        <View style={s.devBadge}>
          <Text style={s.devText}>Dev mode — ไม่ต้องล็อกอิน</Text>
        </View>
      )}
      {user ? (
        <Text style={s.sub}>{user.displayName || user.email}</Text>
      ) : (
        <Text style={s.sub}>Coming soon (ล็อกอินยังไม่ทำ)</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900" },
  devBadge: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#FEF3C7", borderRadius: 8, alignSelf: "flex-start" },
  devText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  sub: { marginTop: 12, color: "#64748B", fontWeight: "700" },
});
