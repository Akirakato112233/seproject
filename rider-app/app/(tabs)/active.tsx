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

// Mock active order
const MOCK_ACTIVE_ORDER = {
    id: '1',
    shopName: 'WashPro Laundry',
    shopAddress: '100 Shop St, Bangkok',
    customerName: 'John Doe',
    customerAddress: '123 Main St, Bangkok',
    price: 150,
    status: 'picking_up', // picking_up, delivering, 
    items: 3,
};

export default function ActiveScreen() {
    const [activeOrder, setActiveOrder] = useState<typeof MOCK_ACTIVE_ORDER | null>(null);

    const handlePickedUp = () => {
        if (activeOrder) {
            setActiveOrder({ ...activeOrder, status: 'delivering' });
        }
    };

    const handleDelivered = () => {
        setActiveOrder(null);
        // TODO: Call API to complete delivery
    };

    // Demo: Set active order
    const handleDemo = () => {
        setActiveOrder(MOCK_ACTIVE_ORDER);
    };

    if (!activeOrder) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.header}>
                    <Text style={s.title}>Active Delivery</Text>
                </View>
                <View style={s.empty}>
                    <Ionicons name="bicycle-outline" size={64} color="#ccc" />
                    <Text style={s.emptyText}>No active delivery</Text>
                    <Text style={s.emptySubtext}>Accept an order to start delivering</Text>

                    <TouchableOpacity style={s.demoBtn} onPress={handleDemo}>
                        <Text style={s.demoBtnText}>Demo: Start Delivery</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Text style={s.title}>Active Delivery</Text>
                <View style={s.statusBadge}>
                    <Text style={s.statusText}>
                        {activeOrder.status === 'picking_up' ? '📦 Picking Up' : '🚴 Delivering'}
                    </Text>
                </View>
            </View>

            <View style={s.content}>
                {/* From Shop */}
                <View style={s.locationCard}>
                    <View style={s.locationHeader}>
                        <Ionicons name="storefront-outline" size={24} color="#0E3A78" />
                        <Text style={s.locationTitle}>Pickup from</Text>
                    </View>
                    <Text style={s.locationName}>{activeOrder.shopName}</Text>
                    <Text style={s.locationAddress}>{activeOrder.shopAddress}</Text>

                    {activeOrder.status === 'picking_up' && (
                        <TouchableOpacity style={s.actionBtn} onPress={handlePickedUp}>
                            <Text style={s.actionBtnText}>Mark as Picked Up</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Arrow */}
                <View style={s.arrow}>
                    <Ionicons name="arrow-down" size={24} color="#ccc" />
                </View>

                {/* To Customer */}
                <View style={[s.locationCard, activeOrder.status === 'picking_up' && s.locationCardDisabled]}>
                    <View style={s.locationHeader}>
                        <Ionicons name="person-outline" size={24} color="#0E3A78" />
                        <Text style={s.locationTitle}>Deliver to</Text>
                    </View>
                    <Text style={s.locationName}>{activeOrder.customerName}</Text>
                    <Text style={s.locationAddress}>{activeOrder.customerAddress}</Text>

                    {activeOrder.status === 'delivering' && (
                        <TouchableOpacity style={s.actionBtn} onPress={handleDelivered}>
                            <Text style={s.actionBtnText}>Mark as Delivered</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Order Info */}
                <View style={s.orderInfo}>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Items</Text>
                        <Text style={s.infoValue}>{activeOrder.items} items</Text>
                    </View>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Earnings</Text>
                        <Text style={s.infoValueBold}>฿{activeOrder.price}</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        padding: 20,
        backgroundColor: '#0E3A78',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    content: {
        padding: 16,
    },
    locationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    locationCardDisabled: {
        opacity: 0.5,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    locationTitle: {
        fontSize: 12,
        color: '#666',
        textTransform: 'uppercase',
    },
    locationName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
    },
    arrow: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    actionBtn: {
        backgroundColor: '#0E3A78',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    orderInfo: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        color: '#111',
    },
    infoValueBold: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0E3A78',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    demoBtn: {
        marginTop: 24,
        backgroundColor: '#0E3A78',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    demoBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
