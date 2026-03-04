/**
 * User model – customer (and optionally rider/merchant) document.
 * Fields: email, displayName, phone (10 digits starting with 0 in app), profilePhoto (URL from Supabase),
 * address, balance, role, Google auth fields, isOnboarded, location (lat, lon, locationName).
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  phone: string;
  address: string;
  balance: number;
  role: 'user' | 'rider' | 'merchant';
  googleId?: string;
  googleSub?: string;
  isOnboarded: boolean;
  profilePhoto?: string;
  lat?: number;
  lon?: number;
  locationName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    balance: { type: Number, default: 0.0 },
    role: { type: String, enum: ['user', 'rider', 'merchant'], default: 'user' },
    googleId: { type: String },
    googleSub: { type: String, index: true, unique: true, sparse: true },
    isOnboarded: { type: Boolean, default: false },
    profilePhoto: { type: String, default: '' },
    lat: { type: Number },
    lon: { type: Number },
    locationName: { type: String },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
