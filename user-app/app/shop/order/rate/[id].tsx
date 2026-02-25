import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '../../../../config';
import { authPost } from '../../../../services/apiClient';

export default function RateExperienceScreen() {
    const { id, riderName } = useLocalSearchParams<{ id: string; riderName?: string }>();
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await authPost(`${API.ORDERS}/${id}/rate`, { rating });
        } catch (error) {
            console.error('Error submitting rating:', error);
        } finally {
            setSubmitting(false);
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
                <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <View style={styles.content}>
                {/* Rider Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Ionicons name="person-circle" size={90} color="#bbb" />
                    </View>
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#1976D2" />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Rate your experience</Text>
                <Text style={styles.subtitle}>
                    How was the service from <Text style={styles.riderName}>{riderName || 'Rider'}</Text> ?
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
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
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
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: -4,
        backgroundColor: '#fff',
        borderRadius: 12,
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
    },
    riderName: { fontWeight: '600', color: '#333' },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    star: { marginHorizontal: 4 },
    bottomBar: { padding: 24 },
    submitButton: {
        backgroundColor: '#1976D2',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#b0c4de',
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
