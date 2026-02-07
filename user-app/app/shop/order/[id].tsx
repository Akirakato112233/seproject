import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '../../../config';
import { authGet, authPost } from '../../../services/apiClient';

interface DeliveryOption {
    id: string;
    name: string;
    time: string;
    price: number;
}

interface OrderItem {
    name: string;
    details: string;
    price: number;
    duration?: number;
    additionalRequest?: string;
}

interface OrderData {
    items: OrderItem[];
    serviceTotal: number;
    deliveryFee: number;
    deliveryTime: number;
}

interface Shop {
    _id: string;
    name: string;
    type: 'coin' | 'full';
    deliveryFee: number;
    deliveryTime: number;
}

export default function OrderScreen() {
    const { id, orderData: orderDataParam } = useLocalSearchParams<{ id: string; orderData?: string }>();
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDelivery, setSelectedDelivery] = useState<string>('priority');
    const [selectedPayment, setSelectedPayment] = useState<string>('cash');
    const [userLocation] = useState('The One Place Building');
    const [walletBalance, setWalletBalance] = useState<number>(0);

    // Parse order data from params
    const orderData: OrderData | null = useMemo(() => {
        if (orderDataParam) {
            try {
                return JSON.parse(orderDataParam);
            } catch (e) {
                console.error('Error parsing order data:', e);
                return null;
            }
        }
        return null;
    }, [orderDataParam]);

    // คำนวณ Delivery options จาก shop data
    const deliveryOptions: DeliveryOption[] = useMemo(() => {
        const baseTime = orderData?.deliveryTime || shop?.deliveryTime || 30;
        const baseFee = orderData?.deliveryFee || shop?.deliveryFee || 30;

        return [
            { id: 'priority', name: 'Priority', time: `${baseTime} mins`, price: Math.round(baseFee * 1.4) },
            { id: 'standard', name: 'Standard', time: `${baseTime + 7} mins`, price: baseFee },
            { id: 'saver', name: 'Saver', time: `${baseTime + 20} mins`, price: Math.round(baseFee * 0.85) },
        ];
    }, [orderData, shop]);

    // Order items จาก params หรือ default
    const orderItems: OrderItem[] = useMemo(() => {
        if (orderData?.items && orderData.items.length > 0) {
            return orderData.items;
        }
        // Fallback ถ้าไม่มีข้อมูล
        return [];
    }, [orderData]);

    const paymentMethods = [
        { id: 'wallet', name: 'WIT wallet', icon: 'wallet-outline' as const },
        { id: 'cash', name: 'Cash', icon: 'cash-outline' as const },
    ];

    useEffect(() => {
        fetchShopDetail();
        fetchWalletBalance();
    }, [id]);

    const fetchWalletBalance = async () => {
        try {
            const response = await authGet(API.BALANCE);
            const data = await response.json();
            setWalletBalance(data.balance || 0);
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            setWalletBalance(0);
        }
    };

    const fetchShopDetail = async () => {
        try {
            const response = await fetch(`http://192.168.1.37:3000/api/shops/${id}`);
            const data = await response.json();
            if (data && data._id) {
                setShop(data);
            }
        } catch (error) {
            console.error('Error fetching shop:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedDeliveryOption = () => {
        return deliveryOptions.find(opt => opt.id === selectedDelivery);
    };

    const calculateServiceTotal = () => {
        if (orderData?.serviceTotal) {
            return orderData.serviceTotal;
        }
        return orderItems.reduce((sum, item) => sum + item.price, 0);
    };

    const calculateDeliveryFee = () => {
        const option = getSelectedDeliveryOption();
        return option ? option.price : 0;
    };

    const calculateTotal = () => {
        return calculateServiceTotal() + calculateDeliveryFee();
    };

    // สร้างรายละเอียดเวลารวม
    const getTotalDuration = () => {
        if (orderItems.length === 0) return '';

        const durations = orderItems
            .filter(item => item.duration && item.duration > 0)
            .map(item => `${item.duration}min`);

        if (durations.length === 0) return '';
        return durations.join(' and ');
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

    if (!shop) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
                    <Text style={styles.loadingText}>ไม่พบข้อมูลร้าน</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (orderItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <Ionicons name="cart-outline" size={48} color="#999" />
                    <Text style={styles.loadingText}>ไม่มีรายการสั่งซื้อ</Text>
                    <TouchableOpacity
                        style={[styles.orderButton, { marginTop: 16, paddingHorizontal: 32 }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.orderButtonText}>กลับไปเลือกบริการ</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {shop.name}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Delivery Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Info</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={20} color="#666" />
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationLabel}>Your location</Text>
                            <Text style={styles.locationValue}>{userLocation}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Delivery Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery options</Text>
                    {deliveryOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.deliveryOption,
                                selectedDelivery === option.id && styles.deliveryOptionSelected,
                            ]}
                            onPress={() => setSelectedDelivery(option.id)}
                        >
                            <View style={styles.deliveryOptionContent}>
                                <Text style={[
                                    styles.deliveryOptionName,
                                    selectedDelivery === option.id && styles.deliveryOptionNameSelected,
                                ]}>
                                    {option.name}
                                </Text>
                                <Text style={styles.deliveryOptionTime}>{option.time}</Text>
                            </View>
                            <Text style={styles.deliveryOptionPrice}>{option.price}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* My Order */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Order</Text>
                    {orderItems.map((item, index) => (
                        <View key={index} style={styles.orderItem}>
                            <View style={styles.orderItemInfo}>
                                <Text style={styles.orderItemName}>{item.name}</Text>
                                <Text style={styles.orderItemDetails}>{item.details}</Text>
                                {item.additionalRequest && (
                                    <Text style={styles.additionalRequestText}>
                                        📝 {item.additionalRequest}
                                    </Text>
                                )}
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={styles.editLink}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.orderItemPrice}>฿ {item.price}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Price Summary */}
                <View style={styles.section}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Wash & Dry</Text>
                        <Text style={styles.priceValue}>฿ {calculateServiceTotal()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Delivery</Text>
                        <Text style={styles.priceValue}>฿ {calculateDeliveryFee()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>฿ {calculateTotal()}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment method</Text>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={styles.paymentOption}
                            onPress={() => setSelectedPayment(method.id)}
                        >
                            <View style={styles.paymentOptionContent}>
                                <Ionicons name={method.icon} size={20} color="#666" />
                                <Text style={styles.paymentOptionName}>{method.name}</Text>
                            </View>
                            <View style={[
                                styles.radio,
                                selectedPayment === method.id && styles.radioSelected,
                            ]}>
                                {selectedPayment === method.id && (
                                    <View style={styles.radioInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Spacer for bottom button */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Order Now Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.orderButton} onPress={async () => {
                    const total = calculateTotal();
                    const serviceTotal = calculateServiceTotal();
                    const deliveryFee = calculateDeliveryFee();

                    // ถ้าเลือก WIT wallet ต้องเช็คยอดเงิน
                    if (selectedPayment === 'wallet') {
                        if (walletBalance < total) {
                            const shortage = total - walletBalance;
                            const message = `💰 ยอดเงินไม่เพียงพอ!\n\nยอดเงินในกระเป๋า: ฿${walletBalance.toFixed(2)}\nยอดที่ต้องชำระ: ฿${total.toFixed(2)}\n\n⚠️ กรุณาเติมเงินอีก ฿${shortage.toFixed(2)}\n\nกด OK เพื่อไปเติมเงิน`;

                            const goToTopUp = confirm(message);
                            if (goToTopUp) {
                                router.push('/wallet/transfer');
                            }
                            return;
                        }
                    }

                    try {
                        // สร้าง Order ผ่าน API
                        const response = await authPost(API.ORDERS, {
                            shopId: id,
                            shopName: shop?.name || 'Unknown Shop',
                            items: orderItems.map(item => ({
                                name: item.name,
                                details: item.details,
                                price: item.price
                            })),
                            serviceTotal,
                            deliveryFee,
                            total,
                            paymentMethod: selectedPayment
                        });

                        const data = await response.json();

                        if (data.success) {
                            // ไป Order Status page พร้อม orderId
                            router.push({
                                pathname: `/shop/order/status/${data.order._id}` as any,
                                params: { step: '1' },
                            });
                        } else {
                            alert('❌ สร้าง Order ไม่สำเร็จ: ' + data.message);
                        }
                    } catch (error) {
                        console.error('Create Order Error:', error);
                        alert('❌ เกิดข้อผิดพลาดในการสร้าง Order');
                    }
                }}>
                    <Text style={styles.orderButtonText}>Order Now</Text>
                </TouchableOpacity>
            </View>
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
        marginTop: 10,
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
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginHorizontal: 8,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    divider: {
        height: 8,
        backgroundColor: '#f5f5f5',
    },
    // Delivery Info
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationInfo: {
        marginLeft: 12,
    },
    locationLabel: {
        fontSize: 12,
        color: '#999',
    },
    locationValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        marginTop: 2,
    },
    // Delivery Options
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 8,
    },
    deliveryOptionSelected: {
        borderColor: '#1976D2',
        backgroundColor: '#f7fbff',
    },
    deliveryOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deliveryOptionName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    deliveryOptionNameSelected: {
        color: '#1976D2',
    },
    deliveryOptionTime: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    deliveryOptionPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    // Order Items
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderItemInfo: {
        flex: 1,
    },
    orderItemName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    orderItemDetails: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    editLink: {
        fontSize: 14,
        color: '#1976D2',
        marginTop: 4,
    },
    additionalRequestText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
        backgroundColor: '#f5f5f5',
        padding: 6,
        borderRadius: 4,
    },
    orderItemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    // Price Summary
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 14,
        color: '#333',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976D2',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976D2',
    },
    // Payment Method
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    paymentOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentOptionName: {
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: '#1976D2',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1976D2',
    },
    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    orderButton: {
        backgroundColor: '#1976D2',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    orderButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
