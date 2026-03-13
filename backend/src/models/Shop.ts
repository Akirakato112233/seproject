import mongoose, { Schema, Document } from 'mongoose';

// Wash Service Options
export interface IWashServiceOption {
  setting: string; // 'Cold', 'Warm water ≈ 40°', 'Hot water ≈ 60°'
  duration: number; // minutes
  price: number; // Thai Baht
}

export interface IWashService {
  machineId?: string; // รหัสเครื่อง (WASH-01, WASH-02)
  weight: number; // kg (9, 14, 18)
  status?: 'available' | 'busy' | 'ready' | 'offline'; // ready = ซักเสร็จ รอไรเดอร์มารับ, offline = ปิดไม่พร้อมใช้งาน
  finishTime?: Date | null;
  options: IWashServiceOption[];
}

// Dry Service Options
export interface IDryServiceOption {
  setting: string; // 'Low Heat 30°-40° C', 'Medium Heat 50°-60° C', 'High Heat 60°-70° C'
  duration: number; // minutes
  price: number; // Thai Baht
}

export interface IDryService {
  machineId?: string; // รหัสเครื่อง (DRY-01, DRY-02)
  weight: number; // kg (15, 25)
  status?: 'available' | 'busy' | 'ready' | 'offline'; // ready = อบเสร็จ รอไรเดอร์มารับ, offline = ปิดไม่พร้อมใช้งาน
  finishTime?: Date | null;
  options: IDryServiceOption[];
}

// Ironing Service Options (รีดผ้า)
export interface IIroningServiceOption {
  type: string; // 'เสื้อเชิ้ต', 'กางเกง', 'ชุดสูท', etc.
  price: number; // Thai Baht per piece
}

export interface IIroningService {
  category: string; // 'ชุดทำงาน', 'ชุดลำลอง', 'ชุดพิเศษ'
  options: IIroningServiceOption[];
}

// Folding Service Options (ผับผ้า)
export interface IFoldingServiceOption {
  type: string; // 'พับธรรมดา', 'พับพิเศษ', etc.
  pricePerKg: number; // Thai Baht per kg
}

export interface IFoldingService {
  options: IFoldingServiceOption[];
}

// Other Service Options (บริการอื่นๆ)
export interface IOtherServiceOption {
  name: string; // 'ซักแห้ง', 'ซักผ้าม่าน', 'ซักพรม', etc.
  price: number; // Thai Baht
  unit: string; // 'ชิ้น', 'kg', 'ตร.ม.'
}

export interface IOtherService {
  category: string; // 'ซักพิเศษ', 'บริการเสริม'
  defaultUnit?: string; // หน่วยเริ่มต้นสำหรับ item ใหม่ (ชิ้น, กก., ตร.ม., etc.)
  options: IOtherServiceOption[];
}

export interface IShop extends Document {
  merchantUserId?: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 1-4
  type: 'coin' | 'full';
  deliveryFee: number;
  deliveryTime: number; // minutes
  balance?: number; // ยอดเงินคงเหลือ (บาท) เก็บเป็น integer
  todayRevenue?: number; // รายได้วันนี้จากเครื่องหยอดเหรียญ (บาท)
  todayRevenueDate?: string; // วันที่ของ todayRevenue (YYYY-MM-DD) เพื่อ reset เมื่อเปลี่ยนวัน
  status?: boolean; // ร้านเปิดรับออเดอร์ true / ปิด false
  openingHours?: { days: string[]; open: string; close: string }[]; // ชื่อวัน: จันทร์, อังคาร, ..., อาทิตย์, HH:mm
  imageUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  washServices?: IWashService[];
  dryServices?: IDryService[];
  ironingServices?: IIroningService[];
  foldingServices?: IFoldingService[];
  otherServices?: IOtherService[];
}

const WashServiceOptionSchema = new Schema(
  {
    setting: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const WashServiceSchema = new Schema(
  {
    machineId: { type: String },
    weight: { type: Number, required: true },
    status: { type: String, enum: ['available', 'busy', 'ready', 'offline'], default: 'available' },
    finishTime: { type: Date, default: null },
    options: [WashServiceOptionSchema],
  },
  { _id: false }
);

const DryServiceOptionSchema = new Schema(
  {
    setting: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const DryServiceSchema = new Schema(
  {
    machineId: { type: String },
    weight: { type: Number, required: true },
    status: { type: String, enum: ['available', 'busy', 'ready', 'offline'], default: 'available' },
    finishTime: { type: Date, default: null },
    options: [DryServiceOptionSchema],
  },
  { _id: false }
);

// Ironing Service Schemas
const IroningServiceOptionSchema = new Schema(
  {
    type: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const IroningServiceSchema = new Schema(
  {
    category: { type: String, required: true },
    options: [IroningServiceOptionSchema],
  },
  { _id: false }
);

// Folding Service Schemas
const FoldingServiceOptionSchema = new Schema(
  {
    type: { type: String, required: true },
    pricePerKg: { type: Number, required: true },
  },
  { _id: false }
);

const FoldingServiceSchema = new Schema(
  {
    options: [FoldingServiceOptionSchema],
  },
  { _id: false }
);

// Other Service Schemas
const OtherServiceOptionSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const OtherServiceSchema = new Schema(
  {
    category: { type: String, required: true },
    defaultUnit: { type: String },
    options: [OtherServiceOptionSchema],
  },
  { _id: false }
);

const OpeningHoursItemSchema = new Schema(
  {
    days: [String],
    open: { type: String },
    close: { type: String },
  },
  { _id: false }
);

const ShopSchema = new Schema<IShop>(
  {
    merchantUserId: { type: String },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    priceLevel: { type: Number, required: true, min: 1, max: 4 },
    type: { type: String, enum: ['coin', 'full'], required: true },
    deliveryFee: { type: Number, required: true },
    deliveryTime: { type: Number, required: true },
    balance: { type: Number, default: 0 },
    todayRevenue: { type: Number, default: 0 },
    todayRevenueDate: { type: String },
    status: { type: Boolean, default: true },
    openingHours: { type: [OpeningHoursItemSchema], default: [] },
    imageUrl: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    washServices: [WashServiceSchema],
    dryServices: [DryServiceSchema],
    ironingServices: [IroningServiceSchema],
    foldingServices: [FoldingServiceSchema],
    otherServices: [OtherServiceSchema],
  },
  {
    timestamps: true, // เพิ่ม createdAt, updatedAt อัตโนมัติ
  }
);

// ใช้ collection name "ร้านซักผ้า" ที่มีอยู่ใน MongoDB Atlas
// ถ้าต้องการใช้ชื่ออื่น แก้ไข parameter ที่ 3
export const Shop = mongoose.model<IShop>('Shop', ShopSchema, 'ร้านซักผ้า');

/**
 * คำนวณ priceLevel (1-4) จากราคาบริการของร้านอัตโนมัติ
 * ใช้ราคาต่ำสุดของ washServices (9kg Cold wash) เป็นตัวแทน
 *
 * Logic:
 *   ราคาเฉลี่ย < 40฿   → 1 ($)    ถูกมาก
 *   ราคาเฉลี่ย < 70฿   → 2 ($$)   ปานกลาง
 *   ราคาเฉลี่ย < 120฿  → 3 ($$$)  แพง
 *   ราคาเฉลี่ย >= 120฿ → 4 ($$$$) แพงมาก
 */
export function calculatePriceLevel(shop: Partial<IShop>): number {
  const allPrices: number[] = [];

  // รวบรวมราคาจาก washServices
  if (shop.washServices?.length) {
    for (const service of shop.washServices) {
      for (const opt of service.options) {
        allPrices.push(opt.price);
      }
    }
  }

  // รวบรวมราคาจาก dryServices
  if (shop.dryServices?.length) {
    for (const service of shop.dryServices) {
      for (const opt of service.options) {
        allPrices.push(opt.price);
      }
    }
  }

  // ถ้าไม่มีราคาเลย คืนค่า 1
  if (allPrices.length === 0) return 1;

  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

  if (avgPrice < 40) return 1;
  if (avgPrice < 70) return 2;
  if (avgPrice < 120) return 3;
  return 4;
}
