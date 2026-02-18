import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { API } from '../../config';
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

interface ApiPendingOrder {
  id: string;
  orderId: string;
  customerName: string;
  userAddress: string;
  total: number;
  paymentMethod: string;
  serviceType: string;
  serviceDetail: string;
  items: { name: string; details: string; price: number }[];
  createdAt: string;
}

function formatPickupTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const h = d.getHours();
    const m = d.getMinutes();
    const endH = (h + 2) % 24;
    const fmt = (h: number) => {
      const h12 = h % 12 || 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    return isToday
      ? `Today, ${fmt(h)} - ${fmt(endH)}`
      : `${d.toLocaleDateString()}, ${fmt(h)} - ${fmt(endH)}`;
  } catch {
    return 'Today, 2:00 PM - 4:00 PM';
  }
}

function apiOrderToNewOrderData(order: ApiPendingOrder): NewOrderData {
  return {
    id: order.orderId || order.id,
    customerName: order.customerName || 'Customer',
    distance: '4 KM',
    total: order.total || 0,
    paymentMethod: order.paymentMethod || 'เงินสด',
    serviceType: order.serviceType || 'Wash & Fold Service',
    serviceDetail: order.serviceDetail || 'approx. 5-7 kg',
    pickupTime: formatPickupTime(order.createdAt),
    note: order.items?.[0]?.details || undefined,
    expiresIn: 180,
    _rawId: order.id,
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { shop } = useShop();
  const { currentOrders, setOrderReady, completeOrder, refreshCurrentOrders } = useOrders();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [pendingNewOrder, setPendingNewOrder] = useState<NewOrderData | null>(null);
  const [pendingOrderIndex, setPendingOrderIndex] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<(typeof currentOrders)[0] | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<ApiPendingOrder[]>([]);

  const fetchPendingOrders = useCallback(async () => {
    if (!shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_PENDING(shop._id));
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setPendingOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  }, [shop?._id]);

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingOrders]);

  const handleShowNewOrder = () => {
    const first = pendingOrders[0];
    if (first) {
      setPendingNewOrder(apiOrderToNewOrderData(first));
      setPendingOrderIndex(0);
      setShowNewOrder(true);
    }
  };

  const pendingOrdersAsNewOrderData = pendingOrders.map(apiOrderToNewOrderData);

  const handlePrevOrder = () => {
    if (pendingOrderIndex > 0) {
      const nextIdx = pendingOrderIndex - 1;
      setPendingOrderIndex(nextIdx);
      setPendingNewOrder(pendingOrdersAsNewOrderData[nextIdx]);
    }
  };

  const handleNextOrder = () => {
    if (pendingOrderIndex < pendingOrders.length - 1) {
      const nextIdx = pendingOrderIndex + 1;
      setPendingOrderIndex(nextIdx);
      setPendingNewOrder(pendingOrdersAsNewOrderData[nextIdx]);
    }
  };

  const handleAcceptOrder = async () => {
    if (!pendingNewOrder) {
      setShowNewOrder(false);
      return;
    }
    const orderId = pendingNewOrder._rawId || pendingNewOrder.id;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_ACCEPT(orderId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: shop?._id }),
      });
      if (res.ok) {
        await refreshCurrentOrders();
        await fetchPendingOrders();
      }
    } catch (err) {
      console.error('Error accepting order:', err);
    }
    setPendingNewOrder(null);
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

  const handleOrderAction = async () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === 'washing') {
      await setOrderReady(selectedOrder.id);
    } else {
      await completeOrder(selectedOrder.id);
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
      selectedOrder.status === 'washing'
        ? 'washing'
        : selectedOrder.statusRaw === 'in_progress'
          ? 'in_progress'
          : 'ready_for_delivery';
    const displayId = selectedOrder.orderId?.replace('ORD-', '') || selectedOrder.id.slice(-4);
    return {
      id: displayId,
      status,
      total: selectedOrder.total,
      isPaid: selectedOrder.status === 'ready',
      paymentMethod: selectedOrder.paymentMethod || 'เงินสด',
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

      {pendingOrders.length > 0 && (
        <TouchableOpacity
          style={s.newOrderBanner}
          onPress={handleShowNewOrder}
        >
          <Ionicons name="notifications" size={20} color={Colors.white} />
          <Text style={s.newOrderBannerText}>
            {pendingOrders.length === 1
              ? 'New order - Tap to view'
              : `New orders (${pendingOrders.length}) - Tap to view`}
          </Text>
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
        orders={pendingOrdersAsNewOrderData}
        currentIndex={pendingOrderIndex}
        onAccept={handleAcceptOrder}
        onDecline={handleDeclineOrder}
        onPrev={handlePrevOrder}
        onNext={handleNextOrder}
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
