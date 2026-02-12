import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useOrders } from '../../context/OrdersContext';

export default function MerchantWalletScreen() {
  const router = useRouter();
  const { walletBalance } = useOrders();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cash Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.content}>
        {/* Wallet Card */}
        <View style={s.walletCard}>
          <View style={s.walletIconWrap}>
            <View style={s.walletIconCircle}>
              <Ionicons name="wallet" size={36} color={Colors.primaryBlue} />
            </View>
          </View>
          <Text style={s.walletLabel}>กระเป๋าเงิน WIT</Text>
          <Text style={s.walletBalance}>฿{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        {/* Transfer Button */}
        <TouchableOpacity
          style={s.transferBtn}
          onPress={() => router.push('/(tabs)/transfer')}
          activeOpacity={0.8}
        >
          <Text style={s.transferBtnText}>Transfer to Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1, padding: 20, paddingTop: 10 },
  walletCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  walletIconWrap: {
    marginBottom: 12,
  },
  walletIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#93c5fd',
  },
  walletLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.successGreen,
  },
  transferBtn: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transferBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
