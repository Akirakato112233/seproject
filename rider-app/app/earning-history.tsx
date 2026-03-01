import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDelivery } from "../context/DeliveryContext";
import type { Order } from "../context/DeliveryContext";
import { filterHistoryByPeriod, type PeriodType } from "../utils/earningDateUtils";

function formatMoney(n: number) {
  return `${n.toFixed(2)}฿`;
}

function formatTimeBE(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543;
  const [h, m, s] = d.toTimeString().slice(0, 8).split(":");
  return `${day}/${month}/${year} BE, ${h}:${m}:${s}`;
}

function paymentLabel(paymentMethod?: string): string {
  if (paymentMethod === "wallet") return "Coin";
  if (paymentMethod === "cash") return "Full";
  if (paymentMethod === "card") return "Full";
  return "Full";
}

function OrderRow({ o }: { o: Order & { completedAt?: string } }) {
  const raw = o.completedAt ?? (o as any).updatedAt ?? (o as any).createdAt;
  const dateStr = raw
    ? formatTimeBE(typeof raw === "string" ? raw : new Date(raw).toISOString())
    : "";
  return (
    <View style={s.item}>
      <View style={{ flex: 1 }}>
        <Text style={s.itemTitle}>{o.shopName}</Text>
        <Text style={s.itemSub}>{o.customerName}</Text>
        {dateStr ? <Text style={s.itemTime}>{dateStr}</Text> : null}
      </View>
      <View style={s.itemRight}>
        <View style={s.paymentPill}>
          <Text style={s.paymentPillText}>{paymentLabel((o as any).paymentMethod)}</Text>
        </View>
        <Text style={s.itemFee}>{formatMoney(o.fee)}</Text>
      </View>
    </View>
  );
}

export default function EarningHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    period?: string;
    date?: string;
    periodLabel?: string;
  }>();

  const { history } = useDelivery();
  const period = (params.period ?? "day") as PeriodType;
  const dateIso = params.date;
  const periodLabel = params.periodLabel ?? "History";

  const { orders, totalEarnings } = useMemo(() => {
    if (!dateIso) return { orders: [], totalEarnings: 0 };
    const cursor = new Date(dateIso);
    const filtered = filterHistoryByPeriod(history, period, cursor);
    const earnings = filtered.reduce((s, o) => s + o.fee, 0);
    return { orders: filtered, totalEarnings: earnings };
  }, [history, period, dateIso]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {periodLabel}
        </Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.summaryRow}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Orders</Text>
            <Text style={s.cardValue}>{orders.length}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Earnings</Text>
            <Text style={[s.cardValue, s.cardEarnings]}>{formatMoney(totalEarnings)}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Order details</Text>

        {orders.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
            <Text style={s.emptyTitle}>No orders</Text>
            <Text style={s.emptySub}>No completed orders in this period.</Text>
          </View>
        ) : (
          orders.map((o) => (
            <OrderRow key={String((o as any).id ?? (o as any)._id)} o={o} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F5F9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", flex: 1, textAlign: "center" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  cardLabel: { color: "#64748B", fontWeight: "800", fontSize: 12 },
  cardValue: { color: "#0F172A", fontWeight: "900", fontSize: 20, marginTop: 6 },
  cardEarnings: { color: "#10B981" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 12 },
  item: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  itemTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  itemSub: { fontSize: 12, fontWeight: "700", color: "#64748B", marginTop: 2 },
  itemTime: { fontSize: 11, fontWeight: "700", color: "#94A3B8", marginTop: 6 },
  itemRight: { alignItems: "flex-end", gap: 6 },
  paymentPill: { backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  paymentPillText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  itemFee: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  empty: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 12 },
  emptySub: { fontSize: 13, fontWeight: "600", color: "#64748B", marginTop: 4 },
});
