import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useMachines } from '../../context/MachineContext';

const shopAvatarImg = require('../../assets/images/shop-avatar.png');

/**
 * Coin-operated shop home - Shop Status dashboard
 * First page showing overview of machines and revenue
 */
export default function CoinShopScreen() {
  const router = useRouter();
  const { machines, todayRevenue } = useMachines();

  // คำนวณจากข้อมูลจริงใน context
  const stats = useMemo(() => ({
    total: machines.length,
    available: machines.filter((m) => m.status === 'available').length,
    running: machines.filter((m) => m.status === 'running').length,
    finished: machines.filter((m) => m.status === 'finished').length,
  }), [machines]);

  const handleBack = () => {
    router.back();
  };

  const handleViewReports = () => {
    // TODO: Navigate to reports page
    console.log('View Reports');
  };

  const handleAddMachine = () => {
    router.push('/(coin)/monitor?openAdd=1');
  };

  const handleSystem = () => {
    router.push('/(coin)/settings');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <Text style={styles.shopName}>ร้านsukhai</Text>
          <Image source={shopAvatarImg} style={styles.avatar} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.overviewLabel}>OVERVIEW</Text>
          <Text style={styles.shopStatusTitle}>Shop Status</Text>
        </View>

        {/* Status Cards Grid - tap to go to Live Monitor (always default filter = All) */}
        <View style={styles.statusGrid}>
          <TouchableOpacity
            style={styles.statusCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(coin)/monitor')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardLabel}>Total</Text>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color={Colors.textMuted}
              />
            </View>
            <Text style={styles.statusCardValue}>{stats.total}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(coin)/monitor')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardLabel}>Available</Text>
              <View style={styles.greenDot} />
            </View>
            <Text style={styles.statusCardValue}>{stats.available}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(coin)/monitor')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardLabel}>Running</Text>
              <View style={styles.runningIcon}>
                <Ionicons name="refresh" size={14} color={Colors.primaryBlue} />
              </View>
            </View>
            <Text style={styles.statusCardValue}>{stats.running}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(coin)/monitor')}
          >
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardLabel}>Finished</Text>
              <View style={styles.finishedIcon}>
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#f59e0b"
                />
              </View>
            </View>
            <Text style={styles.statusCardValue}>{stats.finished}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueHeaderLeft}>
              <Ionicons name="cash-outline" size={20} color={Colors.white} />
              <Text style={styles.revenueLabel}>Today's Revenue</Text>
            </View>
            <Text style={styles.revenueChange}>วันนี้</Text>
          </View>
          <Text style={styles.revenueAmount}>฿{todayRevenue.toLocaleString()}</Text>
          <TouchableOpacity
            style={styles.viewReportsButton}
            onPress={handleViewReports}
            activeOpacity={0.8}
          >
            <Text style={styles.viewReportsText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="grid-outline" size={24} color={Colors.primaryBlue} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Monitor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMachine}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={handleSystem}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.textMuted} />
          <Text style={styles.navLabel}>System</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBorder,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  overviewSection: {
    marginBottom: 20,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryBlue,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  shopStatusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.successGreen,
  },
  runningIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revenueLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  revenueChange: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 16,
  },
  viewReportsButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  viewReportsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  navLabelActive: {
    color: Colors.primaryBlue,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
