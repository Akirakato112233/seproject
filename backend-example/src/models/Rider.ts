import mongoose, { Schema, Document } from 'mongoose';

export interface IRider extends Document {
  fullName: string;
  displayName?: string;
  avatarInitial?: string;
  phone?: string;
  email?: string;
  status?: 'online' | 'offline' | 'on_delivery';
}

const RiderSchema = new Schema<IRider>(
  {
    fullName: { type: String, required: true },
    displayName: { type: String },
    avatarInitial: { type: String },
    phone: { type: String },
    email: { type: String },
    status: {
      type: String,
      enum: ['online', 'offline', 'on_delivery'],
      default: 'offline',
    },
  },
  {
    timestamps: true,
  },
);

// ใช้ชื่อ collection "ไรเดอร์" ให้ตรงกับใน MongoDB Atlas
export const Rider = mongoose.model<IRider>('Rider', RiderSchema, 'ไรเดอร์');

