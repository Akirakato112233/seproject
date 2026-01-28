// backend-example/src/models/User.ts
//ยอดเงินของผู้ใช้
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  displayName: string;
  address: string;
  balance: number;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String, default: '' },  // ชื่อที่แสดง เช่น "Bakugoa ku"
  address: { type: String, default: '' },      // ที่อยู่ เช่น "The One Place Sriracha (ร้า พอม)"
  balance: { type: Number, default: 0.00 },    // ยอดเงิน wallet
});

export const User = mongoose.model<IUser>('User', UserSchema);