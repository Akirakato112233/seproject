import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; // ✅ เพิ่ม useFocusEffect
import { useCallback, useState } from 'react'; // ✅ เพิ่ม useState, useCallback
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API } from '../../config';
// เช็ค path รูปให้ถูก (ถ้าแดงให้แก้ path)
const wDigitalImg = require('../../assets/images/Wdigita.png'); 

export default function WalletScreen() {
  const router = useRouter();
  
  // ✅ 1. สร้างตัวแปรเก็บเงิน
  const [balance, setBalance] = useState('0.00');

  // ✅ 2. ฟังก์ชันดึงยอดเงิน (ทำงานทุกครั้งที่เข้าหน้านี้)
  useFocusEffect(
    useCallback(() => {
      const fetchBalance = async () => {
        try {
          const res = await fetch(API.BALANCE);
          const data = await res.json();
          
          // แปลงเป็นทศนิยม 2 ตำแหน่ง
          setBalance(data.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } catch (error) {
          console.log('Error fetching wallet balance:', error);
        }
      };
      fetchBalance();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Card */}
        <View style={styles.walletCardContainer}>
          <View style={styles.walletCardBackground}>
            <View style={styles.decoLine} />
            <View style={[styles.decoLine, { marginTop: 4 }]} />

            <View style={styles.logoWrapper}>
               <Image source={wDigitalImg} style={styles.walletCardImage} resizeMode="contain" />
            </View>

            <Text style={styles.walletLabel}>กระเป๋าเงิน WIT</Text>
            
            {/* ✅ 3. เอาตัวแปรมาโชว์ตรงนี้ */}
            <Text style={styles.walletBalance}>฿{balance}</Text>
            
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity 
          style={styles.transferButton} 
          onPress={() => router.push('/wallet/transfer')}
        >
          <Text style={styles.transferButtonText}>Transfer to WIT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 20, paddingTop: 10 },
  walletCardContainer: { backgroundColor: '#EEF2F6', borderRadius: 8, paddingVertical: 30, alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  walletCardBackground: { width: '100%', alignItems: 'center' },
  decoLine: { width: '100%', height: 2, backgroundColor: '#DDE2E8', position: 'absolute', top: 50 },
  logoWrapper: { marginBottom: 10, alignItems: 'center', backgroundColor: '#EEF2F6', paddingHorizontal: 10, zIndex: 1 },
  walletCardImage: { width: 140, height: 90 },
  walletLabel: { fontSize: 14, color: '#333', marginBottom: 5 },
  walletBalance: { fontSize: 32, color: '#2ECC71' }, // สีเขียว
  transferButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center', elevation: 5, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.1 },
  transferButtonText: { fontSize: 16, fontWeight: '500' },
});