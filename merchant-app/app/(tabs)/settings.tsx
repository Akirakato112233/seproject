import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/create-account');
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
        {/* Services / Options */}
        <Text style={s.sectionTitle}>Services</Text>
        <TouchableOpacity
          style={s.menuItem}
          onPress={() => router.push('/services')}
        >
          <View style={[s.iconWrap, s.iconGreen]}>
            <Ionicons name="list-outline" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>จัดการบริการ (Options)</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.menuItem}
          onPress={() => router.push('/opening-hours')}
        >
          <View style={[s.iconWrap, s.iconBlue]}>
            <Ionicons name="time-outline" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>จัดการเวลาเปิด-ปิด (time)</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Account Management */}
        <Text style={s.sectionTitle}>Account Management</Text>
        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(tabs)/contact')}>
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
      </ScrollView>
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
  contentInner: { padding: 16, paddingBottom: 40 },
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
  iconGreen: { backgroundColor: Colors.successGreen },
  iconBlue: { backgroundColor: Colors.primaryBlue },
  iconPurple: { backgroundColor: '#8b5cf6' },
  iconRed: { backgroundColor: '#dc2626' },
  menuText: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  logoutText: { color: '#dc2626' },
});
