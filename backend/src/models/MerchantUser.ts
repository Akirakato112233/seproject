import mongoose, { Document, Schema } from 'mongoose';

export interface IMerchantUser extends Document {
  googleSub: string;
  email: string;
  displayName: string;
  phone: string;
  address?: string;
  picture?: string;
  businessType?: 'full' | 'coin'; // full service หรือ coin-operated
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantUserSchema = new Schema<IMerchantUser>(
  {
    googleSub: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    picture: { type: String },
    businessType: { type: String, enum: ['full', 'coin'] },
    isOnboarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MerchantUser = mongoose.model<IMerchantUser>(
  'MerchantUser',
  MerchantUserSchema,
  'merchant-user'
);
