import { Request, Response } from 'express';
import { Shop } from '../models/Shop';

export const getBalance = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.shopId).select('balance name');
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({ shopId: shop._id, name: shop.name, balance: shop.balance ?? 0 });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

export const deposit = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const shop = await Shop.findByIdAndUpdate(
      req.params.shopId,
      { $inc: { balance: amount } },
      { new: true }
    );
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({ success: true, balance: shop.balance });
  } catch (error) {
    console.error('Error depositing:', error);
    res.status(500).json({ error: 'Failed to deposit' });
  }
};

export const withdraw = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal is 100' });
    }
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const currentBalance = shop.balance ?? 0;
    if (amount > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    shop.balance = currentBalance - amount;
    await shop.save();
    res.json({ success: true, balance: shop.balance, withdrawn: amount });
  } catch (error) {
    console.error('Error withdrawing:', error);
    res.status(500).json({ error: 'Failed to withdraw' });
  }
};
