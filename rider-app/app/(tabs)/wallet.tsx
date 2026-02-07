import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WalletScreen() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Wallet</Text>
      <Text style={s.sub}>Coming soon</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 8, color: "#64748B", fontWeight: "700" },
});
