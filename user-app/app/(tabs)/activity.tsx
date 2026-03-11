import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API, BASE_URL } from '../../config';

/* ────────── helpers ────────── */

function formatMoney(n: number) {
    return `${n.toFixed(2)}฿`;
}

interface OrderItem {
    _id: string;
    shopName: string;
    items: { name: string; details?: string; price: number }[];
    serviceTotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: 'wallet' | 'cash';
    status: string;
    note?: string;
    shopRating?: number;
    createdAt?: string;
    updatedAt?: string;
}

function getOrderDate(o: OrderItem): Date | null {
    const raw = o.updatedAt ?? o.createdAt;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isYesterday(a: Date, relativeTo: Date): boolean {
    const y = new Date(relativeTo);
    y.setDate(y.getDate() - 1);
    return isSameDay(a, y);
}

function formatDayLabel(d: Date, today: boolean, yesterday: boolean): string {
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    const day = d.getDate();
    const suffix = `(${mon} ${day})`;
    if (today) return `Today ${suffix}`;
    if (yesterday) return `Yesterday ${suffix}`;
    return `${mon} ${day}`;
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
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} BE, ${h}:${min}`;
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        completed: 'Completed',
        cancelled: 'Cancelled',
        decision: 'Pending',
        accepted: 'Accepted',
        waiting_rider: 'Waiting Rider',
        rider_coming: 'Rider Coming',
        at_shop: 'At Shop',
        in_progress: 'In Progress',
        out_for_delivery: 'Out for Delivery',
        deliverying: 'Delivering',
        'In progress': 'In Progress',
        'Ready for pickup': 'Ready for Pickup',
        'Delivering': 'Delivering',
        'Completed': 'Completed',
        'Waiting for rider': 'Waiting Rider',
        'Looking for rider': 'Looking for Rider',
    };
    return map[status] || status;
}

function isCompletedStatus(status: string): boolean {
    return status === 'completed' || status === 'Completed';
}

function isCancelledStatus(status: string): boolean {
    return status === 'cancelled';
}

function isActiveStatus(status: string): boolean {
    return !isCompletedStatus(status) && !isCancelledStatus(status);
}

const todayStart = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
};

/* ────────── ngrok helper ────────── */
const NGROK_HEADERS: Record<string, string> = BASE_URL.includes('ngrok')
    ? { 'ngrok-skip-browser-warning': '1' }
    : {};

/* ────────── Order Row ────────── */

function OrderRow({ o }: { o: OrderItem }) {
    const raw = o.updatedAt ?? o.createdAt;
    const dateStr = raw
        ? formatTimeBE(typeof raw === 'string' ? raw : new Date(raw).toISOString())
        : '';

    const statusColor = isCompletedStatus(o.status)
        ? '#22C55E'
        : isCancelledStatus(o.status)
            ? '#EF4444'
            : '#EAB308';

    return (
        <View style={s.item}>
            <View style={{ flex: 1 }}>
                <Text style={s.itemTitle}>{o.shopName}</Text>
                {dateStr ? <Text style={s.itemTime}>{dateStr}</Text> : null}
            </View>
            <View style={s.itemRight}>
                <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={s.statusBadgeText}>{statusLabel(o.status)}</Text>
                </View>
                <View style={s.itemAmountRow}>
                    <Text style={s.paymentPillSmall}>
                        {o.paymentMethod === 'wallet' ? 'Wallet' : 'Cash'}
                    </Text>
                    <Text style={s.itemFee}>{formatMoney(o.total)}</Text>
                </View>
            </View>
        </View>
    );
}

/* ────────── Main Screen ────────── */

export default function ActivityScreen() {
    const { token } = useAuth();
    const { width: screenWidth } = useWindowDimensions();
    const summaryBlockWidth = screenWidth - 32;

    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

    const [dayCursor, setDayCursor] = useState<Date>(todayStart);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(API.ORDERS_HISTORY, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...NGROK_HEADERS,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders ?? []);
            }
        } catch (e) {
            console.error('Failed to fetch order history:', e);
        }
    }, [token]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchOrders();
            setLoading(false);
        })();
    }, [fetchOrders]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    /* ── daily stats ── */
    const dailyStats = useMemo(() => {
        const dayOrders = orders.filter((o) => {
            const od = getOrderDate(o);
            return od && isSameDay(od, dayCursor);
        });
        return {
            orders: dayOrders.length,
            spending: dayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0),
        };
    }, [orders, dayCursor]);

    /* ── grouped order lists ── */
    const activeOrders = useMemo(() => orders.filter((o) => isActiveStatus(o.status)), [orders]);
    const completedOrders = useMemo(() => orders.filter((o) => isCompletedStatus(o.status)), [orders]);
    const cancelledOrders = useMemo(() => orders.filter((o) => isCancelledStatus(o.status)), [orders]);

    const addDays = (d: Date, n: number) => {
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
    };

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    return (
        <ScrollView
            style={s.container}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
            }
        >
            <View style={s.header}>
                <Text style={s.title}>Activity</Text>
            </View>

            {/* ──── Daily Summary ──── */}
            <View style={[s.summaryBlock, s.summaryBlockDay, { width: summaryBlockWidth }]}>
                <View style={s.summaryBlockTop}>
                    <View style={[s.summaryBlockBadge, s.summaryBlockBadgeDay]}>
                        <Ionicons name="today-outline" size={14} color="#0EA5E9" />
                        <Text style={[s.summaryBlockBadgeText, s.summaryBlockBadgeTextDay]}>
                            Daily
                        </Text>
                    </View>
                    <View style={s.summaryBlockArrows}>
                        <TouchableOpacity
                            onPress={() => setDayCursor((d) => addDays(d, -1))}
                            style={s.arrowBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={18} color="#0EA5E9" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setDayCursor((d) => addDays(d, 1))}
                            style={s.arrowBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={s.summaryBlockPeriod} numberOfLines={1}>
                    {formatDayLabel(
                        dayCursor,
                        isSameDay(dayCursor, new Date()),
                        isYesterday(dayCursor, new Date())
                    )}
                </Text>
                <View style={s.summaryBlockStats}>
                    <View style={[s.summaryBlockStatRow, s.summaryBlockStatRowFirst]}>
                        <Ionicons name="receipt-outline" size={16} color="#94A3B8" />
                        <Text style={s.summaryBlockStatLabel}>Orders</Text>
                        <Text style={s.summaryBlockStatValue}>{dailyStats.orders}</Text>
                    </View>
                    <View style={s.summaryBlockStatRow}>
                        <Ionicons name="cash-outline" size={16} color="#94A3B8" />
                        <Text style={s.summaryBlockStatLabel}>Spending</Text>
                        <Text style={[s.summaryBlockStatValue, s.summaryBlockSpending]}>
                            {formatMoney(dailyStats.spending)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ──── In Progress Orders ──── */}
            {activeOrders.length > 0 && (
                <>
                    <View style={s.statusPillWrap}>
                        <View style={[s.statusPill, s.statusProgress]}>
                            <Text style={s.statusPillText}>In Progress</Text>
                        </View>
                    </View>
                    {activeOrders.map((o) => (
                        <TouchableOpacity
                            key={o._id}
                            activeOpacity={0.8}
                            onPress={() => setSelectedOrder(o)}
                        >
                            <OrderRow o={o} />
                        </TouchableOpacity>
                    ))}
                </>
            )}

            {/* ──── Completed Orders ──── */}
            {completedOrders.length > 0 && (
                <>
                    <View style={s.statusPillWrap}>
                        <View style={[s.statusPill, s.statusCompleted]}>
                            <Text style={s.statusPillText}>Completed</Text>
                        </View>
                    </View>
                    {completedOrders.map((o) => (
                        <TouchableOpacity
                            key={o._id}
                            activeOpacity={0.8}
                            onPress={() => setSelectedOrder(o)}
                        >
                            <OrderRow o={o} />
                        </TouchableOpacity>
                    ))}
                </>
            )}

            {/* ──── Cancelled Orders ──── */}
            {cancelledOrders.length > 0 && (
                <>
                    <View style={s.statusPillWrap}>
                        <View style={[s.statusPill, s.statusCancelled]}>
                            <Text style={s.statusPillText}>Cancelled</Text>
                        </View>
                    </View>
                    {cancelledOrders.map((o) => (
                        <TouchableOpacity
                            key={o._id}
                            activeOpacity={0.8}
                            onPress={() => setSelectedOrder(o)}
                        >
                            <OrderRow o={o} />
                        </TouchableOpacity>
                    ))}
                </>
            )}

            {/* ──── Empty state ──── */}
            {orders.length === 0 && (
                <View style={s.empty}>
                    <Ionicons name="receipt-outline" size={48} color="#CBD5E1" style={{ alignSelf: 'center', marginBottom: 12 }} />
                    <Text style={s.emptyTitle}>No orders yet</Text>
                    <Text style={s.emptySub}>Your order history will appear here.</Text>
                </View>
            )}

            {/* ──── Detail Bottom Sheet ──── */}
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

                            {/* Header */}
                            <View style={s.sheetHeader}>
                                <Text style={s.sheetOrderId}>
                                    ORD-{String(selectedOrder._id).slice(-4)}
                                </Text>
                                <View
                                    style={[
                                        s.sheetBadgeStatus,
                                        isCompletedStatus(selectedOrder.status) && { backgroundColor: '#3B82F6' },
                                        isCancelledStatus(selectedOrder.status) && { backgroundColor: '#EF4444' },
                                        isActiveStatus(selectedOrder.status) && { backgroundColor: '#EAB308' },
                                    ]}
                                >
                                    <Text style={s.sheetBadgeText}>
                                        {statusLabel(selectedOrder.status).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={s.sheetPaymentBadge}>
                                    <Text style={s.sheetPaymentBadgeText}>
                                        {selectedOrder.paymentMethod === 'wallet' ? 'Wallet' : 'cash'}
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

                            {/* Rate Shop Section */}
                            {isCompletedStatus(selectedOrder.status) && !selectedOrder.shopRating && (
                                <TouchableOpacity
                                    style={s.rateShopButton}
                                    onPress={() => {
                                        setSelectedOrder(null);
                                        router.push({
                                            pathname: '/activity/rate-shop/[id]' as any,
                                            params: {
                                                id: selectedOrder._id,
                                                shopName: selectedOrder.shopName
                                            }
                                        });
                                    }}
                                >
                                    <Ionicons name="star" size={20} color="#FFB800" />
                                    <Text style={s.rateShopText}>ให้คะแนนร้านค้า</Text>
                                </TouchableOpacity>
                            )}
                            {isCompletedStatus(selectedOrder.status) && selectedOrder.shopRating && (
                                <View style={s.ratedShopContainer}>
                                    <Text style={s.ratedShopText}>คุณให้คะแนนร้านค้านี้แล้ว: </Text>
                                    <Ionicons name="star" size={16} color="#FFB800" />
                                    <Text style={[s.ratedShopText, { fontWeight: 'bold', marginLeft: 4 }]}>
                                        {selectedOrder.shopRating}
                                    </Text>
                                </View>
                            )}

                            <ScrollView
                                style={s.sheetScroll}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                {/* Total Amount */}
                                <View style={s.sheetTotalCard}>
                                    <Text style={s.sheetTotalLabel}>Total Amount</Text>
                                    <Text style={s.sheetTotalValue}>
                                        {Number(selectedOrder.total ?? 0).toFixed(2)}฿
                                    </Text>
                                </View>

                                {/* Order Info */}
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="information-circle-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Order Details</Text>
                                    </View>
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Order Date</Text>
                                        <Text style={s.sheetDetailValue}>
                                            {formatDateTimeBE(selectedOrder.createdAt)}
                                        </Text>
                                    </View>
                                    {selectedOrder.deliveryFee > 0 && (
                                        <View style={s.sheetDetailRow}>
                                            <Text style={s.sheetDetailLabel}>Delivery Fee</Text>
                                            <Text style={s.sheetDetailValue}>
                                                {formatMoney(selectedOrder.deliveryFee)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Shop Details */}
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="storefront-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Shop Details</Text>
                                    </View>
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Name</Text>
                                        <Text style={s.sheetDetailValue}>
                                            {selectedOrder.shopName}
                                        </Text>
                                    </View>
                                </View>

                                {/* Service List */}
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="list-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Service List</Text>
                                    </View>
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, i) => (
                                            <View key={i} style={s.sheetServiceItem}>
                                                <View style={s.sheetServiceIcon}>
                                                    <Ionicons name="shirt-outline" size={20} color="#3B82F6" />
                                                </View>
                                                <View style={s.sheetServiceContent}>
                                                    <Text style={s.sheetServiceName}>{item.name}</Text>
                                                    <Text style={s.sheetServiceDetail}>
                                                        {item.details ?? item.name}
                                                    </Text>
                                                </View>
                                                <Text style={s.sheetServicePrice}>
                                                    ฿{Number(item.price).toFixed(2)}
                                                </Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={s.sheetDetailLabel}>No items</Text>
                                    )}
                                </View>

                                {/* Note */}
                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="document-text-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Note</Text>
                                    </View>
                                    <View style={s.sheetNoteBox}>
                                        <Text style={s.sheetNoteText}>
                                            {selectedOrder.note?.trim() ? selectedOrder.note : '—'}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Close button */}
                            <TouchableOpacity
                                style={s.sheetCloseAction}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Text style={s.sheetCloseActionText}>ปิด</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
}

/* ────────── Styles ────────── */

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },

    /* Summary Block */
    summaryBlock: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
            android: { elevation: 4 },
        }),
    },
    summaryBlockDay: { borderLeftWidth: 4, borderLeftColor: '#0EA5E9' },
    summaryBlockTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryBlockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        gap: 6,
    },
    summaryBlockBadgeDay: { backgroundColor: 'rgba(14, 165, 233, 0.12)' },
    summaryBlockBadgeText: { fontSize: 12, fontWeight: '800' },
    summaryBlockBadgeTextDay: { color: '#0EA5E9' },
    summaryBlockArrows: { flexDirection: 'row', alignItems: 'center' },
    arrowBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    summaryBlockPeriod: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 14,
        letterSpacing: 0.2,
    },
    summaryBlockStats: {},
    summaryBlockStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    summaryBlockStatRowFirst: { marginTop: 0 },
    summaryBlockStatLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        flex: 1,
        marginLeft: 8,
    },
    summaryBlockStatValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    summaryBlockSpending: { color: '#0EA5E9', fontWeight: '900' },

    /* Status pills */
    statusPillWrap: { marginTop: 14, marginBottom: 8 },
    statusPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusPillText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    statusProgress: { backgroundColor: '#EAB308' },
    statusCompleted: { backgroundColor: '#64748B' },
    statusCancelled: { backgroundColor: '#EF4444' },

    /* Order row */
    item: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
        elevation: 1,
    },
    itemTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    itemTime: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 6 },
    itemRight: { alignItems: 'flex-end', gap: 6 },
    itemAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    paymentPillSmall: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        overflow: 'hidden',
    },
    itemFee: { fontSize: 14, fontWeight: '900', color: '#0F172A' },

    /* Empty */
    empty: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 1, alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
    emptySub: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 6, textAlign: 'center' },

    /* Bottom Sheet */
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
    sheetBadgeStatus: {
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
    sheetCloseAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
    },
    sheetCloseActionText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    rateShopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
        borderWidth: 1,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    rateShopText: {
        color: '#D97706',
        fontWeight: 'bold',
        fontSize: 16,
    },
    ratedShopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 16,
    },
    ratedShopText: {
        color: '#64748B',
        fontSize: 14,
    },
});
