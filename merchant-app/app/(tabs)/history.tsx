import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { MerchantHeader } from '../../components/MerchantHeader';
import { useOrders } from '../../context/OrdersContext';
import { useShop } from '../../context/ShopContext';
import type { MerchantOrder } from '../../context/OrdersContext';

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getYearShort(date: Date): string {
  return String(date.getFullYear()).slice(-2);
}

function getOrderDate(order: MerchantOrder): Date {
  return order.completedAt ? new Date(order.completedAt) : new Date();
}

export default function HistoryScreen() {
  const router = useRouter();
  const { shop, refreshShop } = useShop();
  const { completedOrders, refreshCompletedOrders } = useOrders();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { totalRevenue, groupedByDate } = useMemo(() => {
    const filtered = completedOrders.filter((o) => {
      const d = getOrderDate(o);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const total = filtered.reduce((sum, o) => sum + o.total, 0);
    const byDate = filtered.reduce<Record<string, MerchantOrder[]>>((acc, o) => {
      const d = getOrderDate(o);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(o);
      return acc;
    }, {});
    const sortedKeys = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    return {
      totalRevenue: total,
      groupedByDate: sortedKeys.map((key) => ({ key, orders: byDate[key] })),
    };
  }, [completedOrders, selectedMonth, selectedYear]);

  const monthLabel = `${EN_MONTHS[selectedMonth]} ${getYearShort(new Date(selectedYear, selectedMonth))}`;

  const goPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    const now = new Date();
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const canGoNext =
    selectedYear < new Date().getFullYear() ||
    (selectedYear === new Date().getFullYear() && selectedMonth < new Date().getMonth());

  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MerchantOrder | null>(null);

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshShop(), refreshCompletedOrders()]);
    setRefreshing(false);
  }, [refreshShop, refreshCompletedOrders]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <MerchantHeader
        shopName={shop?.name ?? 'Loading...'}
        onWalletPress={() => router.push('/(tabs)/wallet')}
      />

      <View style={s.content}>
        <Text style={s.title}>History</Text>

        {/* Summary: เดือน/ปี + Total Revenue + เชือรอน */}
        <TouchableOpacity
          style={s.summaryCard}
          onPress={goPrevMonth}
          activeOpacity={0.8}
        >
          <View style={s.summaryTop}>
            <Text style={s.summaryMonth}>{monthLabel}</Text>
            <View style={s.summaryChevronRow}>
              <TouchableOpacity
                onPress={goPrevMonth}
                hitSlop={12}
                style={s.chevronBtn}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goNextMonth}
                hitSlop={12}
                style={s.chevronBtn}
                disabled={!canGoNext}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={canGoNext ? Colors.textSecondary : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={s.totalRevenue}>{totalRevenue.toFixed(2)} ฿</Text>
          <Text style={s.totalRevenueLabel}>Total Revenue</Text>
        </TouchableOpacity>

        {/* รายการแยกตามวันที่ */}
        <FlatList
          data={groupedByDate}
          keyExtractor={(item) => item.key}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const [y, m, day] = item.key.split('-').map(Number);
            const d = new Date(y, m, day);
            const dateLabel = `${day} ${EN_MONTHS_SHORT[m]} ${getYearShort(d)}`;
            return (
              <View style={s.dateGroup}>
                <Text style={s.dateHeading}>{dateLabel}</Text>
                {item.orders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={s.entryCard}
                    onPress={() => setSelectedOrder(order)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.entryName}>{order.customerName}</Text>
                    <View style={s.amountBox}>
                      <Text style={s.entryAmount}>+ {order.total.toFixed(0)} Baht</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>No transactions this month</Text>
            </View>
          }
        />

        {/* Modal รายละเอียดออเดอร์ */}
        <Modal visible={!!selectedOrder} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setSelectedOrder(null)}>
            <View style={s.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={s.detailCard}>
                  <View style={s.detailHeader}>
                    <Text style={s.detailTitle}>Order Details</Text>
                    <TouchableOpacity onPress={() => setSelectedOrder(null)} hitSlop={12}>
                      <Ionicons name="close" size={24} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {selectedOrder && (
                    <ScrollView style={s.detailScroll} showsVerticalScrollIndicator={false}>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Order ID</Text>
                        <Text style={s.detailValue}>{selectedOrder.orderId}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Customer</Text>
                        <Text style={s.detailValue}>{selectedOrder.customerName}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Service</Text>
                        <Text style={s.detailValue}>{selectedOrder.serviceType}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Total</Text>
                        <Text style={s.detailValueAmount}>{selectedOrder.total.toFixed(2)} ฿</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Payment</Text>
                        <Text style={s.detailValue}>{selectedOrder.paymentMethod ?? '-'}</Text>
                      </View>
                      {selectedOrder.completedAt && (
                        <View style={s.detailRow}>
                          <Text style={s.detailLabel}>Completed at</Text>
                          <Text style={s.detailValue}>
                            {getOrderDate(selectedOrder).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primaryBlue,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryChevronRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevronBtn: { padding: 4 },
  totalRevenue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryBlue,
    marginBottom: 4,
  },
  totalRevenueLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  list: { paddingBottom: 40 },
  dateGroup: { marginBottom: 20 },
  dateHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primaryBlue,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  amountBox: {
    borderWidth: 1,
    borderColor: Colors.primaryBlue,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  detailCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  detailTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  detailScroll: { maxHeight: 320 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBg,
  },
  detailLabel: { fontSize: 14, color: Colors.textMuted },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  detailValueAmount: { fontSize: 16, fontWeight: '700', color: Colors.primaryBlue },
});
