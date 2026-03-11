import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>ข้อตกลง</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={s.scrollContent}>
                <Text style={s.title}>
                    ข้อตกลงการเป็นพาร์ทเนอร์ร้านซักผ้ากับ WIT แพลตฟอร์มรับ-ส่งซักผ้า
                </Text>
                <Text style={s.paragraph}>
                    ข้อตกลงฉบับนี้จัดทำขึ้นระหว่างแพลตฟอร์มรับ-ส่งซักผ้า (ต่อไปนี้เรียกว่า
                    "แพลตฟอร์ม") และร้านซักผ้าที่สมัครเข้าร่วมเป็นพาร์ทเนอร์
                    (ต่อไปนี้เรียกว่า "ร้านค้า") โดยมีเงื่อนไขและข้อกำหนดดังต่อไปนี้
                </Text>

                <Text style={s.sectionTitle}>ข้อ 1. คุณสมบัติเบื้องต้นของร้านค้า</Text>
                <Text style={s.paragraph}>
                    ร้านค้าที่ประสงค์จะเข้าร่วมเป็นพาร์ทเนอร์จะต้องมีคุณสมบัติครบถ้วน ดังนี้
                </Text>
                <Text style={s.bullet}>• มีสถานที่ประกอบการถาวร พร้อมที่อยู่ชัดเจนสามารถตรวจสอบได้</Text>
                <Text style={s.bullet}>• มีใบอนุญาตประกอบธุรกิจที่ถูกต้องตามกฎหมาย</Text>
                <Text style={s.bullet}>• มีเครื่องซักผ้า/อบผ้าที่ได้มาตรฐานและเพียงพอต่อการรับออเดอร์</Text>
                <Text style={s.bullet}>• มีพนักงานรับผิดชอบดูแลระบบแอปพลิเคชันตลอดเวลาทำการ</Text>

                <Text style={s.sectionTitle}>ข้อ 2. มาตรฐานการให้บริการ</Text>
                <Text style={s.paragraph}>
                    ร้านค้าตกลงปฏิบัติตามมาตรฐานการให้บริการของแพลตฟอร์ม ดังนี้
                </Text>
                <Text style={s.bullet}>• ต้องรับหรือปฏิเสธออเดอร์ภายใน 15 นาที หลังได้รับการแจ้งเตือนจากระบบ</Text>
                <Text style={s.bullet}>• ต้องอัปเดตสถานะงานให้เป็นปัจจุบันในระบบตลอดเวลา</Text>
                <Text style={s.bullet}>• ต้องส่งมอบผ้าให้ไรเดอร์ตรงตามเวลาที่นัดหมาย</Text>
                <Text style={s.bullet}>• มาตรฐานคุณภาพการซัก: ผ้าสะอาด ไม่มีกลิ่น ไม่เสียหาย และพับ/แขวนเรียบร้อย</Text>

                <Text style={s.sectionTitle}>ข้อ 3. โครงสร้างค่าธรรมเนียม</Text>
                <Text style={s.paragraph}>
                    ร้านค้ายอมรับโครงสร้างค่าธรรมเนียมของแพลตฟอร์ม ดังนี้
                </Text>
                <Text style={s.bullet}>• แพลตฟอร์มหักค่าคอมมิชชัน 10% ต่อออเดอร์</Text>
                <Text style={s.bullet}>• การจ่ายเงินจะโอนเข้าบัญชีร้านค้าตามที่ยื่นคำร้องแล้วจะดำเนินการให้ภายใน 3 วัน</Text>
                <Text style={s.bullet}>• ร้านค้าสามารถตั้งราคาค่าซักได้เอง</Text>

                <Text style={s.sectionTitle}>ข้อ 4. ความรับผิดชอบต่อทรัพย์สินลูกค้า</Text>
                <Text style={s.paragraph}>
                    ร้านค้ามีหน้าที่รับผิดชอบต่อทรัพย์สินของลูกค้าตามเงื่อนไข ดังนี้
                </Text>
                <Text style={s.bullet}>• ร้านค้ารับผิดชอบ 100% หากผ้าสูญหายหรือเสียหายในช่วงที่อยู่ในความดูแลของร้าน</Text>
                <Text style={s.bullet}>• ต้องมีระบบถ่ายรูปบันทึกสภาพผ้าก่อนและหลังการซัก เพื่อเป็นหลักฐาน</Text>
                <Text style={s.bullet}>• กรณีมีข้อพิพาท ร้านค้าต้องตอบสนองและชี้แจงภายใน 24 ชั่วโมง</Text>
                <Text style={s.bullet}>• แพลตฟอร์มสามารถระงับบัญชีร้านค้าชั่วคราวระหว่างการสอบสวนข้อพิพาท</Text>

                <Text style={s.sectionTitle}>ข้อ 5. การจัดการข้อมูลส่วนบุคคล (PDPA)</Text>
                <Text style={s.paragraph}>
                    ร้านค้าตกลงปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล ดังนี้
                </Text>
                <Text style={s.bullet}>• ร้านค้าจะได้รับข้อมูลลูกค้าเฉพาะที่จำเป็นสำหรับการให้บริการเท่านั้น</Text>
                <Text style={s.bullet}>• ห้ามนำข้อมูลลูกค้าไปใช้เพื่อวัตถุประสงค์อื่นนอกเหนือจากการให้บริการในแพลตฟอร์ม</Text>
                <Text style={s.bullet}>• ต้องปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 อย่างเคร่งครัด</Text>

                <Text style={s.sectionTitle}>ข้อ 6. เงื่อนไขการระงับ/ยกเลิกบัญชีร้านค้า</Text>
                <Text style={s.paragraph}>
                    แพลตฟอร์มมีสิทธิ์ระงับหรือยกเลิกบัญชีร้านค้าได้ทันที หากพบว่า
                </Text>
                <Text style={s.bullet}>• มีอัตราการยกเลิกออเดอร์เกินกว่าที่แพลตฟอร์มกำหนดต่อเดือน</Text>
                <Text style={s.bullet}>• มีการทุจริต หรือกระทำการใดที่ละเมิดข้อตกลงฉบับนี้</Text>
                <Text style={s.bullet}>• ไม่ปฏิบัติตามมาตรฐานการให้บริการที่แพลตฟอร์มกำหนด</Text>

                <Text style={s.sectionTitle}>ข้อ 7. การแก้ไขข้อตกลง</Text>
                <Text style={s.paragraph}>
                    การแก้ไขหรือเปลี่ยนแปลงข้อตกลงฉบับนี้จะเป็นไปตามเงื่อนไข ดังนี้
                </Text>
                <Text style={s.bullet}>• แพลตฟอร์มจะแจ้งให้ร้านค้าทราบล่วงหน้าอย่างน้อย 30 วัน ก่อนมีการเปลี่ยนแปลงใดๆ</Text>
                <Text style={s.bullet}>• ร้านค้ามีสิทธิ์บอกเลิกสัญญาได้ หากไม่ยินยอมรับการเปลี่ยนแปลงดังกล่าว โดยแจ้งเป็นลายลักษณ์อักษร</Text>

                <Text style={s.sectionTitle}>ข้อ 8. ขั้นตอนการสมัครเข้าร่วมเป็นพาร์ทเนอร์</Text>
                <Text style={s.paragraph}>
                    ร้านค้าที่ประสงค์จะสมัครเข้าร่วมต้องดำเนินการตามขั้นตอน ดังนี้
                </Text>
                <Text style={s.bullet}>1. ยอมรับข้อตกลงและเงื่อนไขฉบับนี้ผ่านระบบออนไลน์</Text>
                <Text style={s.bullet}>2. อัปโหลดเอกสารประกอบการสมัคร ได้แก่ สำเนาบัตรประชาชนผู้ประกอบการ, ทะเบียนพาณิชย์/ใบอนุญาตประกอบการ, รูปถ่ายร้านและอุปกรณ์, และเลขบัญชีธนาคาร</Text>
                <Text style={s.bullet}>3. รอการตรวจสอบและอนุมัติจากแพลตฟอร์มภายใน 3–5 วันทำการ</Text>
                <Text style={s.bullet}>4. เมื่อได้รับการอนุมัติ ร้านค้าสามารถเปิดรับออเดอร์ผ่านแพลตฟอร์มได้ทันที</Text>

                <View style={s.footerBox}>
                    <Text style={s.footerText}>การยอมรับข้อตกลง</Text>
                    <Text style={s.paragraph}>
                        การที่ร้านค้ากด "ยอมรับข้อตกลง" หรือเริ่มใช้งานแพลตฟอร์ม ถือว่าร้านค้าได้อ่าน ทำความเข้าใจ และยอมรับเงื่อนไขทั้งหมดในข้อตกลงฉบับนี้แล้ว
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
        marginTop: 20,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        marginBottom: 10,
    },
    bullet: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        marginLeft: 10,
        marginBottom: 6,
    },
    footerBox: {
        marginTop: 30,
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
});
