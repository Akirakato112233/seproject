import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useDelivery } from "../../context/DeliveryContext";

function formatMoney(n: number) {
  return `${n.toFixed(2)}฿`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function EarningScreen() {
  const { totals, history, clearHistory } = useDelivery();

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <Text style={s.title}>Earning</Text>

      <View style={s.summaryRow}>
        <View style={s.card}>
          <Text style={s.cardLabel}>Total Orders</Text>
          <Text style={s.cardValue}>{totals.totalOrders}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.cardLabel}>Total Earnings</Text>
          <Text style={s.cardValue}>{formatMoney(totals.totalEarnings)}</Text>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>History</Text>
        <TouchableOpacity onPress={clearHistory} style={s.clearBtn}>
          <Text style={s.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No history yet</Text>
          <Text style={s.emptySub}>Complete a job to see earnings here.</Text>
        </View>
      ) : (
        history.map((o) => (
          <View key={`${o.id}-${o.completedAt}`} style={s.item}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>{o.shopName}</Text>
              <Text style={s.itemSub}>{o.customerName}</Text>
              <Text style={s.itemTime}>{formatTime(o.completedAt)}</Text>
            </View>
            <Text style={s.itemFee}>{formatMoney(o.fee)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginBottom: 12 },

  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, elevation: 2 },
  cardLabel: { color: "#64748B", fontWeight: "800", fontSize: 12 },
  cardValue: { color: "#0F172A", fontWeight: "900", fontSize: 18, marginTop: 6 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#EEF2F7" },
  clearText: { fontWeight: "900", color: "#334155" },

  item: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    elevation: 1,
  },
  itemTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  itemSub: { fontSize: 12, fontWeight: "700", color: "#64748B", marginTop: 2 },
  itemTime: { fontSize: 11, fontWeight: "700", color: "#94A3B8", marginTop: 6 },
  itemFee: { fontSize: 14, fontWeight: "900", color: "#0F172A" },

  empty: { backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 1 },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  emptySub: { fontSize: 12, fontWeight: "700", color: "#64748B", marginTop: 6 },
});
