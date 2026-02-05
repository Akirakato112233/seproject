import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for available orders
const MOCK_ORDERS = [
  {
    id: '1',
    shopName: 'WashPro Laundry',
    customerName: 'John Doe',
    address: '123 Main St, Bangkok',
    distance: '2.5 km',
    price: 150,
    items: 3,
  },
  {
    id: '2',
    shopName: 'Clean Express',
    customerName: 'Jane Smith',
    address: '456 Oak Ave, Bangkok',
    distance: '3.2 km',
    price: 200,
    items: 5,
  },
  {
    id: '3',
    shopName: 'Fresh & Clean',
    customerName: 'Mike Johnson',
    address: '789 Pine Rd, Bangkok',
    distance: '1.8 km',
    price: 120,
    items: 2,
  },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [orders] = useState(MOCK_ORDERS);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAcceptOrder = (orderId: string) => {
    console.log('Accept order:', orderId);
    // TODO: Implement accept order API
  };

  const renderOrderItem = ({ item }: { item: typeof MOCK_ORDERS[0] }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.shopName}>{item.shopName}</Text>
        <Text style={s.price}>฿{item.price}</Text>
      </View>

      <View style={s.cardBody}>
        <View style={s.row}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={s.text}>{item.customerName}</Text>
        </View>
        <View style={s.row}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={s.text}>{item.address}</Text>
        </View>
        <View style={s.row}>
          <Ionicons name="navigate-outline" size={16} color="#666" />
          <Text style={s.text}>{item.distance}</Text>
        </View>
        <View style={s.row}>
          <Ionicons name="bag-outline" size={16} color="#666" />
          <Text style={s.text}>{item.items} items</Text>
        </View>
      </View>

      <TouchableOpacity
        style={s.acceptBtn}
        onPress={() => handleAcceptOrder(item.id)}
      >
        <Text style={s.acceptBtnText}>Accept Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Available Orders</Text>
        <Text style={s.subtitle}>{orders.length} orders nearby</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={s.emptyText}>No orders available</Text>
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
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E3A78',
  },
  cardBody: {
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
  acceptBtn: {
    backgroundColor: '#0E3A78',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});