import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  riderId: string;
  shopId?: string;
  sender: 'user' | 'rider';
  text: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    riderId: { type: String, required: true },
    shopId: { type: String },
    sender: { type: String, enum: ['user', 'rider'], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema, 'chats');

