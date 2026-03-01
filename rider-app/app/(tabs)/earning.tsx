import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useDelivery } from "../../context/DeliveryContext";
import type { Order } from "../../context/DeliveryContext";

function formatMoney(n: number) {
  return `${n.toFixed(2)}฿`;
}

/** วันที่แบบ พ.ศ. เช่น 27/02/2569 BE, 17:13:51 */
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

function OrderRow({ o, showDate = true }: { o: Order & { completedAt?: string }; showDate?: boolean }) {
  const dateStr = o.completedAt ? formatTimeBE(o.completedAt) : (o as any).createdAt ? formatTimeBE((o as any).createdAt) : "";
  return (
    <View style={s.item}>
      <View style={{ flex: 1 }}>
        <Text style={s.itemTitle}>{o.shopName}</Text>
        <Text style={s.itemSub}>{o.customerName}</Text>
        {showDate && dateStr ? <Text style={s.itemTime}>{dateStr}</Text> : null}
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

export default function EarningScreen() {
  const { totals, history, clearHistory, available, active } = useDelivery();

  const hasReady = available.length > 0;
  const hasInProgress = active !== null;
  const hasHistory = history.length > 0;

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

      {hasReady && (
        <>
          <View style={s.statusPillWrap}>
            <View style={[s.statusPill, s.statusReady]}>
              <Text style={s.statusPillText}>Ready for Pickup</Text>
            </View>
          </View>
          {available.map((o) => (
            <OrderRow key={o.id} o={o} showDate={!!(o as any).createdAt} />
          ))}
        </>
      )}

      {hasInProgress && active && (
        <>
          <View style={s.statusPillWrap}>
            <View style={[s.statusPill, s.statusProgress]}>
              <Text style={s.statusPillText}>In progress</Text>
            </View>
          </View>
          <OrderRow o={active} showDate={false} />
        </>
      )}

      {hasHistory && (
        <>
          <View style={s.statusPillWrap}>
            <View style={[s.statusPill, s.statusCompleted]}>
              <Text style={s.statusPillText}>Completed</Text>
            </View>
          </View>
          {history.map((o) => (
            <OrderRow key={`${o.id}-${o.completedAt}`} o={o} />
          ))}
        </>
      )}

      {!hasReady && !hasInProgress && !hasHistory && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No history yet</Text>
          <Text style={s.emptySub}>Complete a job to see earnings here.</Text>
        </View>
      )}

      {hasHistory ? (
        <View style={s.sectionHeader}>
          <TouchableOpacity onPress={clearHistory} style={s.clearBtn}>
            <Text style={s.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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

  statusPillWrap: { marginTop: 14, marginBottom: 8 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  statusReady: { backgroundColor: "#22C55E" },
  statusProgress: { backgroundColor: "#EAB308" },
  statusCompleted: { backgroundColor: "#64748B" },

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
  itemRight: { alignItems: "flex-end", gap: 6 },
  paymentPill: { backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  paymentPillText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  itemFee: { fontSize: 14, fontWeight: "900", color: "#0F172A" },

  empty: { backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 1 },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  emptySub: { fontSize: 12, fontWeight: "700", color: "#64748B", marginTop: 6 },
});
