import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  code: string;
  amount: number;
  sender: string;
  status: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  code: { type: String, required: true },
  amount: { type: Number, required: true },
  sender: { type: String },
  status: { type: String, default: 'success' },
  createdAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);