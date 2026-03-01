import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { API, NGROK_HEADERS } from '../../config';
import { useOrders } from '../../context/OrdersContext';
import { useShop } from '../../context/ShopContext';
import { MerchantHeader } from '../../components/MerchantHeader';
import { NewOrderModal, type NewOrderData } from '../../components/NewOrderModal';
import {
  OrderDetailSheet,
  type OrderDetailData,
  type OrderDetailStatus,
} from '../../components/OrderDetailSheet';

type OrderFilter = 'all' | 'neworder' | 'looking_for_rider' | 'in_progress' | 'ready' | 'completed';

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

function apiOrderToNewOrderData(order: ApiPendingOrder & { userDisplayName?: string }): NewOrderData {
  const createdAt = order.createdAt;
  const createdStr = typeof createdAt === 'string' ? createdAt : createdAt ? new Date(createdAt as Date).toISOString() : '';
  return {
    id: order.orderId || String(order.id || '').slice(-4) || '?',
    customerName: order.customerName || order.userDisplayName || 'Customer',
    distance: '4 KM',
    total: Number(order.total) || 0,
    paymentMethod: order.paymentMethod || 'เงินสด',
    serviceType: order.serviceType || 'Wash & Fold Service',
    serviceDetail: order.serviceDetail || 'approx. 5-7 kg',
    pickupTime: formatPickupTime(createdStr),
    note: order.items?.[0]?.details || undefined,
    expiresIn: 180,
    _rawId: order.id,
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { shop, refreshShop } = useShop();
  const { currentOrders, completedOrders, setRiderArrived, setOrderReady, completeOrder, refreshCurrentOrders } = useOrders();

  useEffect(() => {
    refreshShop();
  }, [refreshShop]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [pendingNewOrder, setPendingNewOrder] = useState<NewOrderData | null>(null);
  const [pendingOrderIndex, setPendingOrderIndex] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<(typeof currentOrders)[0] | null>(null);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<ApiPendingOrder | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<ApiPendingOrder[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const prevPendingCountRef = useRef(0);

  const fetchPendingOrders = useCallback(async () => {
    if (!shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_PENDING(shop._id), { headers: NGROK_HEADERS });
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

  // Auto-show pop-up ทันทีเมื่อมี order ใหม่เข้ามา
  useEffect(() => {
    const n = pendingOrders.length;
    if (n > prevPendingCountRef.current) {
      const first = pendingOrders[0];
      if (first) {
        setPendingNewOrder(apiOrderToNewOrderData(first));
        setPendingOrderIndex(0);
        setShowNewOrder(true);
      }
    }
    prevPendingCountRef.current = n;
  }, [pendingOrders]);

  const handleShowNewOrder = (index?: number) => {
    const idx = index ?? 0;
    const order = pendingOrders[idx];
    if (order) {
      setPendingNewOrder(apiOrderToNewOrderData(order));
      setPendingOrderIndex(idx);
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
      console.log('[Merchant Accept Modal] ไม่มี pendingNewOrder');
      setShowNewOrder(false);
      return;
    }
    const orderId = pendingNewOrder._rawId ?? pendingNewOrder.id;
    const shopId = shop?._id;
    const url = API.ORDERS_MERCHANT_ACCEPT(orderId);
    console.log('[Merchant Accept Modal] เริ่มต้น', { orderId, shopId, url });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });
      const data = await res.json().catch(() => ({}));
      console.log('[Merchant Accept Modal] Response', { status: res.status, ok: res.ok, data });
      if (res.ok) {
        await refreshCurrentOrders();
        await fetchPendingOrders();
        setFilter('all');
      } else {
        console.warn('[Merchant Accept Modal] ล้มเหลว', data.message || data);
      }
    } catch (err) {
      console.error('[Merchant Accept Modal] Error:', err);
    }
    setPendingNewOrder(null);
    setShowNewOrder(false);
  };

  const handleDeclineOrder = () => {
    setPendingNewOrder(null);
    setShowNewOrder(false);
  };

  const isDelivering = (sr: string | undefined) => sr === 'Delivering' || sr === 'deliverying';
  const newOrderCount = pendingOrders.length;
  const inProgressCount = currentOrders.filter((o) => o.status === 'washing').length;
  const readyCount = currentOrders.filter((o) => o.status === 'ready' && !isDelivering(o.statusRaw)).length;
  const completedCount = completedOrders.length;

  const filteredOrders =
    filter === 'neworder'
      ? []
      : filter === 'completed'
        ? []
        : filter === 'all'
          ? currentOrders
          : filter === 'looking_for_rider'
            ? currentOrders.filter((o) => o.status === 'wait_for_rider' && o.pickupText === 'Looking for rider')
            : filter === 'in_progress'
              ? currentOrders.filter((o) => o.status === 'washing')
              : filter === 'ready'
                ? currentOrders.filter((o) => o.status === 'ready' && !isDelivering(o.statusRaw))
                : currentOrders;

  const listData =
    filter === 'neworder'
      ? pendingOrders.map((o) => ({
          id: o.id,
          customerName: o.customerName || 'Customer',
          orderId: o.orderId || `ORD-${o.id.slice(-4)}`,
          serviceType: o.serviceType || 'Wash & Fold',
          total: o.total || 0,
          status: 'new_order' as const,
          statusRaw: 'decision' as const,
          pickupText: undefined as string | undefined,
          dueText: undefined as string | undefined,
        }))
      : filter === 'completed'
        ? completedOrders.map((o) => ({
            id: o.id,
            customerName: o.customerName,
            orderId: o.orderId,
            serviceType: o.serviceType,
            total: o.total,
            status: 'completed' as const,
            statusRaw: 'completed' as const,
            pickupText: undefined as string | undefined,
            dueText: o.completedAt ? `Completed ${o.completedAt.toLocaleDateString()}` : undefined,
          }))
        : filteredOrders;

  const searchFiltered = search
    ? listData.filter(
        (o) =>
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.orderId.toLowerCase().includes(search.toLowerCase())
      )
    : listData;

  const handleOrderAction = async () => {
    console.log('[Merchant Accept] handleOrderAction ถูกเรียก', { hasSelectedPending: !!selectedPendingOrder, hasSelectedOrder: !!selectedOrder });
    // New order Accept
    if (selectedPendingOrder) {
      const orderId = selectedPendingOrder.id;
      const shopId = shop?._id;
      if (!shopId) {
        Alert.alert('Error', 'ไม่พบข้อมูลร้าน กรุณารอโหลดหรือรีเฟรช');
        return;
      }
      const url = API.ORDERS_MERCHANT_ACCEPT(orderId);
      console.log('[Merchant Accept] เริ่มต้น', { orderId, shopId, url });
      setIsAccepting(true);
      try {
        const body = JSON.stringify({ shopId });
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        const data = await res.json().catch(() => ({}));
        console.log('[Merchant Accept] Response', { status: res.status, ok: res.ok, data });
        if (res.ok) {
          await refreshCurrentOrders();
          await fetchPendingOrders();
          setFilter('all');
          setSelectedPendingOrder(null);
          setOrderDetailVisible(false);
        } else {
          Alert.alert('Accept ล้มเหลว', data.message || String(data) || `Status ${res.status}`);
        }
      } catch (err) {
        console.error('[Merchant Accept] Error:', err);
        Alert.alert('Error', String(err));
      } finally {
        setIsAccepting(false);
      }
      return;
    }
    if (!selectedOrder) return;
    if (selectedOrder.status === 'wait_for_rider') {
      await setRiderArrived(selectedOrder.id);
    } else if (selectedOrder.status === 'washing') {
      await setOrderReady(selectedOrder.id);
    } else if (selectedOrder.status === 'ready' && selectedOrder.statusRaw === 'in_progress') {
      await completeOrder(selectedOrder.id);
      router.push('/(tabs)/history');
    }
    setOrderDetailVisible(false);
    setSelectedOrder(null);
  };

  const handleNewOrderDecline = () => {
    setSelectedPendingOrder(null);
    setOrderDetailVisible(false);
  };

  const closeOrderDetail = () => {
    setOrderDetailVisible(false);
    setSelectedOrder(null);
    setSelectedPendingOrder(null);
  };

  const openOrderDetail = (order: (typeof currentOrders)[0] | { id: string; customerName: string; orderId: string; serviceType: string; total: number; status: string }) => {
    setSelectedPendingOrder(null);
    setSelectedOrder(order as (typeof currentOrders)[0]);
    setOrderDetailVisible(true);
  };

  const handleNewOrderCardPress = (orderId: string) => {
    const order = pendingOrders.find((o) => o.id === orderId);
    if (order) {
      setSelectedPendingOrder(order);
      setSelectedOrder(null);
      setOrderDetailVisible(true);
    }
  };

  const getOrderDetailData = (): OrderDetailData | null => {
    // New order (จาก pending) - แสดงแบบรูป 3
    if (selectedPendingOrder) {
      const o = selectedPendingOrder;
      const firstItem = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null;
      const services = (o.items || []).map((it) => ({
        name: it.name,
        qty: it.details || '-',
        price: it.price,
      }));
      return {
        id: o.orderId?.replace('ORD-', '') || String(o.id).slice(-4),
        status: 'new_order',
        isNewOrder: true,
        total: o.total || 0,
        isPaid: false,
        paymentMethod: o.paymentMethod || 'Cash',
        customerName: o.customerName || 'Customer',
        customerPhone: '086-555-4444',
        orderDate: o.createdAt ? formatPickupTime(typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt).toISOString()) : 'Today, 2:00 PM - 4:00 PM',
        services: services.length > 0 ? services : [{ name: o.serviceType || 'Wash & Fold', qty: o.serviceDetail || '-', price: 0 }],
        note: firstItem?.details || undefined,
        showAction: true,
        actionLabel: 'Accept',
      };
    }
    if (!selectedOrder) return null;
    if ((selectedOrder as { status?: string }).status === 'completed') {
      const items = selectedOrder.items || [];
      const services = items.length > 0
        ? items.map((it) => ({ name: it.name, qty: it.details || '-', price: it.price }))
        : [{ name: selectedOrder.serviceType || 'Wash & Fold', qty: '-', price: 0 }];
      return {
        id: (selectedOrder.orderId || '').replace('ORD-', '') || selectedOrder.id.slice(-4),
        status: 'completed',
        total: selectedOrder.total,
        isPaid: true,
        paymentMethod: selectedOrder.paymentMethod || 'Cash',
        customerName: selectedOrder.customerName,
        customerPhone: '086-555-4444',
        orderDate: 'Completed',
        showAction: false,
        services,
        note: items[0]?.details || undefined,
      };
    }
    const status: OrderDetailStatus =
      selectedOrder.status === 'wait_for_rider'
        ? 'wait_for_rider'
        : selectedOrder.status === 'washing'
          ? 'washing'
          : selectedOrder.statusRaw === 'in_progress'
            ? 'in_progress'
            : 'ready_for_delivery';
    const displayId = selectedOrder.orderId?.replace('ORD-', '') || selectedOrder.id.slice(-4);
    const showAction =
      selectedOrder.status === 'wait_for_rider' ||
      selectedOrder.status === 'washing' ||
      (selectedOrder.status === 'ready' && selectedOrder.statusRaw === 'in_progress');
    const actionLabel =
      selectedOrder.status === 'wait_for_rider'
        ? 'Rider arrived'
        : selectedOrder.status === 'washing'
          ? 'Ready for pickup'
          : selectedOrder.status === 'ready' && selectedOrder.statusRaw === 'in_progress'
            ? 'Rider picked up'
            : '';
    const items = selectedOrder.items || [];
    const services = items.length > 0
      ? items.map((it) => ({
          name: it.name,
          qty: it.details || '-',
          price: it.price,
        }))
      : [{ name: selectedOrder.serviceType || 'Wash & Fold', qty: '-', price: 0 }];
    const firstItem = items[0];
    const note = firstItem?.details || undefined;

    return {
      id: displayId,
      status,
      statusLabel: selectedOrder.status === 'wait_for_rider' ? selectedOrder.pickupText : undefined,
      total: selectedOrder.total,
      isPaid: selectedOrder.status === 'ready',
      paymentMethod: selectedOrder.paymentMethod || 'Cash',
      customerName: selectedOrder.customerName,
      customerPhone: '086-555-4444',
      orderDate: 'Today, 2:00 PM - 4:00 PM',
      riderName: 'Natthapong Saehaw',
      riderPhone: '093-579-2318',
      services,
      note,
      showAction,
      actionLabel,
    };
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <MerchantHeader shopName={shop?.name ?? 'Loading...'} />

      <TouchableOpacity
        style={s.balanceCard}
        onPress={() => router.push('/(tabs)/wallet')}
        activeOpacity={0.9}
      >
        <View style={s.balanceRow}>
          <Ionicons name="wallet-outline" size={22} color={Colors.primaryBlue} />
          <Text style={s.balanceLabel}>Balance in wallet</Text>
        </View>
        <Text style={s.balanceAmount}>฿{(shop?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </TouchableOpacity>

      <View style={s.summaryRow}>
        <View style={[s.summaryCard, s.newOrderCard]}>
          <Text style={[s.summaryLabel, s.newOrderValue]}>New order</Text>
          <Text style={[s.summaryValue, s.newOrderValue]}>{newOrderCount}</Text>
        </View>
        <View style={[s.summaryCard, s.washingCard]}>
          <Text style={[s.summaryLabel, s.washingValue]}>In progress</Text>
          <Text style={[s.summaryValue, s.washingValue]}>{inProgressCount}</Text>
        </View>
        <View style={[s.summaryCard, s.readyCard]}>
          <Text style={[s.summaryLabel, s.readyValue]}>Ready for pickup</Text>
          <Text style={[s.summaryValue, s.readyValue]}>{readyCount}</Text>
        </View>
        <View style={[s.summaryCard, s.completedCard]}>
          <Text style={[s.summaryLabel, s.completedValue]}>Complete</Text>
          <Text style={[s.summaryValue, s.completedValue]}>{completedCount}</Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterScroll}
      >
        {[
          ['all', 'All'],
          ['neworder', 'New order'],
          ['looking_for_rider', 'Looking for rider'],
          ['in_progress', 'In progress'],
          ['ready', 'Ready for pickup'],
          ['completed', 'Completed'],
        ].map(([key, label]) => (
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
      </ScrollView>

      <Text style={s.sectionTitle}>
        {filter === 'neworder' ? 'New Orders' : filter === 'completed' ? 'Completed Orders' : 'Current Orders'}
      </Text>

      <FlatList
        data={searchFiltered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.orderCard}
            onPress={() =>
              filter === 'neworder'
                ? handleNewOrderCardPress(item.id)
                : openOrderDetail(item)
            }
            activeOpacity={0.8}
          >
            <View style={s.orderLeft}>
              <View
                style={[
                  s.orderIcon,
                  item.status === 'new_order'
                    ? s.orderIconNew
                    : item.status === 'completed'
                      ? s.orderIconCompleted
                      : item.status === 'wait_for_rider'
                        ? s.orderIconWait
                        : item.status === 'washing'
                          ? s.orderIconWashing
                          : isDelivering(item.statusRaw)
                            ? s.orderIconDelivering
                            : s.orderIconReady,
                ]}
              >
                <Ionicons
                  name={
                    item.status === 'new_order'
                      ? 'notifications-outline'
                      : item.status === 'completed'
                        ? 'checkmark-done-outline'
                        : item.status === 'wait_for_rider'
                          ? 'bicycle-outline'
                          : item.status === 'washing'
                            ? 'shirt-outline'
                            : isDelivering(item.statusRaw)
                              ? 'car-outline'
                              : 'bag-handles-outline'
                  }
                  size={24}
                  color={Colors.white}
                />
              </View>
              <View style={s.orderLeftContent}>
                <Text style={s.customerName}>{item.customerName}</Text>
                <Text style={s.orderMeta}>
                  {item.serviceType}
                </Text>
              </View>
            </View>
            <View style={s.orderRight}>
              <View
                style={[
                  s.statusBadge,
                  item.status === 'new_order'
                    ? s.statusNew
                    : item.status === 'completed'
                      ? s.statusCompleted
                      : item.status === 'wait_for_rider'
                        ? s.statusWait
                        : item.status === 'washing'
                          ? s.statusWashing
                          : isDelivering(item.statusRaw)
                            ? s.statusDelivering
                            : s.statusReady,
                ]}
              >
                <Text
                  style={[
                    s.statusText,
                    item.status === 'new_order'
                      ? s.statusTextNew
                      : item.status === 'completed'
                        ? s.statusTextCompleted
                        : item.status === 'wait_for_rider'
                          ? s.statusTextWait
                          : item.status === 'washing'
                            ? s.statusTextWashing
                            : isDelivering(item.statusRaw)
                              ? s.statusTextDelivering
                              : s.statusTextReady,
                  ]}
                >
                  {item.status === 'new_order'
                    ? 'New order'
                    : item.status === 'completed'
                      ? 'Completed'
                      : item.status === 'wait_for_rider'
                        ? (item.pickupText || 'Waiting for rider')
                        : item.status === 'washing'
                          ? 'In progress'
                          : isDelivering(item.statusRaw)
                            ? 'Delivering'
                            : 'Ready for pickup'}
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
        onClose={closeOrderDetail}
        onAction={handleOrderAction}
        onDecline={selectedPendingOrder ? handleNewOrderDecline : undefined}
        actionLoading={isAccepting}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.successGreen,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryCard: {
    minWidth: 90,
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  newOrderCard: { backgroundColor: '#B3E5FC' },
  waitCard: { backgroundColor: '#FFE0B2' },
  waitingCard: { backgroundColor: '#FFCC80' },
  washingCard: { backgroundColor: '#BBDEFB' },
  readyCard: { backgroundColor: '#C8E6C9' },
  deliveringCard: { backgroundColor: '#E1BEE7' },
  completedCard: { backgroundColor: '#B2DFDB' },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  newOrderValue: { color: '#0277BD' },
  waitValue: { color: '#EF6C00' },
  waitingValue: { color: '#E65100' },
  washingValue: { color: '#1565C0' },
  readyValue: { color: '#2E7D32' },
  deliveringValue: { color: '#6A1B9A' },
  completedValue: { color: '#00695C' },
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
  filterScroll: { marginBottom: 16, minHeight: 48, overflow: 'visible' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingRight: 32,
    gap: 8,
    alignItems: 'center',
  },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    flexShrink: 0,
    minHeight: 40,
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
  orderLeft: { flexDirection: 'row', gap: 12, flex: 1, minWidth: 0 },
  orderLeftContent: { flex: 1, minWidth: 0 },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIconNew: { backgroundColor: '#0277BD' },
  orderIconCompleted: { backgroundColor: '#00695C' },
  orderIconWait: { backgroundColor: '#EF6C00' },
  orderIconWashing: { backgroundColor: '#1565C0' },
  orderIconReady: { backgroundColor: '#2E7D32' },
  orderIconDelivering: { backgroundColor: '#6A1B9A' },
  customerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  orderMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  pickupRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pickupLabel: { fontSize: 13, color: Colors.successGreen, fontWeight: '500' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dueText: { fontSize: 13, color: Colors.textSecondary },
  orderRight: { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusNew: { backgroundColor: '#B3E5FC' },
  statusCompleted: { backgroundColor: '#B2DFDB' },
  statusWait: { backgroundColor: '#FFE0B2' },
  statusWashing: { backgroundColor: '#BBDEFB' },
  statusReady: { backgroundColor: '#C8E6C9' },
  statusDelivering: { backgroundColor: '#E1BEE7' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextNew: { color: '#0277BD' },
  statusTextCompleted: { color: '#00695C' },
  statusTextWait: { color: '#EF6C00' },
  statusTextWashing: { color: '#1565C0' },
  statusTextReady: { color: '#2E7D32' },
  statusTextDelivering: { color: '#6A1B9A' },
  orderPrice: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
});
