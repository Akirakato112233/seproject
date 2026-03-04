import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '../../../../config';
import { authGet, authPatch } from '../../../../services/apiClient';

interface OrderData {
    _id: string;
    shopName: string;
    userDisplayName: string;
    total: number;
    paymentMethod: string;
    status: string;
    riderName?: string;
    riderPhoto?: string;
}

export default function OrderArrivedScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        fetchOrder();
        // Poll ทุก 5 วินาที เผื่อ rider กด complete ก่อน user
        const interval = setInterval(fetchOrder, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await authGet(`${API.ORDERS}/${id}`);
            const data = await response.json();
            if (data.success) {
                setOrder(data.order);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderReceived = async () => {
        setConfirming(true);
        try {
            const response = await authPatch(`${API.ORDERS}/${id}/status`, { status: 'completed' });
            const data = await response.json();
            if (data.success) {
                router.replace({
                    pathname: '/shop/order/rate/[id]' as any,
                    params: { id, riderName: order?.riderName || 'Rider' },
                });
            }
        } catch (error) {
            console.error('Error confirming order:', error);
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Status</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoBg}>
                        <Text style={styles.logoText}>Wit</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Your order has arrived!</Text>
                <Text style={styles.subtitle}>Please have your payment ready for your rider.</Text>

                {/* Order Info */}
                <View style={styles.orderCard}>
                    <Text style={styles.shopName}>{order?.shopName || 'Shop'}</Text>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <View
                            style={
                                order?.paymentMethod === 'wallet'
                                    ? styles.paidBadge
                                    : styles.cashBadge
                            }
                        >
                            <Text style={styles.badgeText}>
                                {order?.paymentMethod === 'wallet' ? 'เงินสด' : 'เงินสด'}
                            </Text>
                        </View>
                        <Text style={styles.totalAmount}>฿{order?.total || 0}</Text>
                    </View>
                </View>

                {/* Rider Info */}
                <View style={styles.riderSection}>
                    <Text style={styles.riderSectionTitle}>RIDER INFORMATION</Text>
                    <View style={styles.riderRow}>
                        <View style={styles.riderAvatar}>
                            <Ionicons name="person-circle" size={48} color="#ccc" />
                        </View>
                        <Text style={styles.riderName}>{order?.riderName || 'Rider'}</Text>
                        <View style={styles.riderActions}>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.receivedButton}
                    onPress={handleOrderReceived}
                    disabled={confirming}
                >
                    {confirming ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.receivedButtonText}>Order Received</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
    logoContainer: { marginBottom: 20 },
    logoBg: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#222',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
    orderCard: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    shopName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    totalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    totalLabel: { fontSize: 14, color: '#666', flex: 1 },
    paidBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    cashBadge: {
        backgroundColor: '#FF9800',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    riderSection: { width: '100%' },
    riderSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
        marginBottom: 12,
    },
    riderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    riderAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    riderName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
    riderActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomBar: { padding: 20 },
    receivedButton: {
        backgroundColor: '#1976D2',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
    },
    receivedButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
