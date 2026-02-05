import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data
const STATS = {
  todayOrders: 12,
  todayRevenue: 3600,
  pendingOrders: 3,
  completedToday: 9,
};

export default function DashboardScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <View style={s.header}>
          <Text style={s.greeting}>Welcome back,</Text>
          <Text style={s.shopName}>WashPro Laundry</Text>
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, s.statCardBlue]}>
            <Ionicons name="receipt-outline" size={24} color="#fff" />
            <Text style={s.statValue}>{STATS.todayOrders}</Text>
            <Text style={s.statLabel}>Today's Orders</Text>
          </View>

          <View style={[s.statCard, s.statCardGreen]}>
            <Ionicons name="cash-outline" size={24} color="#fff" />
            <Text style={s.statValue}>฿{STATS.todayRevenue}</Text>
            <Text style={s.statLabel}>Today's Revenue</Text>
          </View>

          <View style={[s.statCard, s.statCardOrange]}>
            <Ionicons name="time-outline" size={24} color="#fff" />
            <Text style={s.statValue}>{STATS.pendingOrders}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>

          <View style={[s.statCard, s.statCardPurple]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <Text style={s.statValue}>{STATS.completedToday}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionsRow}>
            <View style={s.actionCard}>
              <Ionicons name="add-circle-outline" size={32} color="#0E3A78" />
              <Text style={s.actionText}>New Order</Text>
            </View>
            <View style={s.actionCard}>
              <Ionicons name="pricetag-outline" size={32} color="#0E3A78" />
              <Text style={s.actionText}>Edit Prices</Text>
            </View>
            <View style={s.actionCard}>
              <Ionicons name="analytics-outline" size={32} color="#0E3A78" />
              <Text style={s.actionText}>Reports</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Orders</Text>
          {[1, 2, 3].map((i) => (
            <View key={i} style={s.orderCard}>
              <View style={s.orderLeft}>
                <Text style={s.orderId}>Order #{1000 + i}</Text>
                <Text style={s.orderCustomer}>Customer {i}</Text>
              </View>
              <View style={s.orderRight}>
                <Text style={s.orderPrice}>฿{150 * i}</Text>
                <View style={s.statusBadge}>
                  <Text style={s.statusText}>Pending</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 20,
    backgroundColor: '#0E3A78',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  shopName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statCardBlue: { backgroundColor: '#0E3A78' },
  statCardGreen: { backgroundColor: '#10B981' },
  statCardOrange: { backgroundColor: '#F59E0B' },
  statCardPurple: { backgroundColor: '#8B5CF6' },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  orderLeft: {
    gap: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  orderCustomer: {
    fontSize: 12,
    color: '#666',
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E3A78',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
});