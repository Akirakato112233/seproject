import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDelivery } from "../../context/DeliveryContext";
import type { Order, ReadyForPickupOrder } from "../../context/DeliveryContext";

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
  const raw = o.completedAt ?? (o as any).updatedAt ?? (o as any).createdAt;
  const dateStr = raw ? formatTimeBE(typeof raw === "string" ? raw : new Date(raw).toISOString()) : "";
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
  const router = useRouter();
  const { totals, history, clearHistory, readyForPickup, startPickupFromShop, active, atShopOrders } = useDelivery();
  const [selectedReadyOrder, setSelectedReadyOrder] = useState<ReadyForPickupOrder | null>(null);

  const hasReadyForPickup = readyForPickup.length > 0;  // ผ้าซักเสร็จที่ร้าน รอไปรับ
  const hasInProgress = active !== null || atShopOrders.length > 0;  // งานที่กำลังทำ หรือ ออเดอร์ที่ร้านกำลังซัก
  const hasHistory = history.length > 0;

  const handleHeadToPickup = () => {
    if (!selectedReadyOrder) return;
    startPickupFromShop(selectedReadyOrder);
    setSelectedReadyOrder(null);
    router.push("/job");
  };

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

      {hasReadyForPickup && (
        <>
          <View style={s.statusPillWrap}>
            <View style={[s.statusPill, s.statusReady]}>
              <Text style={s.statusPillText}>Ready for Pickup</Text>
            </View>
          </View>
          {readyForPickup.map((o) => (
            <TouchableOpacity
              key={o.id}
              activeOpacity={0.8}
              onPress={() => setSelectedReadyOrder(o)}
            >
              <OrderRow o={o} showDate={!!(o as any).updatedAt} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {hasInProgress && (
        <>
          <View style={s.statusPillWrap}>
            <View style={[s.statusPill, s.statusProgress]}>
              <Text style={s.statusPillText}>In progress</Text>
            </View>
          </View>
          {active && <OrderRow o={active} showDate={false} />}
          {atShopOrders.map((o) => (
            <OrderRow key={o.id} o={o} showDate={true} />
          ))}
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

      {!hasReadyForPickup && !hasInProgress && !hasHistory && (
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

      {/* Bottom Sheet รายละเอียดออเดอร์ Ready for Pickup */}
      <Modal
        transparent
        visible={!!selectedReadyOrder}
        animationType="slide"
        onRequestClose={() => setSelectedReadyOrder(null)}
      >
        <View style={s.sheetWrap}>
          <TouchableOpacity
            style={s.sheetOverlay}
            activeOpacity={1}
            onPress={() => setSelectedReadyOrder(null)}
          />
          {selectedReadyOrder && (
          <View style={s.bottomSheet}>
            <View style={s.sheetHandleWrap}>
              <View style={s.sheetHandle} />
            </View>
            <View style={s.sheetHeader}>
              <Text style={s.sheetOrderId}>{selectedReadyOrder.orderId || `ORD-${String(selectedReadyOrder.id).slice(-4)}`}</Text>
              <View style={s.sheetBadgeWashing}>
                <Text style={s.sheetBadgeText}>WASHING</Text>
              </View>
              <View style={s.sheetPaymentBadge}>
                <Text style={s.sheetPaymentBadgeText}>{selectedReadyOrder.paymentLabel || (selectedReadyOrder.paymentMethod === "wallet" ? "Wallet" : "เงินสด")}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReadyOrder(null)} hitSlop={12} style={s.sheetCloseBtn}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.sheetScroll} showsVerticalScrollIndicator={false} bounces={false}>
              <View style={s.sheetTotalCard}>
                <Text style={s.sheetTotalLabel}>Total Amount</Text>
                <Text style={s.sheetTotalValue}>{Number(selectedReadyOrder.total ?? selectedReadyOrder.fee ?? 0).toFixed(2)}฿</Text>
                <View style={s.sheetUnpaidRow}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={s.sheetUnpaid}>Unpaid</Text>
                </View>
              </View>

              <View style={s.sheetCard}>
                <View style={s.sheetCardTitleRow}>
                  <Ionicons name="person-outline" size={18} color="#334155" />
                  <Text style={s.sheetCardTitle}>Customer Details</Text>
                </View>
                <View style={s.sheetDetailRow}>
                  <Text style={s.sheetDetailLabel}>Name</Text>
                  <Text style={s.sheetDetailValue}>{selectedReadyOrder.customerName}</Text>
                </View>
                {!!selectedReadyOrder.customerPhone && (
                  <View style={s.sheetDetailRow}>
                    <Text style={s.sheetDetailLabel}>Phone</Text>
                    <Text style={s.sheetDetailValue}>{selectedReadyOrder.customerPhone}</Text>
                  </View>
                )}
                <View style={s.sheetDetailRow}>
                  <Text style={s.sheetDetailLabel}>Order Date</Text>
                  <Text style={s.sheetDetailValue}>Today, 2:00 PM - 4:00 PM</Text>
                </View>
              </View>

              <View style={s.sheetCard}>
                <View style={s.sheetCardTitleRow}>
                  <Ionicons name="person-outline" size={18} color="#334155" />
                  <Text style={s.sheetCardTitle}>Merchant Details</Text>
                </View>
                <View style={s.sheetDetailRow}>
                  <Text style={s.sheetDetailLabel}>Name</Text>
                  <Text style={s.sheetDetailValue}>{selectedReadyOrder.shopName}</Text>
                </View>
                {!!selectedReadyOrder.shopPhone && (
                  <View style={s.sheetDetailRow}>
                    <Text style={s.sheetDetailLabel}>Phone</Text>
                    <Text style={s.sheetDetailValue}>{selectedReadyOrder.shopPhone}</Text>
                  </View>
                )}
              </View>

              <View style={s.sheetCard}>
                <View style={s.sheetCardTitleRow}>
                  <Ionicons name="list-outline" size={18} color="#334155" />
                  <Text style={s.sheetCardTitle}>Service List</Text>
                </View>
                {selectedReadyOrder.itemsList && selectedReadyOrder.itemsList.length > 0
                  ? selectedReadyOrder.itemsList.map((item, i) => {
                      const qty = selectedReadyOrder.items ?? 1;
                      const subtotal = item.price * (typeof qty === "number" ? qty : 1);
                      return (
                        <View key={i} style={s.sheetServiceItem}>
                          <View style={s.sheetServiceIcon}>
                            <Ionicons name="shirt-outline" size={20} color="#3B82F6" />
                          </View>
                          <View style={s.sheetServiceContent}>
                            <Text style={s.sheetServiceName}>{item.name}</Text>
                            <Text style={s.sheetServiceDetail}>
                              {item.details || `${qty} kg x ฿${item.price}`}
                            </Text>
                          </View>
                          <Text style={s.sheetServicePrice}>฿{subtotal}</Text>
                        </View>
                      );
                    })
                  : (
                      <View style={s.sheetServiceItem}>
                        <View style={s.sheetServiceIcon}>
                          <Ionicons name="shirt-outline" size={20} color="#3B82F6" />
                        </View>
                        <View style={s.sheetServiceContent}>
                          <Text style={s.sheetServiceName}>Washing & Folding</Text>
                          <Text style={s.sheetServiceDetail}>{selectedReadyOrder.items ?? 0} kg x ฿40</Text>
                        </View>
                        <Text style={s.sheetServicePrice}>฿{Number(selectedReadyOrder.total ?? selectedReadyOrder.fee ?? 0).toFixed(0)}</Text>
                      </View>
                  )}
              </View>

              <View style={s.sheetCard}>
                <View style={s.sheetCardTitleRow}>
                  <Ionicons name="document-text-outline" size={18} color="#334155" />
                  <Text style={s.sheetCardTitle}>Note</Text>
                </View>
                <View style={s.sheetNoteBox}>
                  <Text style={s.sheetNoteText}>{selectedReadyOrder.note || "—"}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={s.sheetBtnHeadToPickup} onPress={handleHeadToPickup}>
              <Text style={s.sheetBtnHeadToPickupText}>Head to Pickup</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
          )}
        </View>
      </Modal>
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

  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 20,
    paddingBottom: 28,
    elevation: 10,
  },
  sheetHandleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" },
  sheetHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  sheetOrderId: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  sheetBadgeWashing: { backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sheetBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  sheetPaymentBadge: { backgroundColor: "#22C55E", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sheetPaymentBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  sheetCloseBtn: { marginLeft: "auto" },
  sheetScroll: { maxHeight: 400 },
  sheetTotalCard: { backgroundColor: "#3B82F6", borderRadius: 16, padding: 18, marginBottom: 14 },
  sheetTotalLabel: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "800" },
  sheetTotalValue: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 6 },
  sheetUnpaidRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 },
  sheetUnpaid: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" },
  sheetCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sheetCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sheetCardTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  sheetDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sheetDetailLabel: { fontSize: 13, color: "#64748B", fontWeight: "700" },
  sheetDetailValue: { fontSize: 13, color: "#0F172A", fontWeight: "800" },
  sheetServiceItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sheetServiceIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  sheetServiceContent: { flex: 1 },
  sheetServiceName: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  sheetServiceDetail: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "700" },
  sheetServicePrice: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  sheetNoteBox: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  sheetNoteText: { fontSize: 13, color: "#64748B", fontWeight: "700" },
  sheetBtnHeadToPickup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  sheetBtnHeadToPickupText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
