import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const TERMS_CONTENT: Record<
    string,
    { title: string; sections: { title: string; bullets: string[] }[] }
> = {
    privacy: {
        title: "WIT's Privacy Notice",
        sections: [
            {
                title: 'Data Collected',
                bullets: [
                    'Name, phone number, email',
                    'GPS location',
                    'Device information',
                    'Payment details',
                ],
            },
            {
                title: 'Purpose of Use',
                bullets: [
                    'To provide services (matching riders with customers)',
                    'Process payments',
                    'Maintain security',
                    'Improve services',
                ],
            },
            {
                title: 'Data Sharing',
                bullets: [
                    'Clearly states which data is shared and with whom',
                    'Example: sharing the customer\'s name and phone number with the rider for delivery contact',
                ],
            },
            {
                title: 'User Rights',
                bullets: [
                    'The right to request access to personal data',
                    'The right to request modification of personal data',
                    'The right to request deletion of personal data from the system',
                ],
            },
        ],
    },
    termsTransport: {
        title: 'Terms of Service: WIT Transport, Delivery and Logistics',
        sections: [
            {
                title: 'Scope of Service',
                bullets: [
                    'Vehicle types allowed',
                    'Allowed parcel sizes',
                    'Service areas',
                ],
            },
            {
                title: 'Pricing Structure and Payment',
                bullets: [
                    'Fare calculation (including Surge Pricing)',
                    'Cancellation fees',
                ],
            },
            {
                title: 'Prohibitions and Illegal Items',
                bullets: [
                    'Drugs',
                    'Weapons',
                    'Living animals',
                    'Hazardous materials',
                    'Clearly specifies what cannot be transported',
                ],
            },
            {
                title: 'Liability and Compensation',
                bullets: [
                    'The platform\'s liability limits in case of damaged or lost goods during delivery',
                    'Maximum compensation up to 2,000 THB',
                ],
            },
        ],
    },
    termsPayments: {
        title: 'Terms of Service: WIT Payments and Rewards',
        sections: [
            {
                title: 'Payment Channels',
                bullets: [
                    'Linking credit/debit cards',
                    'Topping up the E-Wallet',
                ],
            },
            {
                title: 'Refund Policy',
                bullets: [
                    'Conditions for receiving a refund (e.g., rider no-show, damaged goods)',
                    'Processing timeframe',
                ],
            },
            {
                title: 'Points and Rewards System',
                bullets: [
                    'How to earn points',
                    'Point expiration dates',
                    'The platform\'s right to claw back points in cases of fraud',
                ],
            },
            {
                title: 'Fraud Prevention',
                bullets: [
                    'Account suspension if attempts to exploit promotional loopholes are detected',
                ],
            },
        ],
    },
    termsFamily: {
        title: 'Terms of Service for Family Account',
        sections: [
            {
                title: 'Member Eligibility',
                bullets: [
                    'Minimum age requirements for family members to use the service independently',
                ],
            },
            {
                title: 'Payment Responsibility',
                bullets: [
                    'The admin or primary account holder is responsible for all expenses incurred by members of the family account',
                ],
            },
            {
                title: 'Trip Tracking',
                bullets: [
                    'The admin\'s right to view the trip status or real-time location of family members for safety purposes',
                ],
            },
            {
                title: 'Account Management',
                bullets: [
                    'Adding or removing members from the family group',
                ],
            },
        ],
    },
    codeOfConduct: {
        title: 'WIT Code of Business Conduct',
        sections: [
            {
                title: 'Respectful Treatment',
                bullets: [
                    'Prohibition of vulgar language',
                    'Prohibition of sexual harassment',
                    'Prohibition of discrimination of any kind',
                ],
            },
            {
                title: 'Physical Safety',
                bullets: [
                    'Regulations regarding seatbelts',
                    'Helmet usage requirements',
                    'Forbidding customers from pressuring riders to speed or break traffic laws',
                ],
            },
            {
                title: 'Consequences of Violation',
                bullets: [
                    'If the code of conduct is breached, the platform reserves the right to suspend or permanently terminate the user\'s account without prior notice',
                ],
            },
        ],
    },
};

export default function TermsDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const content = id ? TERMS_CONTENT[id] : null;

    if (!content) {
        return (
            <SafeAreaView style={s.safeArea} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Terms Detail</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={s.errorContainer}>
                    <Text style={s.errorText}>Document not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safeArea} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>
                    {content.title}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator
            >
                <Text style={s.mainTitle}>{content.title}</Text>

                {content.sections.map((section, idx) => (
                    <View key={idx} style={s.section}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        {section.bullets.map((bullet, i) => (
                            <Text key={i} style={s.bullet}>
                                • {bullet}
                            </Text>
                        ))}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1 },
    backBtn: { padding: 4 },
    scroll: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 20, paddingBottom: 40 },
    mainTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 24,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 10,
    },
    bullet: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
        marginBottom: 6,
        paddingLeft: 4,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#64748B',
    },
});
