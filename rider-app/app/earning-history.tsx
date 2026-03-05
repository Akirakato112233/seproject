import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
    Modal,
    Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDelivery } from '../context/DeliveryContext';
import type { Order, CompletedOrder } from '../context/DeliveryContext';
import { filterHistoryByPeriod, type PeriodType } from '../utils/earningDateUtils';
import walletIcon from '../assets/images/witwallet.png';
import cashIcon from '../assets/images/cash.png';

function formatMoney(n: number) {
    return `${n.toFixed(2)}฿`;
}

function formatTimeBE(iso: string) {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear() + 543;
    const [h, m, s] = d.toTimeString().slice(0, 8).split(':');
    return `${day}/${month}/${year} BE, ${h}:${m}:${s}`;
}

function formatDateTimeBE(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear() + 543;
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} BE, ${h}:${m}`;
}

function paymentLabel(shopType?: string, paymentMethod?: string): string {
    if (shopType === 'coin') return 'Coin';
    if (shopType === 'full') return 'Full';
    if (paymentMethod === 'wallet') return 'Coin';
    if (paymentMethod === 'cash') return 'Full';
    return 'Full';
}

function paymentIcon(paymentMethod?: string) {
    if (paymentMethod === 'wallet') return walletIcon;
    return cashIcon;
}

function OrderRow({ o }: { o: Order & { completedAt?: string } }) {
    const raw = o.completedAt ?? (o as any).updatedAt ?? (o as any).createdAt;
    const dateStr = raw
        ? formatTimeBE(typeof raw === 'string' ? raw : new Date(raw).toISOString())
        : '';
    return (
        <View style={s.item}>
            <View style={{ flex: 1 }}>
                <Text style={s.itemTitle}>{o.shopName}</Text>
                <Text style={s.itemSub}>{o.customerName}</Text>
                {dateStr ? <Text style={s.itemTime}>{dateStr}</Text> : null}
            </View>
            <View style={s.itemRight}>
                <View style={s.paymentPill}>
                    <Text style={s.paymentPillText}>
                        {paymentLabel((o as any).shopType, (o as any).paymentMethod)}
                    </Text>
                </View>
                <View style={s.itemAmountRow}>
                    <Image
                        source={paymentIcon((o as any).paymentMethod)}
                        style={s.paymentIcon}
                        resizeMode="contain"
                    />
                    <Text style={s.itemFee}>{formatMoney(o.fee)}</Text>
                </View>
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
    const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);

    const { history } = useDelivery();
    const period = (params.period ?? 'day') as PeriodType;
    const dateIso = params.date;
    const periodLabel = params.periodLabel ?? 'History';

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
                        <Text style={[s.cardValue, s.cardEarnings]}>
                            {formatMoney(totalEarnings)}
                        </Text>
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
                        <TouchableOpacity
                            key={String((o as any).id ?? (o as any)._id)}
                            activeOpacity={0.8}
                            onPress={() => setSelectedOrder(o as CompletedOrder)}
                        >
                            <OrderRow o={o} />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Popup รายละเอียดออเดอร์ (แบบเดียวกับ Ready for Pickup) */}
            <Modal
                transparent
                visible={!!selectedOrder}
                animationType="slide"
                onRequestClose={() => setSelectedOrder(null)}
            >
                <View style={s.sheetWrap}>
                    <TouchableOpacity
                        style={s.sheetOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedOrder(null)}
                    />
                    {selectedOrder && (
                        <View style={s.bottomSheet}>
                            <View style={s.sheetHandleWrap}>
                                <View style={s.sheetHandle} />
                            </View>
                            <View style={s.sheetHeader}>
                                <Text style={s.sheetOrderId}>
                                    {(selectedOrder as any).orderId ||
                                        `ORD-${String(selectedOrder.id).slice(-4)}`}
                                </Text>
                                <View style={s.sheetBadgeWashing}>
                                    <Text style={s.sheetBadgeText}>COMPLETED</Text>
                                </View>
                                <View style={s.sheetPaymentBadge}>
                                    <Text style={s.sheetPaymentBadgeText}>
                                        {(selectedOrder as any).paymentMethod === 'wallet'
                                            ? 'Wallet'
                                            : 'cash'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSelectedOrder(null)}
                                    hitSlop={12}
                                    style={s.sheetCloseBtn}
                                >
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView
                                style={s.sheetScroll}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                <View style={s.sheetTotalCard}>
                                    <Text style={s.sheetTotalLabel}>Total Amount</Text>
                                    <Text style={s.sheetTotalValue}>
                                        {Number(
                                            (selectedOrder as any).total ?? selectedOrder.fee ?? 0
                                        ).toFixed(2)}
                                        ฿
                                    </Text>
                                </View>
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="person-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Customer Details</Text>
                                    </View>
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Name</Text>
                                        <Text style={s.sheetDetailValue}>
                                            {selectedOrder.customerName}
                                        </Text>
                                    </View>
                                    {(selectedOrder as any).customerPhone && (
                                        <View style={s.sheetDetailRow}>
                                            <Text style={s.sheetDetailLabel}>Phone</Text>
                                            <Text style={s.sheetDetailValue}>
                                                {(selectedOrder as any).customerPhone}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Order Date</Text>
                                        <Text style={s.sheetDetailValue}>
                                            จบงาน {formatDateTimeBE((selectedOrder as any).completedAt)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="person-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Merchant Details</Text>
                                    </View>
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Name</Text>
                                        <View style={s.sheetMerchantNameRow}>
                                            <Text style={s.sheetDetailValue}>
                                                {selectedOrder.shopName}
                                            </Text>
                                            {(selectedOrder as any).shopPhone && (
                                                <TouchableOpacity
                                                    style={s.sheetCallBtn}
                                                    onPress={() =>
                                                        Linking.openURL(
                                                            `tel:${String(
                                                                (selectedOrder as any).shopPhone
                                                            )}`
                                                        ).catch(() => {})
                                                    }
                                                    hitSlop={8}
                                                >
                                                    <Ionicons
                                                        name="call-outline"
                                                        size={18}
                                                        color="#0EA5E9"
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                    {(selectedOrder as any).shopPhone && (
                                        <View style={s.sheetDetailRow}>
                                            <Text style={s.sheetDetailLabel}>Phone</Text>
                                            <Text style={s.sheetDetailValue}>
                                                {(selectedOrder as any).shopPhone}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="list-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Service List</Text>
                                    </View>
                                    {(selectedOrder as any).itemsList &&
                                    (selectedOrder as any).itemsList.length > 0
                                        ? (selectedOrder as any).itemsList.map(
                                              (
                                                  item: {
                                                      name: string;
                                                      details?: string;
                                                      price: number;
                                                  },
                                                  i: number
                                              ) => (
                                                  <View key={i} style={s.sheetServiceItem}>
                                                      <View style={s.sheetServiceIcon}>
                                                          <Ionicons
                                                              name="shirt-outline"
                                                              size={20}
                                                              color="#3B82F6"
                                                          />
                                                      </View>
                                                      <View style={s.sheetServiceContent}>
                                                          <Text style={s.sheetServiceName}>
                                                              {item.name}
                                                          </Text>
                                                          <Text style={s.sheetServiceDetail}>
                                                              {item.details ?? item.name}
                                                          </Text>
                                                      </View>
                                                      <Text style={s.sheetServicePrice}>
                                                          ฿{Number(item.price).toFixed(2)}
                                                      </Text>
                                                  </View>
                                              )
                                          )
                                        : (
                                            <View style={s.sheetServiceItem}>
                                                <View style={s.sheetServiceIcon}>
                                                    <Ionicons
                                                        name="shirt-outline"
                                                        size={20}
                                                        color="#3B82F6"
                                                    />
                                                </View>
                                                <View style={s.sheetServiceContent}>
                                                    <Text style={s.sheetServiceName}>
                                                        Washing & Folding
                                                    </Text>
                                                    <Text style={s.sheetServiceDetail}>
                                                        {selectedOrder.items ?? 0} kg x ฿40
                                                    </Text>
                                                </View>
                                                <Text style={s.sheetServicePrice}>
                                                    ฿
                                                    {Number(
                                                        (selectedOrder as any).total ??
                                                            selectedOrder.fee ??
                                                            0
                                                    ).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                </View>
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={18}
                                            color="#334155"
                                        />
                                        <Text style={s.sheetCardTitle}>Note</Text>
                                    </View>
                                    <View style={s.sheetNoteBox}>
                                        <Text style={s.sheetNoteText}>
                                            {(selectedOrder as any).note?.trim()
                                                ? (selectedOrder as any).note
                                                : '—'}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>
                            <TouchableOpacity
                                style={s.sheetBtnClose}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Text style={s.sheetBtnCloseText}>ปิด</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F1F5F9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    backBtn: { width: 40, alignItems: 'flex-start' },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        flex: 1,
        textAlign: 'center',
    },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 28 },
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    cardLabel: { color: '#64748B', fontWeight: '800', fontSize: 12 },
    cardValue: { color: '#0F172A', fontWeight: '900', fontSize: 20, marginTop: 6 },
    cardEarnings: { color: '#10B981' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
    item: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    itemTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    itemSub: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 2 },
    itemTime: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 6 },
    itemRight: { alignItems: 'flex-end', gap: 6 },
    itemAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    paymentIcon: {
        width: 20,
        height: 20,
    },
    paymentPill: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    paymentPillText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    itemFee: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    empty: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 1,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 12 },
    emptySub: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },

    sheetWrap: { flex: 1, justifyContent: 'flex-end' },
    sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingHorizontal: 20,
        paddingBottom: 28,
        elevation: 10,
    },
    sheetHandleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    sheetOrderId: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    sheetBadgeWashing: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    sheetBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    sheetPaymentBadge: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    sheetPaymentBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    sheetCloseBtn: { marginLeft: 'auto' },
    sheetScroll: { maxHeight: 400 },
    sheetTotalCard: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 18, marginBottom: 14 },
    sheetTotalLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '800' },
    sheetTotalValue: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 6 },
    sheetCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sheetCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sheetCardTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    sheetDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sheetDetailLabel: { fontSize: 13, color: '#64748B', fontWeight: '700' },
    sheetDetailValue: { fontSize: 13, color: '#0F172A', fontWeight: '800' },
    sheetServiceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sheetServiceIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sheetServiceContent: { flex: 1 },
    sheetServiceName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    sheetServiceDetail: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '700' },
    sheetServicePrice: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    sheetNoteBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sheetNoteText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
    sheetBtnClose: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
    },
    sheetBtnCloseText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    sheetMerchantNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sheetCallBtn: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(14,165,233,0.08)',
    },
});
