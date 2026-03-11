import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '../../../config';
import { authPost } from '../../../services/apiClient';

export default function RateShopScreen() {
    const { id, shopName } = useLocalSearchParams<{ id: string; shopName?: string }>();
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // เรียกใช้ endpoint ฝั่ง backend (ที่เราเพิ่มใหม่)
            await authPost(`${API.ORDERS}/${id}/rate-shop`, { rating });
        } catch (error) {
            console.error('Error submitting shop rating:', error);
        } finally {
            setSubmitting(false);
            router.replace('/(tabs)/activity');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)/activity')}>
                <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <View style={styles.content}>
                {/* Shop Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Ionicons name="storefront" size={50} color="#1976D2" />
                    </View>
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="star" size={24} color="#FFB800" />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>อัตราคะแนนร้านค้า</Text>
                <Text style={styles.subtitle}>
                    ความพึงพอใจในการใช้บริการร้าน{' '}
                    <Text style={styles.shopNameText}>{shopName || 'ร้านซักอบรีด'}</Text> ?
                </Text>

                {/* Stars */}
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={44}
                                color={star <= rating ? '#FFB800' : '#ccc'}
                                style={styles.star}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Submit Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || rating === 0}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>ยืนยันการให้คะแนน</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    closeButton: { padding: 16 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    avatarContainer: { marginBottom: 28, position: 'relative' },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E0F2FE'
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    shopNameText: { fontWeight: '700', color: '#1976D2', fontSize: 16 },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    star: { marginHorizontal: 4 },
    bottomBar: { padding: 24, paddingBottom: 32 },
    submitButton: {
        backgroundColor: '#1976D2',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#b0c4de',
        elevation: 0,
        shadowOpacity: 0,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
