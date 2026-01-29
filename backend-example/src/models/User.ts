// backend-example/src/models/User.ts
// ข้อมูลผู้ใช้ รวมถึง Google Auth
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  phone: string;
  address: string;
  balance: number;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  displayName: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  balance: { type: Number, default: 0.00 },
  googleId: { type: String },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

export const User = mongoose.model<IUser>('User', UserSchema);