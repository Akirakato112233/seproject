import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../../context/ShopContext';

export default function ShopScreen() {
    const { shop, loading, updateShop } = useShop();

    const [isOpen, setIsOpen] = useState(shop?.status ?? true);
    const [shopName, setShopName] = useState(shop?.name ?? '');
    const [saving, setSaving] = useState(false);

    // sync local state when shop data loads/changes
    useEffect(() => {
        if (shop) {
            setIsOpen(shop.status ?? true);
            setShopName(shop.name ?? '');
        }
    }, [shop]);

    const handleToggleStatus = async (value: boolean) => {
        setIsOpen(value);
        await updateShop({ status: value });
    };

    const handleSave = async () => {
        if (!shopName.trim()) {
            Alert.alert('Error', 'กรุณากรอกชื่อร้าน');
            return;
        }
        setSaving(true);
        const ok = await updateShop({ name: shopName.trim() });
        setSaving(false);
        if (ok) {
            Alert.alert('สำเร็จ', 'บันทึกข้อมูลร้านเรียบร้อยแล้ว');
        } else {
            Alert.alert('Error', 'ไม่สามารถบันทึกข้อมูลได้');
        }
    };

    // Build a flat list of services from shop data for display
    const serviceItems: { icon: keyof typeof Ionicons.glyphMap; name: string; desc: string; price: string }[] = [];

    if (shop?.washServices?.length) {
        const minPrice = Math.min(
            ...shop.washServices.flatMap((ws) => ws.options.map((o) => o.price))
        );
        serviceItems.push({
            icon: 'water-outline',
            name: 'Wash',
            desc: `${shop.washServices.length} เครื่อง/ขนาด`,
            price: `฿${minPrice}+`,
        });
    }

    if (shop?.dryServices?.length) {
        const minPrice = Math.min(
            ...shop.dryServices.flatMap((ds) => ds.options.map((o) => o.price))
        );
        serviceItems.push({
            icon: 'sunny-outline',
            name: 'Dry',
            desc: `${shop.dryServices.length} เครื่อง/ขนาด`,
            price: `฿${minPrice}+`,
        });
    }

    if (shop?.ironingServices?.length) {
        const minPrice = Math.min(
            ...shop.ironingServices.flatMap((is) => is.options.map((o) => o.price))
        );
        serviceItems.push({
            icon: 'shirt-outline',
            name: 'Iron',
            desc: `${shop.ironingServices.length} หมวด`,
            price: `฿${minPrice}+`,
        });
    }

    if (shop?.foldingServices?.length) {
        const minPrice = Math.min(
            ...shop.foldingServices.flatMap((fs) => fs.options.map((o) => o.pricePerKg))
        );
        serviceItems.push({
            icon: 'layers-outline',
            name: 'Fold',
            desc: 'พับผ้า',
            price: `฿${minPrice}/kg+`,
        });
    }

    if (shop?.otherServices?.length) {
        const totalItems = shop.otherServices.reduce((sum, os) => sum + os.options.length, 0);
        serviceItems.push({
            icon: 'ellipsis-horizontal-outline',
            name: 'Other',
            desc: `${totalItems} รายการ`,
            price: '',
        });
    }

    if (loading) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.header}>
                    <Text style={s.title}>My Shop</Text>
                </View>
                <View style={s.loadingWrap}>
                    <ActivityIndicator size="large" color="#0E3A78" />
                    <Text style={s.loadingText}>กำลังโหลดข้อมูลร้าน...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Text style={s.title}>My Shop</Text>
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {/* Shop Status */}
                <View style={s.statusCard}>
                    <View style={s.statusLeft}>
                        <Text style={s.statusTitle}>Shop Status</Text>
                        <Text style={[s.statusValue, isOpen ? s.open : s.closed]}>
                            {isOpen ? '🟢 Open' : '🔴 Closed'}
                        </Text>
                    </View>
                    <Switch
                        value={isOpen}
                        onValueChange={handleToggleStatus}
                        trackColor={{ false: '#ccc', true: '#0E3A78' }}
                    />
                </View>

                {/* Shop Info */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Shop Information</Text>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Shop Name</Text>
                        <TextInput
                            style={s.input}
                            value={shopName}
                            onChangeText={setShopName}
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Type</Text>
                        <View style={[s.input, s.inputDisabled]}>
                            <Text style={s.inputDisabledText}>
                                {shop?.type === 'coin' ? '🪙 Coin-operated' : '🏪 Full Service'}
                            </Text>
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Rating</Text>
                        <View style={[s.input, s.inputDisabled]}>
                            <Text style={s.inputDisabledText}>
                                ⭐ {shop?.rating?.toFixed(1) ?? '-'} ({shop?.reviewCount ?? 0} reviews)
                            </Text>
                        </View>
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Delivery Fee</Text>
                        <View style={[s.input, s.inputDisabled]}>
                            <Text style={s.inputDisabledText}>
                                {shop?.deliveryFee === 0 ? 'Free' : `฿${shop?.deliveryFee ?? 0}`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Opening Hours */}
                {shop?.openingHours && shop.openingHours.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Opening Hours</Text>
                        {shop.openingHours.map((oh, i) => (
                            <View key={i} style={s.hoursRow}>
                                <Text style={s.hoursDay}>{oh.days.join(', ')}</Text>
                                <Text style={s.hoursTime}>{oh.open} - {oh.close}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Services */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Services & Pricing</Text>

                    {serviceItems.length === 0 ? (
                        <Text style={s.emptyText}>ยังไม่มีบริการ</Text>
                    ) : (
                        serviceItems.map((item, i) => (
                            <View key={i} style={s.serviceCard}>
                                <View style={s.serviceLeft}>
                                    <Ionicons name={item.icon} size={24} color="#0E3A78" />
                                    <View>
                                        <Text style={s.serviceName}>{item.name}</Text>
                                        <Text style={s.serviceDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                                {item.price ? (
                                    <Text style={s.servicePrice}>{item.price}</Text>
                                ) : null}
                            </View>
                        ))
                    )}
                </View>

                <TouchableOpacity
                    style={[s.saveBtn, saving && s.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={s.saveBtnText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        padding: 20,
        backgroundColor: '#0E3A78',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statusLeft: {
        gap: 4,
    },
    statusTitle: {
        fontSize: 14,
        color: '#666',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    open: { color: '#059669' },
    closed: { color: '#DC2626' },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#fafafa',
    },
    inputDisabled: {
        backgroundColor: '#f0f0f0',
    },
    inputDisabledText: {
        fontSize: 14,
        color: '#666',
    },
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    hoursDay: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    hoursTime: {
        fontSize: 14,
        color: '#0E3A78',
        fontWeight: '600',
    },
    serviceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    serviceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    serviceDesc: {
        fontSize: 12,
        color: '#999',
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0E3A78',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 16,
    },
    saveBtn: {
        backgroundColor: '#0E3A78',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
