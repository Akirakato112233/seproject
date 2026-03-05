import mongoose, { Schema, Document } from 'mongoose';

export interface IRider extends Document {
  firstName: string;
  lastName: string;
  fullName: string;
  displayName?: string;
  avatarInitial?: string;
  phone?: string;
  countryCode?: string;
  city?: string;
  email?: string;
  balance?: number;
  status?: 'online' | 'offline' | 'on_delivery';
}

const RiderSchema = new Schema<IRider>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    displayName: { type: String },
    avatarInitial: { type: String },
    phone: { type: String },
    countryCode: { type: String, default: '+66' },
    city: { type: String },
    email: { type: String },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['online', 'offline', 'on_delivery'],
      default: 'offline',
    },
  },
  {
    timestamps: true,
  }
);

// ใช้ชื่อ collection "ไรเดอร์" ให้ตรงกับใน MongoDB Atlas
export const Rider = mongoose.model<IRider>('Rider', RiderSchema, 'ไรเดอร์');
