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

export default function CoinSettingsScreen() {
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
        <Text style={s.sectionLink}>Your Store Link</Text>
        <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(coin)/machine-settings')}>
          <View style={[s.iconWrap, s.iconGreen]}>
            <Ionicons name="share-social" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>Option</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Your Personal Information</Text>
        <TouchableOpacity style={s.menuItem}>
          <View style={[s.iconWrap, s.iconBlue]}>
            <Ionicons name="person-outline" size={22} color={Colors.white} />
          </View>
          <Text style={s.menuText}>Personal Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Account Management</Text>
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
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryBlue,
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  iconGreen: { backgroundColor: Colors.successGreen },
  iconBlue: { backgroundColor: Colors.primaryBlue },
  iconPurple: { backgroundColor: '#8b5cf6' },
  iconRed: { backgroundColor: '#dc2626' },
  menuText: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  logoutText: { color: '#dc2626' },
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
