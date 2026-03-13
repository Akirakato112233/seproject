/**
 * ประวัติการขอถอนเงิน (WIT Wallet → Truemoney)
 * เก็บเบอร์โทร จำนวนเงิน และสถานะว่าถอนสำเร็จหรือยัง
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawalRequest extends Document {
  shopId: string;
  phone: string; // เบอร์โทร TrueMoney ที่ขอถอน
  amount: number;
  /** true = ถอนสำเร็จ, false = รอดำเนินการ/ยังไม่สำเร็จ */
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const WithdrawalRequestSchema: Schema = new Schema(
  {
    shopId: { type: String, required: true },
    phone: { type: String, default: '' },
    amount: { type: Number, required: true },
    status: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>(
  'WithdrawalRequest',
  WithdrawalRequestSchema,
  'withdrawal_requests'
);
