import mongoose, { Document, Schema } from 'mongoose';

export interface ISignup extends Document {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailVerificationId?: string;
  paymentMethod?: 'truemoney' | 'cash' | 'card';
  cardLast4?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SignupSchema = new Schema<ISignup>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    emailVerificationId: { type: String, trim: true },
    paymentMethod: { type: String, enum: ['truemoney', 'cash', 'card'] },
    cardLast4: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Signup = mongoose.model<ISignup>('Signup', SignupSchema);

