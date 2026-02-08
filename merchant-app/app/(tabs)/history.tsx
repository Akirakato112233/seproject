import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders } from '../../context/OrdersContext';
import { MerchantHeader } from '../../components/MerchantHeader';

const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

export default function HistoryScreen() {
  const [selectedDate] = useState(new Date());
  const { completedOrders } = useOrders();

  const stats = useMemo(() => {
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      totalRevenue,
      completedCount: completedOrders.length,
    };
  }, [completedOrders]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <MerchantHeader shopName="ร้านasukhai" />

      <View style={s.content}>
        <Text style={s.title}>History</Text>

        <TouchableOpacity style={s.dateSelector}>
          <Text style={s.dateLabel}>Select Date</Text>
          <View style={s.dateRow}>
            <Text style={s.dateValue}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <View style={s.revenueCard}>
          <Text style={s.revenueAmount}>{stats.totalRevenue.toFixed(2)}฿</Text>
          <Text style={s.revenueLabel}>Total Revenue</Text>
          <Text style={s.revenueSubtext}>
            Gross sales before deductions and adjustments.
          </Text>
        </View>

        <View style={s.metricsRow}>
          <View style={s.metricCard}>
            <Text style={s.metricValue}>{stats.completedCount}</Text>
            <Text style={s.metricLabel}>Completed Orders</Text>
          </View>
          <View style={s.metricDivider} />
          <View style={s.metricCard}>
            <Text style={s.metricValue}>0</Text>
            <Text style={s.metricLabel}>Cancelled Orders</Text>
          </View>
        </View>

        <Text style={s.listTitle}>Completed Orders</Text>
        <FlatList
          data={completedOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.orderCard}>
              <View style={s.orderLeft}>
                <View style={s.orderIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.successGreen} />
                </View>
                <View>
                  <Text style={s.customerName}>{item.customerName}</Text>
                  <Text style={s.orderMeta}>
                    #{item.orderId.split('-')[1]} • {item.serviceType}
                  </Text>
                </View>
              </View>
              <Text style={s.orderPrice}>{item.total.toFixed(2)}฿</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  content: { flex: 1, padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  dateSelector: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  revenueCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primaryBlue,
    marginBottom: 4,
  },
  revenueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricCard: { flex: 1, alignItems: 'center' },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  list: { paddingBottom: 40 },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  orderMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  orderPrice: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
});
