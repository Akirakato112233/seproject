import { z } from 'zod';

const thaiMobileRegex = /^(06|08|09)\d{8}$/;

function formatPhoneForValidation(val: string): string {
  return val.replace(/\D/g, '');
}

export function validateThaiId(id: string): boolean {
  const digits = id.replace(/\D/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(digits[12], 10);
}

export const step1Schema = z
  .object({
    shop_name: z.string().min(1, 'กรุณากรอกชื่อร้าน'),
    phone: z
      .string()
      .min(1, 'กรุณากรอกเบอร์โทรร้าน')
      .refine(
        (v) => thaiMobileRegex.test(formatPhoneForValidation(v)),
        'เบอร์โทรต้องขึ้นต้น 06/08/09 และ 10 หลัก'
      ),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
    owner_first_name: z.string().min(1, 'กรุณากรอกชื่อ'),
    owner_last_name: z.string().min(1, 'กรุณากรอกนามสกุล'),
    owner_phone: z.string().optional(),
  })
  .refine(
    (d) => !d.owner_phone || thaiMobileRegex.test(formatPhoneForValidation(d.owner_phone)),
    { message: 'เบอร์โทรเจ้าของต้องขึ้นต้น 06/08/09', path: ['owner_phone'] }
  );

export type step1SchemaType = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  id_card_front: z.string().min(1, 'กรุณาอัปโหลดรูปบัตรประชาชนด้านหน้า'),
  id_card_back: z.string().min(1, 'กรุณาอัปโหลดรูปบัตรประชาชนด้านหลัง'),
  selfie_with_id: z.string().min(1, 'กรุณาถ่ายเซลฟี่พร้อมบัตร'),
  id_number: z
    .string()
    .min(1, 'กรุณากรอกเลขบัตรประชาชน')
    .refine(validateThaiId, 'เลขบัตรประชาชนไม่ถูกต้อง'),
  first_name: z.string().min(1, 'กรุณากรอกชื่อ'),
  last_name: z.string().min(1, 'กรุณากรอกนามสกุล'),
  date_of_birth: z.string().min(1, 'กรุณาเลือกวันเกิด'),
  address_on_card: z.string().min(1, 'กรุณากรอกที่อยู่ตามบัตร'),
});

export const step3Schema = z.object({
  business_type: z.enum(['individual', 'juristic'], { required_error: 'กรุณาเลือกประเภทธุรกิจ' }),
  tax_id: z.string().min(1, 'กรุณากรอกเลขประจำตัวผู้เสียภาษี'),
  registered_name: z.string().min(1, 'กรุณากรอกชื่อจดทะเบียน'),
  registered_address: z.string().min(1, 'กรุณากรอกที่อยู่จดทะเบียน'),
  business_document: z.string().min(1, 'กรุณาอัปโหลดเอกสารธุรกิจ'),
});

export const step4Schema = z.object({
  bank_name: z.string().optional(),
  account_number: z
    .string()
    .min(1, 'กรุณากรอกเบอร์ทรูมันนี่')
    .refine(
      (v) => thaiMobileRegex.test(formatPhoneForValidation(v)),
      'เบอร์ทรูมันนี่ต้องขึ้นต้น 06/08/09 และ 10 หลัก'
    ),
  account_name: z.string().min(1, 'กรุณากรอกชื่อผู้รับ'),
  account_type: z.enum(['savings', 'current']).optional(),
  bank_book_image: z.string().optional(),
});

export const step5Schema = z.object({
  shop_photos: z
    .array(z.string())
    .min(1, 'กรุณาอัปโหลดรูปร้านอย่างน้อย 1 รูป')
    .max(5, 'อัปโหลดได้สูงสุด 5 รูป'),
  address_line: z.string().min(1, 'กรุณากรอกที่อยู่'),
  subdistrict: z.string().min(1, 'กรุณากรอกตำบล/แขวง'),
  district: z.string().min(1, 'กรุณากรอกอำเภอ/เขต'),
  province: z.string().min(1, 'กรุณากรอกจังหวัด'),
  postal_code: z.string().regex(/^\d{5}$/, 'รหัสไปรษณีย์ 5 หลัก'),
  latitude: z.number({ required_error: 'กรุณาเลือกตำแหน่งบนแผนที่' }),
  longitude: z.number({ required_error: 'กรุณาเลือกตำแหน่งบนแผนที่' }),
  service_radius_km: z.number().min(1).max(20),
});

export const step6Schema = z.object({
  business_hours: z.array(
    z.object({
      day: z.string(),
      is_open: z.boolean(),
      open_time: z.string(),
      close_time: z.string(),
    })
  ),
});

export const step7Schema = z
  .object({
    wash_dry_fold: z.object({
      enabled: z.boolean(),
      standard_price_per_kg: z.number().optional(),
      express_price_per_kg: z.number().optional(),
      express_duration_hours: z.number().optional(),
    }),
    dry_cleaning: z.object({
      enabled: z.boolean(),
      items: z.array(z.object({ name: z.string(), price: z.number() })),
    }),
    iron_only: z.object({
      enabled: z.boolean(),
      items: z.array(z.object({ name: z.string(), price: z.number() })),
    }),
    delivery_fee_type: z.enum(['free', 'by_distance', 'fixed']),
    delivery_fixed_price: z.number().optional(),
    standard_duration_hours: z.number().min(1),
  })
  .refine(
    (d) =>
      (d.wash_dry_fold?.enabled && (d.wash_dry_fold.standard_price_per_kg ?? 0) > 0) ||
      (d.dry_cleaning?.enabled && d.dry_cleaning.items.some((i) => i.price > 0)) ||
      (d.iron_only?.enabled && d.iron_only.items.some((i) => i.price > 0)),
    { message: 'กรุณาเลือกบริการอย่างน้อย 1 รายการและกรอกราคา', path: ['wash_dry_fold'] }
  );

export function formatPhoneDisplay(val: string): string {
  const d = val.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

export function formatIdNumber(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 1) return d;
  if (d.length <= 5) return `${d[0]}-${d.slice(1)}`;
  if (d.length <= 10) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
  if (d.length <= 12) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10)}`;
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`;
}

export function formatTaxId(val: string): string {
  return formatIdNumber(val);
}
