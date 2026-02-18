import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '../../../../config';
import { authGet, authPatch } from '../../../../services/apiClient';


type OrderStep = 1 | 2 | 3;

interface OrderData {
    _id: string;
    shopName: string;
    userDisplayName: string;
    userAddress: string;
    total: number;
    paymentMethod: string;
    status: string;
    items: { name: string; details: string; price: number }[];
    createdAt?: string;
}

const STEP_CONFIG: Record<OrderStep, { title: string; description: string }> = {
    1: {
        title: 'Rider on the way',
        description: "We'll notify you when your laundry is out for delivery",
    },
    2: {
        title: 'Laundry sent to shop',
        description: "Your laundry is being processed at the shop",
    },
    3: {
        title: 'Out for delivery',
        description: "Your laundry is on the way back to you!",
    },
};

export default function OrderStatusScreen() {
    const { id, step: stepParam } = useLocalSearchParams<{ id: string; step?: string }>();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);

    // Parse step จาก params (default = 1)
    const currentStep: OrderStep = (parseInt(stepParam || '1') as OrderStep) || 1;
    const stepInfo = STEP_CONFIG[currentStep] || STEP_CONFIG[1];

    // คำนวณเวลาจริง
    const getEstimatedTime = () => {
        if (!order?.createdAt) {
            return 'Calculating...';
        }

        const createdDate = new Date(order.createdAt);

        // กำหนดเวลาโดยประมาณตาม step
        // Step 1: Rider coming (15-30 min)
        // Step 2: At shop processing (30-60 min)
        // Step 3: Delivery back (15-30 min)
        let minMinutes = 15;
        let maxMinutes = 30;

        if (currentStep === 1) {
            minMinutes = 15;
            maxMinutes = 30;
        } else if (currentStep === 2) {
            minMinutes = 45; // Step 1 + Step 2 start
            maxMinutes = 90; // Step 1 + Step 2 end
        } else if (currentStep === 3) {
            minMinutes = 60;  // All steps almost done
            maxMinutes = 90;
        }

        const minTime = new Date(createdDate.getTime() + minMinutes * 60000);
        const maxTime = new Date(createdDate.getTime() + maxMinutes * 60000);

        const formatTime = (date: Date) => {
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 -> 12
            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
            return `${hours}:${minutesStr} ${ampm}`;
        };

        return `${formatTime(minTime)} - ${formatTime(maxTime)}`;
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await authGet(`${API.ORDERS}/${id}`);
            const data = await response.json();
            console.log('📦 Order data from API:', data);
            console.log('📦 Order createdAt:', data.order?.createdAt);
            if (data.success) {
                setOrder(data.order);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        Linking.openURL('tel:+66649525694');
    };

    const handleChat = () => {
        router.push({
            pathname: '/shop/chat' as any,
            params: { id },
        });
    };

    const handleCancel = async () => {
        try {
            const response = await authPatch(`${API.ORDERS}/${id}/status`, { status: 'cancelled' });
            const data = await response.json();
            if (data.success) {
                alert('ยกเลิก Order สำเร็จ');
                router.replace('/(tabs)');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการยกเลิก Order');
        }
    };

    // Navigate to different step (for testing)
    const goToStep = (step: OrderStep) => {
        router.replace({
            pathname: `/shop/order/status/${id}` as any,
            params: { step: step.toString() },
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                    <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Status</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Time Range & Status */}
                <View style={styles.timeSection}>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{getEstimatedTime()}</Text>
                        <View style={styles.riderIcon}>
                            <Ionicons name="bicycle" size={24} color="#1976D2" />
                        </View>
                    </View>
                    <Text style={styles.statusTitle}>{stepInfo.title}</Text>
                </View>

                {/* Progress Steps */}
                <View style={styles.progressSection}>
                    <View style={styles.progressDots}>
                        {[1, 2, 3].map((step) => (
                            <TouchableOpacity
                                key={step}
                                onPress={() => goToStep(step as OrderStep)}
                                style={[
                                    styles.dot,
                                    currentStep >= step && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.notifyText}>{stepInfo.description}</Text>
                </View>

                {/* Shop Info - แสดงข้อมูลจริงจาก Order */}
                <View style={styles.shopSection}>
                    <View style={styles.shopRow}>
                        <Text style={styles.shopName}>{order?.shopName || 'Unknown Shop'}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <View style={order?.paymentMethod === 'wallet' ? styles.paidBadge : styles.cashBadge}>
                            <Text style={styles.paidText}>
                                {order?.paymentMethod === 'wallet' ? 'PAID' : 'CASH'}
                            </Text>
                        </View>
                        <Text style={styles.totalAmount}>฿{order?.total || 0}</Text>
                    </View>
                </View>

                {/* Order Items */}
                {order?.items && order.items.length > 0 && (
                    <View style={styles.itemsSection}>
                        <Text style={styles.itemsSectionTitle}>รายการที่สั่ง</Text>
                        {order.items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>฿{item.price}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Rider & Location Info */}
                <View style={styles.infoSection}>
                    {/* Rider Row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <View style={styles.riderDot} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Rider</Text>
                            <Text style={styles.infoName}>Natthapong Sawang</Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
                                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Connector Line */}
                    <View style={styles.connectorLine} />

                    {/* Location Row - แสดงที่อยู่ user (Step 1, 3) หรือร้าน (Step 2) */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="location" size={20} color="#ff6b6b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>
                                {currentStep === 2 ? order?.shopName || 'Shop' : order?.userDisplayName || 'Customer'}
                            </Text>
                            <Text style={styles.infoName}>
                                {currentStep === 2 ? order?.shopName || 'Shop' : order?.userAddress || 'ที่อยู่ลูกค้า'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Cancel Order (Step 1 only) */}
                {currentStep === 1 && (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelText}>Cancel Order</Text>
                        <Ionicons name="chevron-forward" size={20} color="#333" />
                    </TouchableOpacity>
                )}

                {/* Debug: Step Navigation (for testing) */}
                <View style={styles.debugSection}>
                    <Text style={styles.debugTitle}>🔧 Test Navigation (Debug)</Text>
                    <View style={styles.debugButtons}>
                        <TouchableOpacity
                            style={[styles.debugButton, currentStep === 1 && styles.debugButtonActive]}
                            onPress={() => goToStep(1)}
                        >
                            <Text style={styles.debugButtonText}>Step 1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.debugButton, currentStep === 2 && styles.debugButtonActive]}
                            onPress={() => goToStep(2)}
                        >
                            <Text style={styles.debugButtonText}>Step 2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.debugButton, currentStep === 3 && styles.debugButtonActive]}
                            onPress={() => goToStep(3)}
                        >
                            <Text style={styles.debugButtonText}>Step 3</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    // Time Section
    timeSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    riderIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusTitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    // Progress Section
    progressSection: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    progressDots: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ddd',
    },
    dotActive: {
        backgroundColor: '#1976D2',
    },
    notifyText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    // Shop Section
    shopSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    shopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    shopName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    paidBadge: {
        backgroundColor: '#4caf50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    cashBadge: {
        backgroundColor: '#ff9800',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    paidText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    // Items Section
    itemsSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemsSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    itemName: {
        fontSize: 14,
        color: '#666',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    // Info Section
    infoSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 30,
        alignItems: 'center',
    },
    riderDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1976D2',
        borderWidth: 2,
        borderColor: '#e3f2fd',
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
    },
    infoName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectorLine: {
        width: 2,
        height: 30,
        backgroundColor: '#ddd',
        marginLeft: 14,
        marginVertical: 8,
    },
    // Cancel Button
    cancelButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cancelText: {
        fontSize: 14,
        color: '#ff6b6b',
        fontWeight: '500',
    },
    // Debug Section
    debugSection: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        margin: 16,
        borderRadius: 12,
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    debugButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    debugButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#ddd',
        alignItems: 'center',
    },
    debugButtonActive: {
        backgroundColor: '#1976D2',
    },
    debugButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
});
