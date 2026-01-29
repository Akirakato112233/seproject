import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
    // State สำหรับเก็บค่าตัวกรองที่ user เลือกในหน้านี้
    const [serviceType, setServiceType] = useState<'all' | 'coin' | 'full'>('all');
    const [needsDelivery, setNeedsDelivery] = useState(false);
    const [sortBy, setSortBy] = useState<'nearMe' | 'rating' | null>(null);

    // ฟังก์ชันกดค้นหา แล้วส่งค่า params ไปหน้า Search
    const handleSearch = () => {
        router.push({
            pathname: '/search',
            params: {
                // ส่งค่าประเภท (ถ้าเลือก all ไม่ต้องส่งค่าไป)
                type: serviceType !== 'all' ? serviceType : undefined,

                // ส่งค่าว่าต้องการ Delivery ไหม
                delivery: needsDelivery ? 'true' : undefined,

                // ส่งค่าการเรียงลำดับ (ใกล้ฉัน หรือ เรตติ้ง)
                nearMe: sortBy === 'nearMe' ? 'true' : undefined,
                rating: sortBy === 'rating' ? '4' : undefined, // สมมติว่าถ้าเลือก rating คือเอา 4 ดาวขึ้นไป
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ค้นหาร้านที่คุณต้องการ</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. เลือกประเภทบริการ (Main Choice) */}
                <Text style={styles.sectionTitle}>ประเภทบริการ</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeCard, serviceType === 'coin' && styles.typeCardSelected]}
                        onPress={() => setServiceType(serviceType === 'coin' ? 'all' : 'coin')}
                    >
                        <View style={[styles.iconCircle, serviceType === 'coin' && styles.iconCircleSelected]}>
                            <MaterialCommunityIcons name="washing-machine" size={32} color={serviceType === 'coin' ? '#fff' : '#1d4685'} />
                        </View>
                        <Text style={[styles.typeText, serviceType === 'coin' && styles.typeTextSelected]}>
                            ร้านสะดวกซัก{'\n'}(Coin Laundry)
                        </Text>
                        {serviceType === 'coin' && (
                            <Ionicons name="checkmark-circle" size={24} color="#1d4685" style={styles.checkIcon} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeCard, serviceType === 'full' && styles.typeCardSelected]}
                        onPress={() => setServiceType(serviceType === 'full' ? 'all' : 'full')}
                    >
                        <View style={[styles.iconCircle, serviceType === 'full' && styles.iconCircleSelected]}>
                            <Ionicons name="shirt" size={32} color={serviceType === 'full' ? '#fff' : '#1d4685'} />
                        </View>
                        <Text style={[styles.typeText, serviceType === 'full' && styles.typeTextSelected]}>
                            ซัก อบ รีด{'\n'}(Full Service)
                        </Text>
                        {serviceType === 'full' && (
                            <Ionicons name="checkmark-circle" size={24} color="#1d4685" style={styles.checkIcon} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* 2. ตัวเลือกเพิ่มเติม (Add-ons) */}
                <Text style={styles.sectionTitle}>ตัวเลือกเสริม</Text>
                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={[styles.optionChip, needsDelivery && styles.optionChipSelected]}
                        onPress={() => setNeedsDelivery(!needsDelivery)}
                    >
                        <MaterialCommunityIcons name="moped" size={20} color={needsDelivery ? '#fff' : '#666'} />
                        <Text style={[styles.optionText, needsDelivery && styles.optionTextSelected]}>รับ-ส่งถึงที่</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. จัดเรียงตาม (Sort By) */}
                <Text style={styles.sectionTitle}>เน้นอะไรเป็นพิเศษ?</Text>
                <View style={styles.sortContainer}>
                    <TouchableOpacity
                        style={[styles.sortCard, sortBy === 'nearMe' && styles.sortCardSelected]}
                        onPress={() => setSortBy(sortBy === 'nearMe' ? null : 'nearMe')}
                    >
                        <Ionicons name="location" size={24} color={sortBy === 'nearMe' ? '#fff' : '#1d4685'} />
                        <Text style={[styles.sortText, sortBy === 'nearMe' && styles.sortTextSelected]}>ใกล้ฉันที่สุด</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sortCard, sortBy === 'rating' && styles.sortCardSelected]}
                        onPress={() => setSortBy(sortBy === 'rating' ? null : 'rating')}
                    >
                        <Ionicons name="star" size={24} color={sortBy === 'rating' ? '#fff' : '#FFD700'} />
                        <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextSelected]}>คะแนนสูงสุด</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <LinearGradient
                        colors={['#2E6BE8', '#1d4685']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.searchButtonText}>ค้นหาร้านซักรีด</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FD',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    closeButton: {
        padding: 8,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 15,
        marginTop: 10,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    typeCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    typeCardSelected: {
        borderColor: '#1d4685',
        backgroundColor: '#F0F6FF',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EAF1FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircleSelected: {
        backgroundColor: '#1d4685',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    typeTextSelected: {
        color: '#1d4685',
        fontWeight: '700',
    },
    checkIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 25,
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#eee',
        gap: 8,
    },
    optionChipSelected: {
        backgroundColor: '#1d4685',
        borderColor: '#1d4685',
    },
    optionText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#fff',
    },
    sortContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    sortCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        gap: 10,
    },
    sortCardSelected: {
        backgroundColor: '#1d4685',
        borderColor: '#1d4685',
    },
    sortText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    sortTextSelected: {
        color: '#fff',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    searchButton: {
        shadowColor: '#2E6BE8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
    },
    searchButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});