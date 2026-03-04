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
    const { riderId, shopId, sender, text, imageUrl } = req.body;

    console.log('📨 Received message:', { riderId, shopId, sender, text: text?.slice(0, 50), hasImage: !!imageUrl });

    if (!riderId || !sender) {
      return res.status(400).json({ message: 'riderId and sender are required' });
    }

    if (!text && !imageUrl) {
      return res.status(400).json({ message: 'text or imageUrl is required' });
    }

    const message = await ChatMessage.create({
      riderId,
      shopId,
      sender,
      text: text || '',
      imageUrl,
      createdAt: new Date(),
    });

    console.log('✅ Message saved:', message._id);

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/chat/upload — upload image for chat
export const uploadChatImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Build URL path to the uploaded file
    const imageUrl = `/uploads/chat/${req.file.filename}`;
    console.log('📷 Chat image uploaded:', imageUrl);

    return res.status(201).json({ imageUrl });
  } catch (error) {
    console.error('Error uploading chat image:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
