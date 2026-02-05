import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShopScreen() {
    const [isOpen, setIsOpen] = useState(true);
    const [shopName, setShopName] = useState('WashPro Laundry');
    const [address, setAddress] = useState('123 Main Street, Bangkok');
    const [phone, setPhone] = useState('02-123-4567');

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
                        onValueChange={setIsOpen}
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
                        <Text style={s.label}>Address</Text>
                        <TextInput
                            style={[s.input, s.inputMultiline]}
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Phone</Text>
                        <TextInput
                            style={s.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Services */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Services & Pricing</Text>

                    <View style={s.serviceCard}>
                        <View style={s.serviceLeft}>
                            <Ionicons name="water-outline" size={24} color="#0E3A78" />
                            <View>
                                <Text style={s.serviceName}>Wash</Text>
                                <Text style={s.serviceDesc}>Regular wash service</Text>
                            </View>
                        </View>
                        <Text style={s.servicePrice}>฿50/kg</Text>
                    </View>

                    <View style={s.serviceCard}>
                        <View style={s.serviceLeft}>
                            <Ionicons name="sunny-outline" size={24} color="#0E3A78" />
                            <View>
                                <Text style={s.serviceName}>Dry</Text>
                                <Text style={s.serviceDesc}>Machine dry</Text>
                            </View>
                        </View>
                        <Text style={s.servicePrice}>฿30/kg</Text>
                    </View>

                    <View style={s.serviceCard}>
                        <View style={s.serviceLeft}>
                            <Ionicons name="shirt-outline" size={24} color="#0E3A78" />
                            <View>
                                <Text style={s.serviceName}>Iron</Text>
                                <Text style={s.serviceDesc}>Professional ironing</Text>
                            </View>
                        </View>
                        <Text style={s.servicePrice}>฿20/piece</Text>
                    </View>
                </View>

                <TouchableOpacity style={s.saveBtn}>
                    <Text style={s.saveBtnText}>Save Changes</Text>
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
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
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
    saveBtn: {
        backgroundColor: '#0E3A78',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
