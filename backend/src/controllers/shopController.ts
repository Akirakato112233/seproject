import { Request, Response } from 'express';
import { Shop } from '../models/Shop';

export const getShops = async (req: Request, res: Response) => {
  try {
    const {
      type,
      rating,
      price,
      delivery,
      nearMe,
      promo,
      open,
    } = req.query;

    // สร้าง query object
    const query: any = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by rating (มากกว่าหรือเท่ากับ)
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Filter by price level
    if (price) {
      query.priceLevel = Number(price);
    }

    // Filter by delivery fee
    if (delivery && delivery !== 'Any') {
      const maxFee = parseInt(delivery.toString().replace(/\D/g, ''));
      query.deliveryFee = { $lte: maxFee };
    }

    // TODO: Filter by nearMe (ต้องใช้ location)
    // TODO: Filter by promo (ต้องมี field ใน database)
    // TODO: Filter by open (ต้องมี field openingHours)

    const shops = await Shop.find(query).sort({ rating: -1 });
    
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

export const getShopById = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};

export const updateShopById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const shop = await Shop.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ error: 'Failed to update shop' });
  }
};

/** เพิ่ม balance เมื่อ complete order (ใช้ $inc เพื่อป้องกัน race condition) */
export const depositBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const shop = await Shop.findByIdAndUpdate(
      id,
      { $inc: { balance: amt } },
      { new: true }
    );
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error depositing balance:', error);
    res.status(500).json({ error: 'Failed to deposit' });
  }
};

/** ถอน balance (Transfer to Account) */
export const withdrawBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const currentBalance = (shop as any).balance ?? 0;
    if (amt > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    const updated = await Shop.findByIdAndUpdate(
      id,
      { $inc: { balance: -amt } },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error('Error withdrawing balance:', error);
    res.status(500).json({ error: 'Failed to withdraw' });
  }
};
