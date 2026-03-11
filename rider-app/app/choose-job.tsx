import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDelivery, Order } from '../context/DeliveryContext';
import { API, NGROK_HEADERS } from '../config';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

const TIER_LABELS: Record<string, string> = {
    priority: 'Priority',
    standard: 'Standard',
    saver: 'Saver',
};

const TIER_ORDER: ('priority' | 'standard' | 'saver')[] = ['priority', 'standard', 'saver'];

function distanceKm(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number }
): number {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((a.latitude * Math.PI) / 180) *
            Math.cos((b.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
}

function formatDistanceKm(km: number): string {
    return `${km.toFixed(1)} km`;
}

function mapApiOrderToOrder(o: any): Order {
    return {
        id: o.id,
        shopName: o.shopName || 'Shop',
        shopAddress: o.shopAddress || '',
        customerName: o.customerName || 'Customer',
        customerAddress: o.customerAddress || '',
        userId: o.userId,
        distance: o.distance || '—',
        fee: o.fee ?? 0,
        items: o.items ?? 0,
        pickup: o.pickup ?? { latitude: 0, longitude: 0 },
        dropoff: o.dropoff ?? o.pickup ?? { latitude: 0, longitude: 0 },
        shop: o.shop ?? o.pickup,
        note: o.note,
        paymentMethod: o.paymentMethod,
        status: o.status,
        deliveryTier: o.deliveryTier || 'standard',
        shopType: o.shopType,
        hasWashItem: o.hasWashItem,
        hasDryItem: o.hasDryItem,
        itemsList: o.itemsList,
    };
}

export default function ChooseJobScreen() {
    const router = useRouter();
    const { active, startOrder, isOnline, autoAccept } = useDelivery();
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [myCoord, setMyCoord] = useState<{ latitude: number; longitude: number }>({
        latitude: 13.1219,
        longitude: 100.9209,
    });

    const fetchOrders = async () => {
        try {
            const headers: Record<string, string> = { ...NGROK_HEADERS };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(API.ORDERS_PENDING, { headers });
            const data = await res.json();
            if (data.success && Array.isArray(data.orders)) {
                const mapped = data.orders
                    .filter((o: any) => o.id !== active?.id)
                    .map(mapApiOrderToOrder);
                setOrders(mapped);
            } else {
                setOrders([]);
            }
        } catch (e) {
            console.error('Choose Job fetch error:', e);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    useFocusEffect(
        useCallback(() => {
            if (!isOnline || autoAccept) return;
            setLoading(true);
            fetchOrders();
        }, [isOnline, autoAccept, active?.id])
    );

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setMyCoord({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            } catch {}
        })();
    }, []);

    const handleTapJob = (order: Order) => {
        setDetailOrder(order);
    };

    const handleConfirmAccept = async () => {
        if (!detailOrder) return;
        if (active) {
            Alert.alert('มีงานอยู่แล้ว', 'คุณมีงานที่กำลังดำเนินการอยู่ กรุณาให้เสร็จก่อน');
            setDetailOrder(null);
            return;
        }
        setAcceptingId(detailOrder.id);
        const result = await startOrder(detailOrder);
        setAcceptingId(null);
        setDetailOrder(null);
        if (result.success) {
            router.replace('/job');
        } else {
            Alert.alert('รับงานไม่สำเร็จ', result.message ?? 'กรุณาลองใหม่');
            fetchOrders();
        }
    };

    const grouped = TIER_ORDER.map((tier) => ({
        tier,
        label: TIER_LABELS[tier] || tier,
        orders: orders.filter((o) => (o.deliveryTier || 'standard') === tier),
    }));

    if (!isOnline || autoAccept) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Choose Job</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={s.emptyContainer}>
                    <Ionicons name="power" size={48} color="#94A3B8" />
                    <Text style={s.emptyText}>
                        {autoAccept ? 'ปิด Auto Accept ก่อน' : 'ต้องเปิด Go Online ก่อน'}
                    </Text>
                    <Text style={s.emptySub}>
                        {autoAccept
                            ? 'Choose Job ใช้ได้เมื่อปิด Auto Accept'
                            : 'เปิดสถานะ online เพื่อดูและเลือกรับงาน'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Choose Job</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={s.loadingContainer}>
                    <ActivityIndicator size="large" color="#1E3A8A" />
                    <Text style={s.loadingText}>กำลังโหลดงาน...</Text>
                </View>
            ) : (
                <ScrollView
                    style={s.scroll}
                    contentContainerStyle={s.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {grouped.map(({ tier, label, orders: tierOrders }) => (
                        <View key={tier} style={s.section}>
                            <View style={s.sectionHeader}>
                                <Text style={s.sectionTitle}>{label}</Text>
                                <Text style={s.sectionCount}>
                                    {tierOrders.length} งาน
                                </Text>
                            </View>
                            {tierOrders.length === 0 ? (
                                <View style={s.emptySection}>
                                    <Text style={s.emptySectionText}>ไม่มีงานในหมวดนี้</Text>
                                </View>
                            ) : (
                                tierOrders.map((order) => {
                                    const dist = formatDistanceKm(
                                        distanceKm(myCoord, order.pickup)
                                    );
                                    const isAccepting = acceptingId === order.id;
                                    return (
                                        <TouchableOpacity
                                            key={order.id}
                                            style={s.card}
                                            activeOpacity={0.8}
                                            onPress={() => handleTapJob(order)}
                                        >
                                            <View style={s.cardContent}>
                                                <Text style={s.cardCustomer}>
                                                    {order.customerName}
                                                </Text>
                                                <View style={s.cardRow}>
                                                    <Ionicons
                                                        name="location-outline"
                                                        size={14}
                                                        color="#64748B"
                                                    />
                                                    <Text style={s.cardDetail}>{dist}</Text>
                                                </View>
                                                <Text style={s.cardFee}>฿{order.fee}</Text>
                                            </View>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={20}
                                                color="#94A3B8"
                                            />
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    ))}

                    {orders.length === 0 && !loading && (
                        <View style={s.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
                            <Text style={s.emptyText}>ไม่มีงานตอนนี้</Text>
                            <Text style={s.emptySub}>ดึงลงเพื่อ refresh</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* รายละเอียดงาน + ยืนยันรับงาน */}
            <Modal
                visible={!!detailOrder}
                transparent
                animationType="fade"
                onRequestClose={() => setDetailOrder(null)}
            >
                <TouchableOpacity
                    style={s.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDetailOrder(null)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={s.modalCard}
                    >
                        {detailOrder && (
                            <>
                                <View style={s.modalHeader}>
                                    <Text style={s.modalTitle}>รายละเอียดงาน</Text>
                                    <TouchableOpacity
                                        onPress={() => setDetailOrder(null)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close" size={24} color="#64748B" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView
                                    style={s.modalScroll}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={s.modalCustomer}>{detailOrder.customerName}</Text>
                                    <View style={s.modalRow}>
                                        <Ionicons name="storefront-outline" size={18} color="#64748B" />
                                        <Text style={s.modalLabel}>ร้าน:</Text>
                                        <Text style={s.modalValue}>{detailOrder.shopName}</Text>
                                    </View>
                                    <View style={s.modalRow}>
                                        <Ionicons name="location-outline" size={18} color="#64748B" />
                                        <Text style={s.modalLabel}>ที่อยู่ลูกค้า:</Text>
                                    </View>
                                    <Text style={s.modalAddress}>{detailOrder.customerAddress}</Text>
                                    <View style={s.modalRow}>
                                        <Ionicons name="navigate-outline" size={18} color="#64748B" />
                                        <Text style={s.modalLabel}>ระยะทาง:</Text>
                                        <Text style={s.modalValue}>
                                            {formatDistanceKm(distanceKm(myCoord, detailOrder.pickup))}
                                        </Text>
                                    </View>
                                    {detailOrder.itemsList && detailOrder.itemsList.length > 0 && (
                                        <View style={s.modalRow}>
                                            <Ionicons name="shirt-outline" size={18} color="#64748B" />
                                            <Text style={s.modalLabel}>รายการ:</Text>
                                        </View>
                                    )}
                                    {detailOrder.itemsList?.map((item, i) => (
                                        <Text key={i} style={s.modalItem}>
                                            • {item.name} {item.details ? `(${item.details})` : ''} ฿{item.price}
                                        </Text>
                                    ))}
                                    {detailOrder.note ? (
                                        <View style={s.modalRow}>
                                            <Ionicons name="document-text-outline" size={18} color="#64748B" />
                                            <Text style={s.modalLabel}>หมายเหตุ:</Text>
                                        </View>
                                    ) : null}
                                    {detailOrder.note ? (
                                        <Text style={s.modalNote}>{detailOrder.note}</Text>
                                    ) : null}
                                    <View style={s.modalFeeRow}>
                                        <Text style={s.modalFeeLabel}>ค่าจัดส่ง:</Text>
                                        <Text style={s.modalFeeValue}>฿{detailOrder.fee}</Text>
                                    </View>
                                </ScrollView>
                                <View style={s.modalActions}>
                                    <TouchableOpacity
                                        style={s.modalCancelBtn}
                                        onPress={() => setDetailOrder(null)}
                                    >
                                        <Text style={s.modalCancelText}>ปิด</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[s.modalConfirmBtn, !!active && s.modalConfirmDisabled]}
                                        onPress={handleConfirmAccept}
                                        disabled={!!active || acceptingId === detailOrder.id}
                                    >
                                        {acceptingId === detailOrder.id ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={s.modalConfirmText}>ยืนยันรับงาน</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    backBtn: { padding: 4 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 16, color: '#64748B' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    section: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    sectionCount: { fontSize: 14, color: '#64748B' },
    emptySection: {
        padding: 16,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    emptySectionText: { fontSize: 14, color: '#94A3B8' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardContent: { flex: 1 },
    cardCustomer: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    cardDetail: { fontSize: 14, color: '#64748B' },
    cardFee: { fontSize: 16, fontWeight: '600', color: '#10B981', marginTop: 4 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    modalScroll: { maxHeight: 320, padding: 16 },
    modalCustomer: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    modalLabel: { fontSize: 14, color: '#64748B' },
    modalValue: { fontSize: 14, color: '#0F172A', flex: 1 },
    modalAddress: { fontSize: 14, color: '#0F172A', marginBottom: 12, marginLeft: 26 },
    modalItem: { fontSize: 14, color: '#0F172A', marginBottom: 4, marginLeft: 26 },
    modalNote: { fontSize: 14, color: '#0F172A', marginBottom: 12, marginLeft: 26, fontStyle: 'italic' },
    modalFeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modalFeeLabel: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
    modalFeeValue: { fontSize: 18, fontWeight: '700', color: '#10B981' },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
    },
    modalConfirmDisabled: { opacity: 0.5 },
    modalConfirmText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 8,
    },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#64748B' },
    emptySub: { fontSize: 14, color: '#94A3B8' },
});
