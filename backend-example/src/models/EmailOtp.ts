import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailOtp extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const EmailOtpSchema = new Schema<IEmailOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: expire documents automatically when expiresAt passes
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailOtp = mongoose.model<IEmailOtp>('EmailOtp', EmailOtpSchema);

