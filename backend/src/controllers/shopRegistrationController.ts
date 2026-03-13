import { Request, Response } from 'express';
import { ShopRegistration } from '../models/ShopRegistration';
import { Shop } from '../models/Shop';
import { MerchantUser } from '../models/MerchantUser';
import { buildShopFromRegistration } from '../services/shopMapping';

const REGISTRATION_FIELDS = {
  merchantUserId: 1,
  status: 1,
  shop_name: 1,
  phone: 1,
  email: 1,
  owner_first_name: 1,
  owner_last_name: 1,
  owner_phone: 1,
  id_card_front: 1,
  id_card_back: 1,
  selfie_with_id: 1,
  id_number: 1,
  first_name: 1,
  last_name: 1,
  date_of_birth: 1,
  address_on_card: 1,
  business_type: 1,
  tax_id: 1,
  registered_name: 1,
  registered_address: 1,
  business_document: 1,
  bank_name: 1,
  account_number: 1,
  account_name: 1,
  account_type: 1,
  bank_book_image: 1,
  logo: 1,
  shop_photos: 1,
  address_line: 1,
  subdistrict: 1,
  district: 1,
  province: 1,
  postal_code: 1,
  latitude: 1,
  longitude: 1,
  service_radius_km: 1,
  capacity_per_day: 1,
  business_hours: 1,
  cut_off_time: 1,
  wash_dry_fold: 1,
  dry_cleaning: 1,
  iron_only: 1,
  delivery_fee_type: 1,
  delivery_fixed_price: 1,
  standard_duration_hours: 1,
  service_categories: 1,
  businessType: 1,
} as const;

function buildUpdatePayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = { merchantUserId: body.merchantUserId };
  for (const key of Object.keys(REGISTRATION_FIELDS)) {
    if (key === 'merchantUserId') continue;
    if (body[key] !== undefined && body[key] !== null) {
      payload[key] = body[key];
    }
  }
  if (!payload.status) payload.status = 'pending';
  return payload;
}

/**
 * POST /api/shops/register
 * บันทึก/อัปเดตข้อมูลสมัครร้านใน collection shop-registrations ตาม merchantUserId
 * ไม่สร้าง/อัปเดตร้านจริง (Shop) ที่ใช้ในระบบจนกว่าจะมีการกด \"เปิดรับออเดอร์เลย!\"
 */
export const registerShop = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const merchantUserId = body.merchantUserId;
    if (!merchantUserId) {
      console.error('Shop register: Missing merchantUserId');
      return res.status(400).json({ success: false, message: 'Missing merchantUserId' });
    }

    const updatePayload = buildUpdatePayload(body);

    const reg = await ShopRegistration.findOneAndUpdate(
      { merchantUserId: String(merchantUserId) },
      { $set: updatePayload },
      { new: true, upsert: true }
    );

    console.log('Shop register: Saved step data, id:', reg._id);
    return res.status(200).json({
      success: true,
      message: 'Registration saved',
      registrationId: reg._id,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Shop registration error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Registration failed',
    });
  }
};

/**
 * POST /api/shops/publish
 * ใช้ตอนกดปุ่ม \"เปิดรับออเดอร์เลย!\" เพื่อสร้าง/อัปเดตร้านจริงใน collection Shop
 * จากข้อมูลล่าสุดใน shop-registrations ตาม merchantUserId
 */
export const publishShop = async (req: Request, res: Response) => {
  try {
    const { merchantUserId } = req.body;
    if (!merchantUserId) {
      return res.status(400).json({ success: false, message: 'Missing merchantUserId' });
    }

    const reg = await ShopRegistration.findOne({ merchantUserId: String(merchantUserId) });
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const shopData = buildShopFromRegistration(reg);
    const shop = await Shop.findOneAndUpdate(
      { merchantUserId: String(merchantUserId) },
      { $set: shopData },
      { new: true, upsert: true }
    );

    // sync address จาก ShopRegistration ไป MerchantUser (ให้ Edit Account แสดงได้)
    const addressFromReg = (reg as any).address_line;
    if (addressFromReg && typeof addressFromReg === 'string') {
      const parts: string[] = [addressFromReg];
      if ((reg as any).subdistrict) parts.push(String((reg as any).subdistrict));
      if ((reg as any).district) parts.push(String((reg as any).district));
      if ((reg as any).province) parts.push(String((reg as any).province));
      if ((reg as any).postal_code) parts.push(String((reg as any).postal_code));
      const fullAddress = parts.join(', ');
      await MerchantUser.findByIdAndUpdate(merchantUserId, {
        $set: { address: fullAddress },
      });
    }

    return res.status(200).json({
      success: true,
      shop,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Publish shop error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Publish failed',
    });
  }
};
