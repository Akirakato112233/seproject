// backend-example/src/models/User.ts
//ยอดเงินของผู้ใช้
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  balance: number;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0.00 }, // นี่คือตัวเลขที่จะโชว์บนแอป
});

export const User = mongoose.model<IUser>('User', UserSchema);