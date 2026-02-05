import { Request, Response } from 'express';
import { ChatMessage } from '../models/ChatMessage';

// GET /api/chat/messages?riderId=...&shopId=...
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { riderId, shopId } = req.query;

    if (!riderId || typeof riderId !== 'string') {
      return res.status(400).json({ message: 'riderId is required' });
    }

    const filter: any = { riderId };
    if (shopId && typeof shopId === 'string') {
      filter.shopId = shopId;
    }

    const messages = await ChatMessage.find(filter).sort({ createdAt: 1 }).lean();
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/chat/messages
export const createMessage = async (req: Request, res: Response) => {
  try {
    const { riderId, shopId, sender, text } = req.body;

    console.log('📨 Received message:', { riderId, shopId, sender, text }); // Debug log

    if (!riderId || !sender || !text) {
      return res.status(400).json({ message: 'riderId, sender and text are required' });
    }

    const message = await ChatMessage.create({
      riderId,
      shopId,
      sender,
      text,
      createdAt: new Date(),
    });

    console.log('✅ Message saved:', message); // Debug log

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

