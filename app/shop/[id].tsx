import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

interface ServiceOption {
    setting?: string;
    type?: string;
    duration?: number;
    price: number;
    pricePerKg?: number;
}

interface WashService {
    weight: number;
    options: ServiceOption[];
}

interface DryService {
    weight: number;
    options: ServiceOption[];
}

interface IroningServiceOption {
    type: string;
    price: number;
}

interface IroningService {
    category: string;
    options: IroningServiceOption[];
}

interface FoldingServiceOption {
    type: string;
    pricePerKg: number;
}

interface FoldingService {
    options: FoldingServiceOption[];
}

interface OtherServiceOption {
    name: string;
    price: number;
    unit: string;
}

interface OtherService {
    category: string;
    options: OtherServiceOption[];
}

interface Shop {
    _id: string;
    name: string;
    rating: number;
    reviewCount: number;
    priceLevel: number;
    type: 'coin' | 'full';
    deliveryFee: number;
    deliveryTime: number;
    imageUrl?: string;
    washServices?: WashService[];
    dryServices?: DryService[];
    ironingServices?: IroningService[];
    foldingServices?: FoldingService[];
    otherServices?: OtherService[];
}

export default function ShopDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [shop, setShop] = useState<Shop | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: number }>({});
    const [additionalRequest, setAdditionalRequest] = useState('');

    useEffect(() => {
        fetchShopDetail();
    }, [id]);

    const fetchShopDetail = async () => {
        try {
            // เปลี่ยน IP เป็น localhost หรือ IP ของ backend
            const response = await fetch(`http://192.168.0.247:3000/api/shops/${id}`);
            const data = await response.json();
            // Backend ส่ง shop object โดยตรง (ไม่ได้ wrap ใน { success, data })
            if (data && data._id) {
                setShop(data);
            } else if (data.error) {
                console.error('Shop not found:', data.error);
            }
        } catch (error) {
            console.error('Error fetching shop:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (serviceKey: string, optionIndex: number) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [serviceKey]: prev[serviceKey] === optionIndex ? -1 : optionIndex,
        }));
    };

    const calculateTotal = () => {
        let total = 0;
        Object.entries(selectedOptions).forEach(([key, optionIndex]) => {
            if (optionIndex >= 0 && shop) {
                const [serviceType, weightIndex] = key.split('-');
                if (serviceType === 'wash' && shop.washServices) {
                    const service = shop.washServices[parseInt(weightIndex)];
                    if (service && service.options[optionIndex]) {
                        total += service.options[optionIndex].price;
                    }
                } else if (serviceType === 'dry' && shop.dryServices) {
                    const service = shop.dryServices[parseInt(weightIndex)];
                    if (service && service.options[optionIndex]) {
                        total += service.options[optionIndex].price;
                    }
                }
                else if (serviceType === 'ironing' && shop.ironingServices) {
                    const service = shop.ironingServices[parseInt(weightIndex)];
                    if (service && service.options[optionIndex]) {
                        total += service.options[optionIndex].price;
                    }
                }
                else if (serviceType === 'folding' && shop.foldingServices) {
                    const service = shop.foldingServices[parseInt(weightIndex)];
                    if (service && service.options[optionIndex]) {
                        total += service.options[optionIndex].pricePerKg;
                    }
                }
                else if (serviceType == 'other' && shop.otherServices) {
                    const service = shop.otherServices[parseInt(weightIndex)];
                    if (service && service.options[optionIndex]) {
                        total += service.options[optionIndex].price;
                    }
                }
            }
        });
        return total;
    };

    if (loading) {
        return (
            <SafeAreaView style={localStyles.container}>
                <View style={localStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1d4685" />
                    <Text style={localStyles.loadingText}>กำลังโหลดข้อมูล...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!shop) {
        return (
            <SafeAreaView style={localStyles.container}>
                <View style={localStyles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
                    <Text style={localStyles.loadingText}>ไม่พบข้อมูลร้าน</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={localStyles.container}>
            <ScrollView style={localStyles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View style={localStyles.headerImage}>
                    {shop.imageUrl ? (
                        <Image source={{ uri: shop.imageUrl }} style={localStyles.shopImage} />
                    ) : (
                        <View style={localStyles.placeholderImage}>
                            <Ionicons name="shirt-outline" size={60} color="#fff" />
                            <Text style={localStyles.placeholderText}>
                                {shop.type === 'coin' ? 'COIN LAUNDRY' : 'FULL SERVICE'}
                            </Text>
                        </View>
                    )}
                    {/* Back Button */}
                    <TouchableOpacity style={localStyles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Shop Info */}
                <View style={localStyles.shopInfoContainer}>
                    <Text style={localStyles.shopName}>{shop.name}</Text>

                    <View style={localStyles.ratingRow}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={localStyles.ratingText}>{shop.rating}</Text>
                        <Text style={localStyles.reviewCount}>({shop.reviewCount}+)</Text>
                        <View style={localStyles.deliveryInfo}>
                            <Ionicons name="bicycle" size={16} color="#666" />
                            <Text style={localStyles.deliveryText}>
                                ฿ {shop.deliveryFee} · From {shop.deliveryTime} mins
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Wash Services */}
                {shop.washServices && shop.washServices.length > 0 && (
                    <View style={localStyles.servicesSection}>
                        {shop.washServices.map((service, serviceIndex) => (
                            <View key={`wash-${serviceIndex}`} style={localStyles.serviceGroup}>
                                <Text style={localStyles.serviceTitle}>Wash {service.weight} kg</Text>
                                {service.options.map((option, optionIndex) => {
                                    const isSelected = selectedOptions[`wash-${serviceIndex}`] === optionIndex;
                                    return (
                                        <TouchableOpacity
                                            key={optionIndex}
                                            style={localStyles.optionRow}
                                            onPress={() => handleSelectOption(`wash-${serviceIndex}`, optionIndex)}
                                        >
                                            <View style={[localStyles.radio, isSelected && localStyles.radioSelected]}>
                                                {isSelected && <View style={localStyles.radioInner} />}
                                            </View>
                                            <Text style={localStyles.optionSetting}>{option.setting}</Text>
                                            <Text style={localStyles.optionDuration}>{option.duration} min</Text>
                                            <Text style={localStyles.optionPrice}>฿ {option.price}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Dry Services */}
                {shop.dryServices && shop.dryServices.length > 0 && (
                    <View style={localStyles.servicesSection}>
                        {shop.dryServices.map((service, serviceIndex) => (
                            <View key={`dry-${serviceIndex}`} style={localStyles.serviceGroup}>
                                <Text style={localStyles.serviceTitle}>Dry {service.weight} kg</Text>
                                {service.options.map((option, optionIndex) => {
                                    const isSelected = selectedOptions[`dry-${serviceIndex}`] === optionIndex;
                                    return (
                                        <TouchableOpacity
                                            key={optionIndex}
                                            style={localStyles.optionRow}
                                            onPress={() => handleSelectOption(`dry-${serviceIndex}`, optionIndex)}
                                        >
                                            <View style={[localStyles.radio, isSelected && localStyles.radioSelected]}>
                                                {isSelected && <View style={localStyles.radioInner} />}
                                            </View>
                                            <Text style={localStyles.optionSetting}>{option.setting}</Text>
                                            <Text style={localStyles.optionDuration}>{option.duration} min</Text>
                                            <Text style={localStyles.optionPrice}>฿ {option.price}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Ironing Services - เฉพาะร้าน full service */}
                {shop.type === 'full' && shop.ironingServices && shop.ironingServices.length > 0 && (
                    <View style={localStyles.servicesSection}>
                        <Text style={localStyles.sectionHeader}>🔥 บริการรีดผ้า (Ironing)</Text>
                        {shop.ironingServices.map((service, serviceIndex) => (
                            <View key={`ironing-${serviceIndex}`} style={localStyles.serviceGroup}>
                                <Text style={localStyles.serviceTitle}>{service.category}</Text>
                                {service.options.map((option, optionIndex) => {
                                    const isSelected = selectedOptions[`ironing-${serviceIndex}`] === optionIndex;
                                    return (
                                        <TouchableOpacity
                                            key={optionIndex}
                                            style={localStyles.optionRow}
                                            onPress={() => handleSelectOption(`ironing-${serviceIndex}`, optionIndex)}
                                        >
                                            <View style={[localStyles.radio, isSelected && localStyles.radioSelected]}>
                                                {isSelected && <View style={localStyles.radioInner} />}
                                            </View>
                                            <Text style={localStyles.optionSetting}>{option.type}</Text>
                                            <Text style={localStyles.optionPrice}>฿ {option.price}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Folding Services - เฉพาะร้าน full service */}
                {shop.type === 'full' && shop.foldingServices && shop.foldingServices.length > 0 && (
                    <View style={localStyles.servicesSection}>
                        <Text style={localStyles.sectionHeader}>📦 บริการผับผ้า (Folding)</Text>
                        {shop.foldingServices.map((service, serviceIndex) => (
                            <View key={`folding-${serviceIndex}`} style={localStyles.serviceGroup}>
                                {service.options.map((option, optionIndex) => {
                                    const isSelected = selectedOptions[`folding-${serviceIndex}`] === optionIndex;
                                    return (
                                        <TouchableOpacity
                                            key={optionIndex}
                                            style={localStyles.optionRow}
                                            onPress={() => handleSelectOption(`folding-${serviceIndex}`, optionIndex)}
                                        >
                                            <View style={[localStyles.radio, isSelected && localStyles.radioSelected]}>
                                                {isSelected && <View style={localStyles.radioInner} />}
                                            </View>
                                            <Text style={localStyles.optionSetting}>{option.type}</Text>
                                            <Text style={localStyles.optionPrice}>฿ {option.pricePerKg}/kg</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Other Services - เฉพาะร้าน full service */}
                {shop.type === 'full' && shop.otherServices && shop.otherServices.length > 0 && (
                    <View style={localStyles.servicesSection}>
                        <Text style={localStyles.sectionHeader}>✨ บริการอื่นๆ</Text>
                        {shop.otherServices.map((service, serviceIndex) => (
                            <View key={`other-${serviceIndex}`} style={localStyles.serviceGroup}>
                                <Text style={localStyles.serviceTitle}>{service.category}</Text>
                                {service.options.map((option, optionIndex) => {
                                    const isSelected = selectedOptions[`other-${serviceIndex}`] === optionIndex;
                                    return (
                                        <TouchableOpacity
                                            key={optionIndex}
                                            style={localStyles.optionRow}
                                            onPress={() => handleSelectOption(`other-${serviceIndex}`, optionIndex)}
                                        >
                                            <View style={[localStyles.radio, isSelected && localStyles.radioSelected]}>
                                                {isSelected && <View style={localStyles.radioInner} />}
                                            </View>
                                            <Text style={localStyles.optionSetting}>{option.name}</Text>
                                            <Text style={localStyles.optionPrice}>฿ {option.price}/{option.unit}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Additional Request */}
                <View style={localStyles.additionalSection}>
                    <Text style={localStyles.additionalTitle}>Additional Request</Text>
                    <TextInput
                        style={localStyles.additionalInput}
                        placeholder="เช่น ขอน้ำยาปรับผ้านุ่มเพิ่ม, ไม่ต้องอบแห้งมาก"
                        placeholderTextColor="#999"
                        value={additionalRequest}
                        onChangeText={setAdditionalRequest}
                        multiline
                    />
                </View>

                {/* Spacer for bottom button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add to Basket Button */}
            <View style={localStyles.bottomBar}>
                <TouchableOpacity style={localStyles.addToBasketButton}>
                    <Text style={localStyles.addToBasketText}>
                        Add to basket {calculateTotal() > 0 ? `(฿ ${calculateTotal()})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
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
    headerImage: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    shopImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1d4685',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    shopInfoContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
        color: '#333',
    },
    reviewCount: {
        fontSize: 14,
        color: '#666',
        marginLeft: 2,
    },
    deliveryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
    },
    deliveryText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    servicesSection: {
        padding: 16,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1d4685',
        marginBottom: 16,
    },
    serviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    serviceName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1d4685',
    },
    serviceGroup: {
        marginBottom: 20,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioSelected: {
        borderColor: '#1d4685',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1d4685',
    },
    optionSetting: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    optionDuration: {
        fontSize: 14,
        color: '#666',
        marginRight: 16,
    },
    optionPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        width: 50,
        textAlign: 'right',
    },
    additionalSection: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    additionalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    additionalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        minHeight: 60,
        textAlignVertical: 'top',
    },
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    addToBasketButton: {
        backgroundColor: '#1d4685',
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    addToBasketText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
