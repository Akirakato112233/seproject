import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { API, NGROK_HEADERS } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useCoinShop } from '../../context/CoinShopContext';

export default function CoinSettingsScreen() {
  const router = useRouter();
  const { logout, token } = useAuth();
  const { shop, updateShop } = useCoinShop();
  const [updating, setUpdating] = useState(false);

  const isMaintenanceMode = shop?.status === false;

  const handleMaintenanceToggle = (value: boolean) => {
    if (updating || !shop) return;
    if (Platform.OS === 'web') {
      const msg = value
        ? 'คุณต้องการปิดปรับปรุงร้านใช่หรือไม่? ลูกค้าจะไม่สามารถสั่งงานเครื่องซักผ้าได้จนกว่าคุณจะเปิดร้านอีกครั้ง'
        : 'เครื่องซักผ้าที่ออนไลน์อยู่จะพร้อมให้ลูกค้าสั่งงานได้ทันที คุณต้องการดำเนินการต่อหรือไม่?';
      if (window.confirm(msg)) doUpdateStatus(!value);
    } else if (value) {
      Alert.alert(
        'ยืนยันการปิดร้าน',
        'คุณต้องการปิดปรับปรุงร้านใช่หรือไม่? ลูกค้าจะไม่สามารถสั่งงานเครื่องซักผ้าได้จนกว่าคุณจะเปิดร้านอีกครั้ง',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ปิดร้าน', onPress: () => doUpdateStatus(false) },
        ]
      );
    } else {
      Alert.alert(
        'ยืนยันการเปิดร้าน',
        'เครื่องซักผ้าที่ออนไลน์อยู่จะพร้อมให้ลูกค้าสั่งงานได้ทันที คุณต้องการดำเนินการต่อหรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'เปิดร้าน', onPress: () => doUpdateStatus(true) },
        ]
      );
    }
  };

  const doUpdateStatus = async (next: boolean) => {
    if (!shop) return;
    setUpdating(true);
    await updateShop({ status: next });
    setUpdating(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/create-account');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'ลบบัญชี',
      'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี? การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลร้านและประวัติการใช้งานทั้งหมดจะถูกลบ',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบบัญชี',
          style: 'destructive',
          onPress: async () => {
            if (!token) {
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบ token กรุณา Log Out แล้วเข้าสู่ระบบใหม่');
              return;
            }
            try {
              const res = await fetch(API.MERCHANTS_DELETE_ACCOUNT, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  ...NGROK_HEADERS,
                  Authorization: `Bearer ${token}`,
                },
              });
              const data = await res.json().catch(() => ({}));
              if (res.ok && data.success) {
                await logout();
                router.replace('/create-account');
              } else {
                Alert.alert('ไม่สามารถลบบัญชีได้', data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
              }
            } catch (err) {
              console.error('Delete account error:', err);
              Alert.alert('ไม่สามารถลบบัญชีได้', 'เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerCenter}>
          <Text style={s.title}>Your Store Profile</Text>
          <Text style={s.subtitle}>View and edit your store information.</Text>
        </View>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
        <Text style={s.sectionTitle}>Store Management</Text>
        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(coin)/machine-settings')}>
          <View style={[s.iconWrap, s.iconGreen]}>
            <Ionicons name="share-social" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>Option</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={s.toggleRow}>
          <View style={s.toggleContent}>
            <Text style={s.toggleLabel}>โหมดปิดปรับปรุงร้าน</Text>
            <Text style={s.toggleDescription}>ระบบจะระงับการใช้งานเครื่องซักผ้าทั้งหมดชั่วคราว</Text>
          </View>
          <Switch
            value={isMaintenanceMode}
            onValueChange={handleMaintenanceToggle}
            disabled={updating}
            trackColor={{ false: Colors.cardBorder, true: Colors.primaryBlue }}
            thumbColor={Colors.white}
          />
        </View>

        <Text style={s.sectionTitle}>Account Management</Text>
        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(coin)/edit-account' as any)}>
          <View style={[s.iconWrap, s.iconBlue]}>
            <Ionicons name="person-outline" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>Account</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(coin)/contact')}>
          <View style={[s.iconWrap, s.iconPurple]}>
            <Ionicons name="headset-outline" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>Contact WIT</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={handleLogout}>
          <View style={[s.iconWrap, s.iconRed]}>
            <Ionicons name="log-out-outline" size={22} color={Colors.white} />
          </View>
          <Text style={[s.menuText, s.logoutText]}>Log Out</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={handleDeleteAccount}>
          <View style={[s.iconWrap, s.iconRed]}>
            <Ionicons name="trash-outline" size={22} color={Colors.white} />
          </View>
          <Text style={[s.menuText, s.deleteAccountText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => router.replace('/(coin)')}>
          <Ionicons name="grid-outline" size={24} color={Colors.textMuted} />
          <Text style={s.navLabel}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.addButton}
          onPress={() => router.push('/(coin)/monitor')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem}>
          <Ionicons name="settings-outline" size={24} color={Colors.primaryBlue} />
          <Text style={[s.navLabel, s.navLabelActive]}>System</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  header: {
    backgroundColor: Colors.primaryBlue,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerCenter: { alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  toggleContent: { flex: 1, marginRight: 12 },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  iconGreen: { backgroundColor: Colors.successGreen },
  iconBlue: { backgroundColor: Colors.primaryBlue },
  iconPurple: { backgroundColor: '#8b5cf6' },
  iconRed: { backgroundColor: '#dc2626' },
  menuText: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  logoutText: { color: '#dc2626' },
  deleteAccountText: { color: '#dc2626' },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.white,
  },
  navItem: { alignItems: 'center', gap: 4, flex: 1 },
  navLabel: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  navLabelActive: { color: Colors.primaryBlue },
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
