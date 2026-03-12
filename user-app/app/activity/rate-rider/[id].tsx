import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '../../../config';
import { authPost } from '../../../services/apiClient';

export default function RateRiderScreen() {
    const { id, riderName, riderId } = useLocalSearchParams<{ id: string; riderName?: string; riderId?: string }>();
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await authPost(`${API.ORDERS}/${id}/rate-rider`, { rating, riderId });
        } catch (error) {
            console.error('Error submitting rider rating:', error);
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
                {/* Rider Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Ionicons name="bicycle" size={50} color="#3B82F6" />
                    </View>
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="star" size={24} color="#FFB800" />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>ให้คะแนน Rider</Text>
                <Text style={styles.subtitle}>
                    ความพึงพอใจในการบริการของ{' '}
                    <Text style={styles.riderNameText}>{riderName || 'Rider'}</Text> ?
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
        backgroundColor: '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#DBEAFE'
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
    riderNameText: { fontWeight: '700', color: '#3B82F6', fontSize: 16 },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    star: { marginHorizontal: 4 },
    bottomBar: { padding: 24, paddingBottom: 32 },
    submitButton: {
        backgroundColor: '#3B82F6',
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
        backgroundColor: '#93C5FD',
        elevation: 0,
        shadowOpacity: 0,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
