import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useSignup } from '../../context/SignupContext';

const STEPS = [
    {
        title: 'Are you interested in registering as a driver partner with Wit?',
        requirements: null,
    },
    {
        title: 'Do you meet all the required qualifications?',
        requirements: [
            'Aged 18 years or above and not over 70 years old',
            'Thai nationality',
            'A valid (non-expired) driving license',
        ],
    },
    {
        title: 'Does your vehicle meet the required criteria?',
        requirements: ['The vehicle used for registration must be less than 10 years old.'],
    },
];

export default function CarQualificationScreen() {
    const router = useRouter();
    const { setDevMode } = useAuth();
    const { setField } = useSignup();

    const [step, setStep] = useState(0);
    // เก็บ answers: null = ยังไม่ตอบ, true = Yes, false = No
    const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null]);
    const [showInfo, setShowInfo] = useState(false);
    const [firstNoStep, setFirstNoStep] = useState(0);

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const handleAnswer = (answer: boolean) => {
        const newAnswers = [...answers];
        newAnswers[step] = answer;
        setAnswers(newAnswers);

        if (isLast) {
            // ตอบครบแล้ว — ตรวจสอบว่ามี No ไหม
            const firstNo = newAnswers.findIndex((a) => a === false);
            if (firstNo !== -1) {
                // มี No อย่างน้อย 1 ข้อ → แสดงหน้า Before you sign up
                setFirstNoStep(firstNo);
                setShowInfo(true);
            } else {
                // ทุกข้อ Yes → บันทึก vehicleType แล้วไปหน้า selfie guide
                setField('vehicleType', 'car');
                router.push({
                    pathname: '/signup/selfie-guide' as any,
                    params: { vehicleType: 'car' },
                });
            }
        } else {
            setStep(step + 1);
        }
    };

    const handleProceed = () => {
        // กลับไปหน้า step ที่กด No เพื่อแก้ไข
        setAnswers([null, null, null]);
        setStep(firstNoStep);
        setShowInfo(false);
    };

    // ---------- Before you sign up ----------
    if (showInfo) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 16 }}>
                    <Text style={s.infoTitle}>Before you sign up</Text>
                    <Text style={s.infoSubtitle}>
                        For everyone's safety, you need to meet all of our requirements and have the
                        relevant documents
                    </Text>

                    <View style={s.divider} />

                    <View style={s.infoSection}>
                        <Text style={s.sectionTitle}>Steps to register as a driver partner</Text>
                        <Text style={s.sectionBody}>
                            Thank you for your interest. If you would like to register, you can sign
                            up through the Wit Driver application
                        </Text>
                    </View>

                    <View style={s.divider} />

                    <View style={s.infoSection}>
                        <Text style={s.sectionTitle}>Applicant qualifications</Text>
                        <Text style={s.sectionBody}>
                            If you are under 18 years old, you are currently not eligible to
                            register as a driver partner.
                        </Text>
                    </View>

                    <View style={s.divider} />

                    <View style={s.infoSection}>
                        <Text style={s.sectionTitle}>Vehicle age requirement</Text>
                        <Text style={s.sectionBody}>
                            The vehicle used for registration must be less than 10 years old, in
                            accordance with regulations for ride-hailing vehicles.
                        </Text>
                    </View>
                </ScrollView>

                <TouchableOpacity style={s.proceedBanner} onPress={handleProceed}>
                    <View style={s.proceedIcon}>
                        <Text style={{ fontSize: 22 }}>✅</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.proceedQuestion}>
                            Do you have all the requirements above?
                        </Text>
                        <Text style={s.proceedLink}>Click here to proceed</Text>
                    </View>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ---------- Step screens ----------
    return (
        <SafeAreaView style={s.safe}>
            <View style={s.body}>
                <Text style={s.title}>{current.title}</Text>

                {current.requirements && (
                    <View style={s.reqBox}>
                        {current.requirements.map((req, i) => (
                            <View key={i} style={s.reqRow}>
                                <Text style={s.bullet}>•</Text>
                                <Text style={s.reqText}>{req}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={s.footer}>
                <TouchableOpacity style={s.btn} onPress={() => handleAnswer(false)}>
                    <Text style={s.btnText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btn} onPress={() => handleAnswer(true)}>
                    <Text style={s.btnText}>Yes</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },

    // Step
    title: { fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 32, marginBottom: 28 },
    reqBox: {
        backgroundColor: '#E8EAF0',
        borderWidth: 1,
        borderColor: '#B0B8CC',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    reqRow: { flexDirection: 'row', gap: 8 },
    bullet: { fontSize: 14, color: '#334155', lineHeight: 22 },
    reqText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 22 },
    footer: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 24,
        paddingBottom: 36,
        paddingTop: 12,
    },
    btn: {
        flex: 1,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#506B8F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Before you sign up
    infoTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
    infoSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
    infoSection: { gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    sectionBody: { fontSize: 14, color: '#334155', lineHeight: 22 },

    // Proceed
    proceedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 24,
        paddingVertical: 18,
        backgroundColor: '#fff',
    },
    proceedIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    proceedQuestion: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    proceedLink: { fontSize: 13, color: '#2563EB', marginTop: 2 },
});
