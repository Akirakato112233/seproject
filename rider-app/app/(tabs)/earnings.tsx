import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock earnings data
const MOCK_EARNINGS = [
    { id: '1', date: 'Today', orders: 5, amount: 750 },
    { id: '2', date: 'Yesterday', orders: 7, amount: 1050 },
    { id: '3', date: 'Feb 3', orders: 4, amount: 600 },
    { id: '4', date: 'Feb 2', orders: 6, amount: 900 },
    { id: '5', date: 'Feb 1', orders: 8, amount: 1200 },
];

const TOTAL_EARNINGS = MOCK_EARNINGS.reduce((sum, e) => sum + e.amount, 0);
const TOTAL_ORDERS = MOCK_EARNINGS.reduce((sum, e) => sum + e.orders, 0);

export default function EarningsScreen() {
    const renderEarningItem = ({ item }: { item: typeof MOCK_EARNINGS[0] }) => (
        <View style={s.card}>
            <View style={s.cardLeft}>
                <Text style={s.date}>{item.date}</Text>
                <Text style={s.orders}>{item.orders} deliveries</Text>
            </View>
            <Text style={s.amount}>฿{item.amount}</Text>
        </View>
    );

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Text style={s.title}>Earnings</Text>
            </View>

            {/* Summary */}
            <View style={s.summary}>
                <View style={s.summaryItem}>
                    <Ionicons name="wallet-outline" size={24} color="#0E3A78" />
                    <Text style={s.summaryValue}>฿{TOTAL_EARNINGS}</Text>
                    <Text style={s.summaryLabel}>Total Earnings</Text>
                </View>
                <View style={s.divider} />
                <View style={s.summaryItem}>
                    <Ionicons name="bicycle-outline" size={24} color="#0E3A78" />
                    <Text style={s.summaryValue}>{TOTAL_ORDERS}</Text>
                    <Text style={s.summaryLabel}>Total Orders</Text>
                </View>
            </View>

            {/* History */}
            <View style={s.historyHeader}>
                <Text style={s.historyTitle}>Earning History</Text>
            </View>

            <FlatList
                data={MOCK_EARNINGS}
                keyExtractor={(item) => item.id}
                renderItem={renderEarningItem}
                contentContainerStyle={s.list}
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
    summary: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
    },
    divider: {
        width: 1,
        backgroundColor: '#eee',
        marginHorizontal: 16,
    },
    historyHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    list: {
        paddingHorizontal: 16,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    cardLeft: {
        gap: 4,
    },
    date: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },
    orders: {
        fontSize: 13,
        color: '#666',
    },
    amount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0E3A78',
    },
});
