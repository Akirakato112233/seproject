import { Request, Response } from 'express';
import { Shop, calculatePriceLevel } from '../models/Shop';
import { WithdrawalRequest } from '../models/WithdrawalRequest';

// คำนวณระยะทางระหว่าง 2 จุด (Haversine formula) - return km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // รัศมีโลก (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getShops = async (req: Request, res: Response) => {
  try {
    const { type, rating, price, delivery, nearMe, lat, lon, promo, open, merchantUserId } = req.query;

    // สร้าง query object
    const query: any = {};

    // Filter by merchantUserId (สำหรับ merchant dashboard)
    if (merchantUserId) {
      query.merchantUserId = String(merchantUserId);
    }

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

    let shops = await Shop.find(query).lean();

    // Near Me: คำนวณระยะทางและ sort ตามใกล้สุด
    if (nearMe === 'true' && lat && lon) {
      const userLat = Number(lat);
      const userLon = Number(lon);

      shops = shops
        .map((shop) => {
          const shopLat = shop.location?.lat;
          const shopLon = shop.location?.lng;
          const distance =
            shopLat && shopLon ? calculateDistance(userLat, userLon, shopLat, shopLon) : Infinity;
          return { ...shop, distance };
        })
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      // Default sort by rating
      shops = shops.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

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

    // ถ้ามีการแก้ไข washServices หรือ dryServices → คำนวณ priceLevel ใหม่อัตโนมัติ
    const affectsPrice = updates.washServices !== undefined || updates.dryServices !== undefined;
    if (affectsPrice) {
      const existing = await Shop.findById(id).lean();
      if (existing) {
        const merged = {
          washServices: updates.washServices ?? existing.washServices,
          dryServices: updates.dryServices ?? existing.dryServices,
        };
        updates.priceLevel = calculatePriceLevel(merged);
      }
    }

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
    const shop = await Shop.findByIdAndUpdate(id, { $inc: { balance: amt } }, { new: true });
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error depositing balance:', error);
    res.status(500).json({ error: 'Failed to deposit' });
  }
};

/** ร้าน coin: เพิ่มรายได้เมื่อร้านรับเงินจากเครื่องหยอดเหรียญ (collect) */
export const addCoinRevenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const shop = await Shop.findById(id).lean();
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    if (shop.type !== 'coin') {
      return res.status(400).json({ error: 'Only coin-operated shops can add coin revenue' });
    }

    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const existingDate = (shop as any).todayRevenueDate;
    const isNewDay = existingDate !== todayStr;

    let updateOps: Record<string, unknown>;
    if (isNewDay) {
      updateOps = {
        $set: { todayRevenueDate: todayStr, todayRevenue: amt },
        $inc: { balance: amt },
      };
    } else {
      updateOps = {
        $inc: { balance: amt, todayRevenue: amt },
      };
    }

    const updated = await Shop.findByIdAndUpdate(id, updateOps, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({
      success: true,
      balance: (updated as any).balance ?? 0,
      todayRevenue: (updated as any).todayRevenue ?? 0,
    });
  } catch (error) {
    console.error('Error adding coin revenue:', error);
    res.status(500).json({ error: 'Failed to add coin revenue' });
  }
};

/** ถอน balance (Withdraw to Account / TrueMoney) */
export const withdrawBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, phone } = req.body;
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

    // สร้างประวัติการถอน (status เริ่มต้น false)
    const withdrawal = await WithdrawalRequest.create({
      shopId: id,
      phone: phone || '',
      amount: amt,
      status: false,
    });

    const updated = await Shop.findByIdAndUpdate(id, { $inc: { balance: -amt } }, { new: true });
    if (updated) {
      await WithdrawalRequest.findByIdAndUpdate(withdrawal._id, { status: true });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error withdrawing balance:', error);
    res.status(500).json({ error: 'Failed to withdraw' });
  }
};
