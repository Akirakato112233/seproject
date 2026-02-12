import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders } from '../../context/OrdersContext';
import { useShop } from '../../context/ShopContext';
import { MerchantHeader } from '../../components/MerchantHeader';
import { NewOrderModal, type NewOrderData } from '../../components/NewOrderModal';
import {
  OrderDetailSheet,
  type OrderDetailData,
  type OrderDetailStatus,
} from '../../components/OrderDetailSheet';

type OrderFilter = 'all' | 'in_progress' | 'ready';

const CUSTOMER_NAMES = ['สมชาย ใจดี', 'มานี มีสุข', 'New Customer', 'John Doe', 'Sarah Lee'];
const SERVICE_DETAILS = ['approx. 12-15 lbs of laundry', 'approx. 8-10 lbs', 'approx. 5-7 kg'];
const NOTES = ['แยกผ้าขาว / สี', 'ซักเบา', undefined];
const PAYMENT_METHODS = ['เงินสด', 'โอนเงิน'];

function generateRandomNewOrder(): NewOrderData {
  const id = `ORD-${8000 + Math.floor(Math.random() * 2000)}`;
  const total = Math.floor(100 + Math.random() * 200);
  return {
    id,
    customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    distance: `${Math.floor(1 + Math.random() * 5)} KM`,
    total,
    paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
    serviceType: 'Wash & Fold Service',
    serviceDetail: SERVICE_DETAILS[Math.floor(Math.random() * SERVICE_DETAILS.length)],
    pickupTime: 'Today, 2:00 PM - 4:00 PM',
    note: NOTES[Math.floor(Math.random() * NOTES.length)],
    expiresIn: 180,
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { shop } = useShop();
  const { currentOrders, addOrder, setOrderReady, completeOrder } = useOrders();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [pendingNewOrder, setPendingNewOrder] = useState<NewOrderData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<(typeof currentOrders)[0] | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [hasNewOrderNotification, setHasNewOrderNotification] = useState(true);

  const handleShowNewOrder = () => {
    setPendingNewOrder(generateRandomNewOrder());
    setShowNewOrder(true);
    setHasNewOrderNotification(false);
  };

  const handleAcceptOrder = () => {
    if (pendingNewOrder) {
      addOrder({
        id: pendingNewOrder.id.replace('ORD-', ''),
        customerName: pendingNewOrder.customerName,
        orderId: pendingNewOrder.id,
        serviceType: 'Wash & Fold',
        total: pendingNewOrder.total,
      });
      setPendingNewOrder(null);
    }
    setShowNewOrder(false);
  };

  const handleDeclineOrder = () => {
    setPendingNewOrder(null);
    setShowNewOrder(false);
  };

  const washingCount = currentOrders.filter((o) => o.status === 'washing').length;
  const readyCount = currentOrders.filter((o) => o.status === 'ready').length;

  const filteredOrders =
    filter === 'all'
      ? currentOrders
      : filter === 'in_progress'
        ? currentOrders.filter((o) => o.status === 'washing')
        : currentOrders.filter((o) => o.status === 'ready');

  const searchFiltered = search
    ? filteredOrders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.orderId.toLowerCase().includes(search.toLowerCase())
      )
    : filteredOrders;

  const handleOrderAction = () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === 'washing') {
      setOrderReady(selectedOrder.id);
    } else {
      completeOrder(selectedOrder.id);
      router.push('/(tabs)/history');
    }
    setOrderDetailVisible(false);
    setSelectedOrder(null);
  };

  const openOrderDetail = (order: (typeof currentOrders)[0]) => {
    setSelectedOrder(order);
    setOrderDetailVisible(true);
  };

  const getOrderDetailData = (): OrderDetailData | null => {
    if (!selectedOrder) return null;
    const status: OrderDetailStatus =
      selectedOrder.status === 'washing' ? 'washing' : 'ready_for_delivery';
    return {
      id: selectedOrder.id,
      status,
      total: selectedOrder.total,
      isPaid: selectedOrder.status === 'ready',
      paymentMethod: 'เงินสด',
      customerName: selectedOrder.customerName,
      customerPhone: '086-555-4444',
      orderDate: 'Today, 2:00 PM - 4:00 PM',
      riderName: 'Natthapong Saehaw',
      riderPhone: '093-579-2318',
      services:
        status === 'washing'
          ? [{ name: 'Washing & Folding', qty: '5 kg x ฿40', price: 200 }]
          : undefined,
      note: status === 'washing' ? 'แยกผ้าขาว / สี' : undefined,
    };
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <MerchantHeader shopName={shop?.name ?? 'Loading...'} onWalletPress={() => router.push('/(tabs)/wallet')} />

      {hasNewOrderNotification && (
        <TouchableOpacity
          style={s.newOrderBanner}
          onPress={handleShowNewOrder}
        >
          <Ionicons name="notifications" size={20} color={Colors.white} />
          <Text style={s.newOrderBannerText}>New order - Tap to view</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      )}

      <View style={s.summaryRow}>
        <View style={[s.summaryCard, s.washingCard]}>
          <Text style={s.summaryLabel}>WASHING</Text>
          <Text style={[s.summaryValue, s.washingValue]}>{washingCount}</Text>
        </View>
        <View style={[s.summaryCard, s.readyCard]}>
          <Text style={s.summaryLabel}>READY</Text>
          <Text style={[s.summaryValue, s.readyValue]}>{readyCount}</Text>
        </View>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search customer or order ID"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={s.filterRow}>
        {(
          [
            ['all', 'All Orders'],
            ['in_progress', 'In Progress'],
            ['ready', 'Ready for Pickup'],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.filterBtn, filter === key && s.filterBtnActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.filterText, filter === key && s.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Current Orders</Text>

      <FlatList
        data={searchFiltered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.orderCard}
            onPress={() => openOrderDetail(item)}
            activeOpacity={0.8}
          >
            <View style={s.orderLeft}>
              <View
                style={[
                  s.orderIcon,
                  item.status === 'washing' ? s.orderIconWashing : s.orderIconReady,
                ]}
              >
                <Ionicons
                  name={
                    item.status === 'washing' ? 'shirt-outline' : 'bag-handles-outline'
                  }
                  size={24}
                  color={Colors.white}
                />
              </View>
              <View>
                <Text style={s.customerName}>{item.customerName}</Text>
                <Text style={s.orderMeta}>
                  #{item.orderId.split('-')[1]} • {item.serviceType}
                </Text>
                {item.pickupText && (
                  <View style={s.pickupRow}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.successGreen} />
                    <Text style={s.pickupLabel}>{item.pickupText}</Text>
                  </View>
                )}
                {item.dueText && (
                  <View style={s.dueRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={s.dueText}>{item.dueText}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={s.orderRight}>
              <View
                style={[
                  s.statusBadge,
                  item.status === 'washing' ? s.statusWashing : s.statusReady,
                ]}
              >
                <Text
                  style={[
                    s.statusText,
                    item.status === 'washing'
                      ? s.statusTextWashing
                      : s.statusTextReady,
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Text style={s.orderPrice}>{item.total.toFixed(2)}฿</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <NewOrderModal
        visible={showNewOrder}
        order={pendingNewOrder}
        onAccept={handleAcceptOrder}
        onDecline={handleDeclineOrder}
      />

      <OrderDetailSheet
        visible={orderDetailVisible}
        order={getOrderDetailData()}
        onClose={() => setOrderDetailVisible(false)}
        onAction={handleOrderAction}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  newOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBlue,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  newOrderBannerText: {
    flex: 1,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  washingCard: { backgroundColor: '#e0f2fe' },
  readyCard: { backgroundColor: '#dcfce7' },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  washingValue: { color: Colors.primaryBlue },
  readyValue: { color: Colors.successGreen },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
  },
  filterBtnActive: { backgroundColor: Colors.primaryBlue },
  filterText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIconWashing: { backgroundColor: Colors.primaryBlue },
  orderIconReady: { backgroundColor: Colors.successGreen },
  customerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  orderMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  pickupRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pickupLabel: { fontSize: 13, color: Colors.successGreen, fontWeight: '500' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dueText: { fontSize: 13, color: Colors.textSecondary },
  orderRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusWashing: { backgroundColor: '#dbeafe' },
  statusReady: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextWashing: { color: Colors.primaryBlue },
  statusTextReady: { color: Colors.successGreen },
  orderPrice: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
});
