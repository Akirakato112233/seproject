import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock orders data
const MOCK_ORDERS = [
    { id: '1001', customer: 'John Doe', items: 3, total: 450, status: 'pending', time: '10:30 AM' },
    { id: '1002', customer: 'Jane Smith', items: 5, total: 750, status: 'processing', time: '11:15 AM' },
    { id: '1003', customer: 'Mike Johnson', items: 2, total: 300, status: 'ready', time: '12:00 PM' },
    { id: '1004', customer: 'Sarah Williams', items: 4, total: 600, status: 'completed', time: '09:00 AM' },
];

type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed';

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; color: string }> = {
    pending: { label: 'Pending', bg: '#FEF3C7', color: '#D97706' },
    processing: { label: 'Processing', bg: '#DBEAFE', color: '#2563EB' },
    ready: { label: 'Ready', bg: '#D1FAE5', color: '#059669' },
    completed: { label: 'Completed', bg: '#E5E7EB', color: '#6B7280' },
};

export default function OrdersScreen() {
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

    const filteredOrders = filter === 'all'
        ? MOCK_ORDERS
        : MOCK_ORDERS.filter(o => o.status === filter);

    const renderOrder = ({ item }: { item: typeof MOCK_ORDERS[0] }) => {
        const status = STATUS_CONFIG[item.status as OrderStatus];
        return (
            <View style={s.orderCard}>
                <View style={s.orderHeader}>
                    <Text style={s.orderId}>Order #{item.id}</Text>
                    <Text style={s.orderTime}>{item.time}</Text>
                </View>

                <View style={s.orderBody}>
                    <View style={s.row}>
                        <Ionicons name="person-outline" size={16} color="#666" />
                        <Text style={s.orderText}>{item.customer}</Text>
                    </View>
                    <View style={s.row}>
                        <Ionicons name="bag-outline" size={16} color="#666" />
                        <Text style={s.orderText}>{item.items} items</Text>
                    </View>
                </View>

                <View style={s.orderFooter}>
                    <Text style={s.orderTotal}>฿{item.total}</Text>
                    <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {item.status !== 'completed' && (
                    <TouchableOpacity style={s.updateBtn}>
                        <Text style={s.updateBtnText}>Update Status</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Text style={s.title}>Orders</Text>
                <Text style={s.subtitle}>{MOCK_ORDERS.length} total orders</Text>
            </View>

            {/* Filter Tabs */}
            <View style={s.filterRow}>
                {(['all', 'pending', 'processing', 'ready', 'completed'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[s.filterBtn, filter === f && s.filterBtnActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                            {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrder}
                contentContainerStyle={s.list}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyText}>No orders found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        padding: 20,
        backgroundColor: '#0E3A78',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    filterRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: '#fff',
    },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
    },
    filterBtnActive: {
        backgroundColor: '#0E3A78',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    orderTime: {
        fontSize: 12,
        color: '#999',
    },
    orderBody: {
        gap: 8,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderText: {
        fontSize: 14,
        color: '#666',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0E3A78',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    updateBtn: {
        backgroundColor: '#0E3A78',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    updateBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
});
