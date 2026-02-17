import mongoose, { Schema, Document } from 'mongoose';

// Wash Service Options
export interface IWashServiceOption {
  setting: string; // 'Cold', 'Warm water ≈ 40°', 'Hot water ≈ 60°'
  duration: number; // minutes
  price: number; // Thai Baht
}

export interface IWashService {
  weight: number; // kg (9, 14, 18)
  options: IWashServiceOption[];
}

// Dry Service Options
export interface IDryServiceOption {
  setting: string; // 'Low Heat 30°-40° C', 'Medium Heat 50°-60° C', 'High Heat 60°-70° C'
  duration: number; // minutes
  price: number; // Thai Baht
}

export interface IDryService {
  weight: number; // kg (15, 25)
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
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 1-4
  type: 'coin' | 'full';
  deliveryFee: number;
  deliveryTime: number; // minutes
  balance?: number; // ยอดเงินคงเหลือ (บาท) เก็บเป็น integer
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

const WashServiceOptionSchema = new Schema({
  setting: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const WashServiceSchema = new Schema({
  weight: { type: Number, required: true },
  options: [WashServiceOptionSchema],
}, { _id: false });

const DryServiceOptionSchema = new Schema({
  setting: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const DryServiceSchema = new Schema({
  weight: { type: Number, required: true },
  options: [DryServiceOptionSchema],
}, { _id: false });

// Ironing Service Schemas
const IroningServiceOptionSchema = new Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const IroningServiceSchema = new Schema({
  category: { type: String, required: true },
  options: [IroningServiceOptionSchema],
}, { _id: false });

// Folding Service Schemas
const FoldingServiceOptionSchema = new Schema({
  type: { type: String, required: true },
  pricePerKg: { type: Number, required: true },
}, { _id: false });

const FoldingServiceSchema = new Schema({
  options: [FoldingServiceOptionSchema],
}, { _id: false });

// Other Service Schemas
const OtherServiceOptionSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
}, { _id: false });

const OtherServiceSchema = new Schema({
  category: { type: String, required: true },
  defaultUnit: { type: String },
  options: [OtherServiceOptionSchema],
}, { _id: false });

const ShopSchema = new Schema<IShop>({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  priceLevel: { type: Number, required: true, min: 1, max: 4 },
  type: { type: String, enum: ['coin', 'full'], required: true },
  deliveryFee: { type: Number, required: true },
  deliveryTime: { type: Number, required: true },
  balance: { type: Number, default: 0 },
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
}, {
  timestamps: true, // เพิ่ม createdAt, updatedAt อัตโนมัติ
});

// ใช้ collection name "ร้านซักผ้า" ที่มีอยู่ใน MongoDB Atlas
// ถ้าต้องการใช้ชื่ออื่น แก้ไข parameter ที่ 3
export const Shop = mongoose.model<IShop>('Shop', ShopSchema, 'ร้านซักผ้า');
