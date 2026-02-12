import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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

const TEAM = [
  {
    name: 'Mr. JED',
    phone: '0649525694',
    email: 'jednipit@ku.th',
    image: require('../../assets/images/team/jed.png'),
  },
  {
    name: 'Mr. AUGUS',
    phone: '0649525694',
    email: 'augus@ku.th',
    image: require('../../assets/images/team/augus.png'),
  },
  {
    name: 'Mr. GIG',
    phone: '0649525694',
    email: 'gig@ku.th',
    image: require('../../assets/images/team/gig.png'),
  },
  {
    name: 'Miss. GENE',
    phone: '0649525694',
    email: 'gene@ku.th',
    image: require('../../assets/images/team/gene.png'),
  },
  {
    name: 'Mr. Akira',
    phone: '0649525694',
    email: 'akira@ku.th',
    image: require('../../assets/images/team/akira.png'),
  },
];

export default function ContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {TEAM.map((member, index) => (
          <View key={index} style={s.card}>
            <Image source={member.image} style={s.avatar} />
            <Text style={s.name}>{member.name}</Text>
            <Text style={s.detail}>Phone number : {member.phone}</Text>
            <Text style={s.detail}>Gmail : {member.email}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.cardBorder,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
});
