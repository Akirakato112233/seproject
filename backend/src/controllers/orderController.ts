/**
 * Order controller: CRUD, status updates, pending/active/history, merchant order linking.
 * findOrderWithModel resolves order from Order or OrderForMerchant by id.
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  Order,
  OrderForMerchant,
  orderStatusToMerchantStatus,
  merchantInputToMerchantStatus,
} from '../models/Order';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Rider } from '../models/Rider';
import { RiderRegistration } from '../models/RiderRegistration';
import { MerchantUser } from '../models/MerchantUser';

const findOrderWithModel = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (order) {
    return { order, model: Order };
  }

  const merchantOrder = await OrderForMerchant.findById(orderId);
  if (merchantOrder) {
    // ถ้า accept แล้ว (มี ordersId) ให้ใช้ order จาก orders แทน
    if (merchantOrder.ordersId) {
      const linkedOrder = await Order.findById(merchantOrder.ordersId);
      if (linkedOrder) {
        return { order: linkedOrder, model: Order };
      }
    }
    return { order: merchantOrder, model: OrderForMerchant };
  }

  return null;
};

const mergeAndSortByCreatedAt = <T extends { createdAt?: Date }>(...groups: T[][]): T[] => {
  return groups
    .flat()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

/** Parse order items for wash/dry - used for coin shop popups */
function parseWashDryFromItems(items: { name: string; details?: string; price?: number }[]): {
  hasWashItem: boolean;
  hasDryItem: boolean;
  washWeight?: number;
  washDuration?: number;
  dryWeight?: number;
  dryDuration?: number;
} {
  const result = {
    hasWashItem: false,
    hasDryItem: false,
    washWeight: undefined as number | undefined,
    washDuration: undefined as number | undefined,
    dryWeight: undefined as number | undefined,
    dryDuration: undefined as number | undefined,
  };
  if (!Array.isArray(items)) return result;
  for (const item of items) {
    const name = (item.name || '').toLowerCase();
    const weightMatch = name.match(/(\d+)\s*kg/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : undefined;
    if (name.includes('wash') || name.startsWith('wash')) {
      result.hasWashItem = true;
      result.washWeight = weight ?? result.washWeight;
      result.washDuration = result.washDuration ?? 45;
    } else if (name.includes('dry') || name.startsWith('dry')) {
      result.hasDryItem = true;
      result.dryWeight = weight ?? result.dryWeight;
      result.dryDuration = result.dryDuration ?? 45;
    }
  }
  return result;
}

// สร้าง Order ใหม่
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId, shopName, items, serviceTotal, deliveryFee, total, paymentMethod, additionalRequest, userLat, userLon } = req.body;

    console.log('=== CREATE ORDER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // ใช้ user จริงจาก token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // ดึงข้อมูล user (displayName, address)
    const user = await User.findById(userId);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const shop = await Shop.findById(shopId).select('type name');
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    // ถ้าจ่ายด้วย wallet ต้องหักเงิน
    if (paymentMethod === 'wallet') {
      if (user.balance < total) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }

      // หักเงินจาก wallet
      await User.findByIdAndUpdate(userId, { $inc: { balance: -total } });
      console.log('Wallet deducted:', total);
    }

    // สร้าง order ใหม่ (รวม user info จาก database)
    const orderData: any = {
      userId,
      userDisplayName: user.displayName || 'Unknown User',
      userAddress: user.address || 'No address set',
      shopId,
      shopName: shopName || shop.name,
      items,
      serviceTotal,
      deliveryFee,
      total,
      paymentMethod: paymentMethod || 'cash',
      status: 'decision', // เริ่มต้นที่สถานะรอการตัดสินใจ
    };
    if (additionalRequest) orderData.note = additionalRequest;
    // พิกัดลูกค้า: ใช้จาก body (ที่ user-app ส่งมา) หรือจาก User ที่บันทึกไว้
    const lat = typeof userLat === 'number' ? userLat : (user as any).lat;
    const lon = typeof userLon === 'number' ? userLon : (user as any).lon;
    if (typeof lat === 'number' && typeof lon === 'number') {
      orderData.userLat = lat;
      orderData.userLon = lon;
    }

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const orderModel = shop.type === 'full' ? OrderForMerchant : Order;
    const order = await orderModel.create(orderData);
    console.log('Order created successfully:', order._id);

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully!',
    });
  } catch (error: any) {
    console.error('=== CREATE ORDER ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

// ดึง Order ตาม ID (รวม riderDisplayName เมื่อมี riderId)
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const foundOrder = await findOrderWithModel(orderId);
    const order = foundOrder?.order;

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderObj = order.toObject ? order.toObject() : { ...order };
    const riderId = (order as any).riderId;
    if (riderId) {
      // riderId อาจเป็นทั้ง User._id, Rider._id หรือ RiderRegistration._id
      let riderReg = await RiderRegistration.findById(riderId).select('fullName selfieUri').lean();
      const riderUser = await User.findById(riderId).select('displayName email phone').lean();
      const riderDoc = await Rider.findById(riderId).select('displayName fullName').lean();
      // ถ้า riderId เป็น User._id ให้หา RiderRegistration จาก email/phone
      if (!riderReg && riderUser) {
        if (riderUser.email) {
          riderReg = await RiderRegistration.findOne({
            email: { $regex: new RegExp(`^${String(riderUser.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          })
            .select('fullName selfieUri')
            .sort({ createdAt: -1 })
            .lean();
        }
        if (!riderReg && riderUser.phone) {
          riderReg = await RiderRegistration.findOne({
            $or: [
              { phone: String(riderUser.phone) },
              { phone: String(riderUser.phone).replace(/^0/, '') },
              { phone: '0' + String(riderUser.phone).replace(/^0/, '') },
            ],
          })
            .select('fullName selfieUri')
            .sort({ createdAt: -1 })
            .lean();
        }
      }
      const name =
        riderReg?.fullName ||
        riderUser?.displayName ||
        riderDoc?.displayName ||
        riderDoc?.fullName;
      (orderObj as any).riderDisplayName = (name && String(name).trim()) || 'Rider';
      (orderObj as any).riderPhoto = (riderReg as any)?.selfieUri || undefined;
    }

    res.json({ success: true, order: orderObj });
  } catch (error) {
    console.error('Get Order By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order' });
  }
};

// User ให้คะแนนร้านค้า
export const rateShop = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const foundOrder = await findOrderWithModel(orderId);
    const order = foundOrder?.order;

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.status) !== 'completed' && String(order.status) !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Only completed orders can be rated' });
    }

    if ((order as any).shopRating) {
      return res.status(400).json({ success: false, message: 'Shop already rated for this order' });
    }

    // อัปเดตคะแนนใน Order
    const updateId = String(order._id);
    await foundOrder!.model.findByIdAndUpdate(updateId, { shopRating: rating });

    // sync ไป Order / OrderForMerchant หากมีการเชื่อมกับอีกตาราง
    if ((order as any).merchantOrderId) {
      await OrderForMerchant.findByIdAndUpdate((order as any).merchantOrderId, { shopRating: rating });
    } else if ((order as any).ordersId) {
      await Order.findByIdAndUpdate((order as any).ordersId, { shopRating: rating });
    }

    // อัปเดตคะแนนเฉลี่ยใน Shop
    const shop = await Shop.findById(order.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const currentRating = typeof shop.rating === 'number' ? shop.rating : 4.8;
    const currentReviewCount = typeof shop.reviewCount === 'number' ? shop.reviewCount : 0;

    let newRating = rating;
    if (currentReviewCount > 0) {
      newRating = ((currentRating * currentReviewCount) + rating) / (currentReviewCount + 1);
    }

    // ปัดเศษให้เหลือทศนิยม 1 ตำแหน่ง
    newRating = Math.round(newRating * 10) / 10;

    await Shop.findByIdAndUpdate(shop._id, {
      $inc: { reviewCount: 1 },
      $set: { rating: newRating }
    });

    res.json({ success: true, message: 'Shop rated successfully', newRating, newReviewCount: currentReviewCount + 1 });
  } catch (error) {
    console.error('Rate Shop Error:', error);
    res.status(500).json({ success: false, message: 'Failed to rate shop' });
  }
};

// ดึง Order ที่กำลังดำเนินการ (ยังไม่เสร็จ/ยกเลิก)
export const getActiveOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const query = {
      userId,
      status: { $nin: ['completed', 'cancelled'] },
    };

    const [activeOrder, activeMerchantOrder] = await Promise.all([
      Order.findOne(query).sort({ createdAt: -1 }),
      OrderForMerchant.findOne(query).sort({ createdAt: -1 }),
    ]);

    const activeCandidates = [activeOrder, activeMerchantOrder].filter(Boolean) as Array<{
      createdAt?: Date;
    }>;
    const latestActiveOrder = activeCandidates.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0];

    if (!latestActiveOrder) {
      return res.json({ hasActiveOrder: false, order: null });
    }

    res.json({
      hasActiveOrder: true,
      order: latestActiveOrder,
    });
  } catch (error) {
    console.error('Get Active Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get active order' });
  }
};

// Merchant อัพเดทสถานะ order (at_shop <-> out_for_delivery <-> completed) - ไม่ต้อง auth
export const merchantUpdateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, shopId } = req.body;

    const foundOrder = await findOrderWithModel(orderId);
    const order = foundOrder?.order;
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (shopId && String(order.shopId) !== String(shopId)) {
      return res
        .status(403)
        .json({ success: false, message: 'Order does not belong to this shop' });
    }

    const allowed = [
      'at_shop',
      'out_for_delivery',
      'in_progress',
      'deliverying',
      'delivering',
      'completed',
      'rider_coming',
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Race condition prevention: ถ้าจะเปลี่ยนเป็น rider_coming ต้องเป็น pending, decision หรือ waiting_rider เท่านั้น
    if (
      status === 'rider_coming' &&
      !['pending', 'decision', 'waiting_rider'].includes(order.status)
    ) {
      return res.status(409).json({
        success: false,
        message: 'Order already taken by another rider',
        currentStatus: order.status,
      });
    }

    const updateId = String(order._id);
    // OrderForMerchant ใช้ status เป็น label (Waiting for rider, In progress, ...)
    const statusToWrite =
      foundOrder!.model.modelName === 'OrderForMerchant'
        ? merchantInputToMerchantStatus(status)
        : status;
    const updated = await foundOrder!.model.findByIdAndUpdate(
      updateId,
      { status: statusToWrite },
      { new: true }
    );

    // Sync: ถ้าเป็น Order ให้อัปเดต OrderForMerchant (ใช้ label ใหม่), ถ้าเป็น OrderForMerchant ให้อัปเดต Order (ใช้ status เดิม)
    if (updated) {
      if ((order as any).merchantOrderId) {
        const merchantStatus = orderStatusToMerchantStatus(status);
        await OrderForMerchant.findByIdAndUpdate((order as any).merchantOrderId, {
          status: merchantStatus,
        });
      } else if ((order as any).ordersId) {
        await Order.findByIdAndUpdate((order as any).ordersId, { status });
      }
    }

    // เมื่อออเดอร์เปลี่ยนเป็น deliverying หรือ completed และชำระด้วย wallet ให้โอนเงินเข้า balance ร้าน
    const prevStatus = String(order.status);
    const isFirstTimeDeliveryingOrCompleted =
      (status === 'deliverying' || status === 'completed') &&
      order.paymentMethod === 'wallet' &&
      prevStatus !== 'deliverying' &&
      prevStatus !== 'Delivering' &&
      prevStatus !== 'completed' &&
      prevStatus !== 'Completed';
    if (isFirstTimeDeliveryingOrCompleted) {
      const amt = Math.round(Number(order.total) || 0);
      if (amt > 0 && order.shopId) {
        try {
          await Shop.findByIdAndUpdate(order.shopId, { $inc: { balance: amt } });
        } catch (err) {
          console.error('Auto deposit (deliverying/completed) failed:', err);
        }
      }
    }

    res.json({ success: true, order: updated });
  } catch (error) {
    console.error('Merchant Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// Merchant รับ order - ถ้าจาก ordersformerchant ให้ copy ไป POST ลง orders collection ด้วย
export const merchantAcceptOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { shopId } = req.body;
    console.log('[Merchant Accept] Request', { orderId, shopId });

    const foundOrder = await findOrderWithModel(orderId);
    const order = foundOrder?.order;
    if (!order) {
      console.log('[Merchant Accept] Order not found:', orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    console.log('[Merchant Accept] Found order', {
      status: order.status,
      model: foundOrder!.model.modelName,
    });
    if (shopId && String(order.shopId) !== String(shopId)) {
      console.log('[Merchant Accept] Shop mismatch', {
        orderShopId: order.shopId,
        reqShopId: shopId,
      });
      return res
        .status(403)
        .json({ success: false, message: 'Order does not belong to this shop' });
    }
    const canAccept = [
      'decision',
      'waiting_rider',
      'rider_coming',
      'at_shop',
      'Looking for rider',
      'Waiting for rider',
      'In progress',
    ].includes(String(order.status));
    if (!canAccept) {
      console.log('[Merchant Accept] Cannot accept - status:', order.status);
      return res.status(400).json({ success: false, message: 'Order cannot be accepted' });
    }

    // ถ้า order มาจาก ordersformerchant ให้ copy ไป POST ลง orders collection
    if (foundOrder!.model.modelName === 'OrderForMerchant') {
      const orderData = {
        userId: order.userId,
        userDisplayName: order.userDisplayName,
        userAddress: order.userAddress,
        shopId: order.shopId,
        shopName: order.shopName,
        items: order.items,
        serviceTotal: order.serviceTotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: 'decision' as const, // ส่งให้ rider ตัดสินใจรับหรือไม่
        merchantOrderId: order._id,
        ...((order as any).note && { note: (order as any).note }),
      };
      const newOrder = await Order.create(orderData);

      // อัปเดต ordersformerchant เป็น "Looking for rider" (ส่งให้ rider ตัดสินใจแล้ว)
      await OrderForMerchant.findByIdAndUpdate(
        order._id,
        {
          status: 'Looking for rider',
          ordersId: newOrder._id,
        },
        { new: true }
      );

      console.log(
        '[Merchant Accept] สำเร็จ - OrderForMerchant -> Looking for rider, Order created:',
        newOrder._id
      );
      return res.json({ success: true, order: newOrder });
    }

    // order อยู่ใน orders อยู่แล้ว (accept ไปแล้ว) - ไม่เปลี่ยนเป็น rider_coming
    // status decision/waiting_rider = ยังรอ rider ตัดสินใจ → OrderForMerchant ต้องเป็น "Looking for rider"
    if (['decision', 'waiting_rider'].includes(String(order.status))) {
      const merchantId = (order as any).merchantOrderId;
      const updatedMerchant = merchantId
        ? await OrderForMerchant.findByIdAndUpdate(
          merchantId,
          { status: 'Looking for rider' },
          { new: true }
        )
        : await OrderForMerchant.findOneAndUpdate(
          { ordersId: (order as any)._id },
          { status: 'Looking for rider' },
          { new: true }
        );
      console.log(
        '[Merchant Accept] Order ถูก accept ไปแล้ว - sync OrderForMerchant เป็น Looking for rider',
        { merchantId, updated: !!updatedMerchant }
      );
      return res.json({ success: true, order });
    }

    // status อื่น (rider_coming, at_shop, ...) - อัปเดตตามปกติ
    const actualId = String((order as any)._id);
    const updated = await Order.findByIdAndUpdate(
      actualId,
      { status: 'rider_coming' },
      { new: true }
    );
    if (updated && (order as any).merchantOrderId) {
      await OrderForMerchant.findByIdAndUpdate((order as any).merchantOrderId, {
        status: orderStatusToMerchantStatus('rider_coming'),
      });
    }
    console.log('[Merchant Accept] สำเร็จ - อัปเดตเป็น rider_coming');
    res.json({ success: true, order: updated });
  } catch (error) {
    console.error('Merchant Accept Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept order' });
  }
};

// อัพเดทสถานะ Order (ใช้โดย rider/user)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, riderId } = req.body;

    const foundOrder = await findOrderWithModel(orderId);
    const existingOrder = foundOrder?.order;
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Atomic update: rider รับงานได้เฉพาะ order ที่รอ rider ตัดสินใจ (pending, decision, waiting_rider, accepted)
    const actualOrderId = String((existingOrder as any)._id);
    const updateQuery =
      status === 'rider_coming'
        ? {
          _id: actualOrderId,
          status: { $in: ['pending', 'decision', 'waiting_rider', 'accepted'] },
        }
        : { _id: actualOrderId };
    const updatePayload: any = { status };

    // map riderId ให้เป็น RiderRegistration._id ถ้าเป็นไปได้
    if (status === 'rider_coming' && riderId) {
      let finalRiderId = String(riderId);

      // ถ้า front-end ส่ง RiderRegistration._id มาอยู่แล้ว ใช้ต่อได้เลย
      const existingReg = await RiderRegistration.findById(finalRiderId).lean();
      if (!existingReg) {
        // กรณีทั่วไป: riderId เป็น User._id → หา RiderRegistration จาก email / phone
        const riderUser = await User.findById(finalRiderId).lean();
        if (riderUser) {
          let reg: any = null;
          if (riderUser.email) {
            const emailLower = String(riderUser.email).trim().toLowerCase();
            const emailRegex = new RegExp(
              `^${emailLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`,
              'i'
            );
            reg = await RiderRegistration.findOne({ email: emailRegex }).sort({ createdAt: -1 }).lean();
          }
          if (!reg && riderUser.phone) {
            const phoneStr = String(riderUser.phone).trim();
            reg = await RiderRegistration.findOne({
              $or: [
                { phone: phoneStr },
                { phone: phoneStr.replace(/^0/, '') },
                { phone: '0' + phoneStr.replace(/^0/, '') },
              ],
            })
              .sort({ createdAt: -1 })
              .lean();
          }
          if (reg?._id) {
            finalRiderId = String(reg._id);
          }
        }
      }

      updatePayload.riderId = finalRiderId;
    }
    const order = await Order.findOneAndUpdate(updateQuery, updatePayload, { new: true });

    if (!order) {
      const msg =
        status === 'rider_coming' ? 'Order already taken by another rider' : 'Order not found';
      return res.status(status === 'rider_coming' ? 409 : 404).json({
        success: false,
        message: msg,
        ...(existingOrder && { currentStatus: existingOrder.status }),
      });
    }

    // Sync status ไปที่ ordersformerchant (ใช้ label ตรงกับ merchant app) — เมื่อไรเดอร์กด "ส่งแล้ว" ฝั่งร้านต้องเป็น Completed ด้วย
    const merchantStatus = orderStatusToMerchantStatus(status);
    if ((order as any).merchantOrderId) {
      await OrderForMerchant.findByIdAndUpdate((order as any).merchantOrderId, {
        status: merchantStatus,
      });
    }
    // กรณี status เป็น completed: อัปเดต OrderForMerchant ที่ลิงก์กับ order นี้ (เผื่อ path ที่ไม่มี merchantOrderId)
    if (status === 'completed') {
      await OrderForMerchant.findOneAndUpdate(
        { ordersId: (order as any)._id },
        { status: 'Completed' }
      );
    }

    // Coin shop: เมื่อไรเดอร์มารับผ้า (status → deliverying) → เครื่อง ready → available
    if (status === 'deliverying' || status === 'delivering') {
      const ord = existingOrder; // ใช้ order ก่อนอัปเดต (มี washMachineIndex, dryMachineIndex)
      const shopId = (ord as any).shopId;
      const washIdx = (ord as any).washMachineIndex;
      const dryIdx = (ord as any).dryMachineIndex;
      if (shopId && (typeof washIdx === 'number' || typeof dryIdx === 'number')) {
        try {
          const updates: Record<string, unknown> = {};
          if (typeof washIdx === 'number' && washIdx >= 0) {
            updates[`washServices.${washIdx}.status`] = 'available';
            updates[`washServices.${washIdx}.finishTime`] = null;
          }
          if (typeof dryIdx === 'number' && dryIdx >= 0) {
            updates[`dryServices.${dryIdx}.status`] = 'available';
            updates[`dryServices.${dryIdx}.finishTime`] = null;
          }
          if (Object.keys(updates).length > 0) {
            await Shop.findByIdAndUpdate(shopId, { $set: updates });
          }
        } catch (err) {
          console.error('Release coin machines on pickup failed:', err);
        }
      }
    }

    // เมื่อสถานะเป็น completed และชำระ wallet และยังไม่เคยโอน — โอนเข้า balance ร้าน
    const prevStatus = String(existingOrder.status);
    const isFirstCompleted =
      status === 'completed' &&
      existingOrder.paymentMethod === 'wallet' &&
      prevStatus !== 'completed' &&
      prevStatus !== 'Completed' &&
      prevStatus !== 'deliverying' &&
      prevStatus !== 'Delivering';
    if (isFirstCompleted) {
      const amt = Math.round(Number(existingOrder.total) || 0);
      if (amt > 0 && existingOrder.shopId) {
        try {
          await Shop.findByIdAndUpdate(existingOrder.shopId, { $inc: { balance: amt } });
        } catch (err) {
          console.error('Auto deposit (completed) failed:', err);
        }
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// ดึง Order ทั้งหมดของ User (ประวัติ)
export const getOrderHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const [orders, merchantOrders] = await Promise.all([
      Order.find({ userId }).sort({ createdAt: -1 }).limit(20),
      OrderForMerchant.find({ userId }).sort({ createdAt: -1 }).limit(20),
    ]);

    const mergedOrders = mergeAndSortByCreatedAt(orders, merchantOrders).slice(0, 20);

    res.json({ orders: mergedOrders });
  } catch (error) {
    console.error('Get Order History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order history' });
  }
};

// ดึง Order ที่รอ Merchant รับงาน (จาก ordersformerchant เท่านั้น)
export const getMerchantPendingOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'shopId is required' });
    }

    const allOrders = await OrderForMerchant.find({ shopId, status: 'decision' }).sort({
      createdAt: -1,
    });

    const formattedOrders = allOrders.map((order) => {
      const firstItem =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items[0]
          : { name: 'Wash & Fold Service', details: 'approx. 5-7 kg', price: 0 };

      const note = (order as any).note || (firstItem as any)?.additionalRequest || '';
      return {
        id: String(order._id),
        _id: order._id,
        orderId: `ORD-${String(order._id).slice(-4)}`,
        customerName: order.userDisplayName || 'Customer',
        userAddress: order.userAddress || '',
        total: order.total || 0,
        serviceTotal: order.serviceTotal || 0,
        deliveryFee: order.deliveryFee || 0,
        paymentMethod: order.paymentMethod === 'wallet' ? 'Wallet' : 'Cash',
        paymentMethodRaw: order.paymentMethod,
        serviceType: firstItem?.name || 'Wash & Fold Service',
        serviceDetail: firstItem?.details || `approx. 5-7 kg`,
        items: order.items || [],
        note,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    res.json({ success: true, orders: formattedOrders });
  } catch (error) {
    console.error('Get Merchant Pending Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get merchant pending orders' });
  }
};

// ดึง Order ที่ร้านกำลังดำเนินการ (จาก ordersformerchant เท่านั้น)
export const getMerchantCurrentOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'shopId is required' });
    }

    const currentStatusQuery = {
      shopId,
      status: {
        $in: [
          'Looking for rider',
          'Waiting for rider',
          'In progress',
          'Ready for pickup',
          'Delivering',
          'rider_coming',
          'at_shop',
          'out_for_delivery',
          'in_progress',
          'deliverying',
        ],
      },
    };

    const allOrders = await OrderForMerchant.find(currentStatusQuery).sort({ updatedAt: -1 });

    const formattedOrders = allOrders.map((order) => {
      const firstItem =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items[0]
          : { name: 'Wash & Fold Service', details: '', price: 0 };

      const s = String(order.status);
      const isLookingForRider = s === 'Looking for rider';
      const isRiderComing = s === 'Waiting for rider' || s === 'rider_coming';
      const isAtShop = s === 'In progress' || s === 'at_shop';
      const isDelivering = s === 'Delivering' || s === 'deliverying';
      const isReady = [
        'Ready for pickup',
        'Delivering',
        'in_progress',
        'out_for_delivery',
        'deliverying',
      ].includes(s);
      const displayStatus =
        isLookingForRider || isRiderComing ? 'wait_for_rider' : isAtShop ? 'washing' : 'ready';
      const dueText =
        isLookingForRider || isRiderComing ? undefined : isAtShop ? 'Due in 2h' : undefined;
      const pickupText = isLookingForRider
        ? 'Looking for rider'
        : isRiderComing
          ? 'Waiting for rider'
          : isAtShop
            ? undefined
            : isDelivering
              ? 'Delivering'
              : 'Waiting for rider to pick up';

      const note = (order as any).note || (firstItem as any)?.additionalRequest || '';
      return {
        id: String(order._id),
        customerName: order.userDisplayName || 'Customer',
        orderId: `ORD-${String(order._id).slice(-4)}`,
        serviceType: firstItem?.name || 'Wash & Fold',
        status: displayStatus,
        statusRaw: s,
        total: order.total || 0,
        paymentMethod: order.paymentMethod === 'wallet' ? 'Wallet' : 'Cash',
        dueText,
        pickupText,
        items: order.items || [],
        note,
      };
    });

    res.json({ success: true, orders: formattedOrders });
  } catch (error) {
    console.error('Get Merchant Current Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get merchant current orders' });
  }
};

const mergeAndSortByUpdatedAt = <T extends { updatedAt?: Date }>(...groups: T[][]): T[] => {
  return groups
    .flat()
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
};

// ดึงประวัติออเดอร์ที่ completed ของร้าน (จาก ordersformerchant เท่านั้น)
export const getMerchantOrderHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'shopId is required' });
    }

    const historyQuery = { shopId, status: { $in: ['Completed', 'completed'] } };

    const allOrders = await OrderForMerchant.find(historyQuery).sort({ updatedAt: -1 }).limit(100);

    const formattedOrders = allOrders.map((order) => {
      const firstItem =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items[0]
          : { name: 'Wash & Fold Service', details: '', price: 0 };

      const note = (order as any).note || (firstItem as any)?.additionalRequest || '';
      return {
        id: String(order._id),
        customerName: order.userDisplayName || 'Customer',
        orderId: `ORD-${String(order._id).slice(-4)}`,
        serviceType: firstItem?.name || 'Wash & Fold',
        status: 'completed', // merchant app ใช้ 'completed' สำหรับ display
        total: order.total || 0,
        paymentMethod: order.paymentMethod === 'wallet' ? 'Wallet' : 'Cash',
        completedAt: order.updatedAt || order.createdAt,
        items: order.items || [],
        note,
      };
    });

    res.json({ success: true, orders: formattedOrders });
  } catch (error) {
    console.error('Get Merchant Order History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get merchant order history' });
  }
};

// ดึง Order ที่รอ Rider รับงาน (status = 'rider_coming')
export const getPendingOrders = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📦 Fetching pending orders...');
    const pendingQuery = {
      status: { $in: ['pending', 'decision', 'waiting_rider', 'rider_coming'] }, // waiting_rider = merchant accept แล้ว ส่งให้ rider ตัดสินใจ
      userId: { $ne: 'dev-test-user' }, // แสดงเฉพาะ order จริง ไม่เอา order ทดสอบ
    };

    const allOrders = await Order.find(pendingQuery).sort({ createdAt: -1 });

    console.log(`✅ Found ${allOrders.length} pending orders`);

    // Map ข้อมูลให้ตรงกับ Rider App Order type
    const enrichedOrders = await Promise.all(
      allOrders.map(async (order) => {
        // พิกัดลูกค้า (ที่รับผ้า/ส่งผ้า) — ใช้จาก order.userLat/userLon ถ้ามี ไม่มีใช้ default
        const customerCoords =
          (order as any).userLat != null && (order as any).userLon != null
            ? { latitude: (order as any).userLat, longitude: (order as any).userLon }
            : { latitude: 13.113625, longitude: 100.919286 };

        let shop = null;
        if (order.shopId && /^[0-9a-fA-F]{24}$/.test(String(order.shopId))) {
          shop = await Shop.findById(order.shopId);
        }

        const shopCoords = shop?.location
          ? { latitude: shop.location.lat, longitude: shop.location.lng }
          : { latitude: 13.117629, longitude: 100.916613 };

        const items = order.items || [];
        const washDry = parseWashDryFromItems(items);

        return {
          id: String(order._id),
          shopName: order.shopName || shop?.name || 'Unknown Shop',
          shopAddress: shop?.name || 'ไม่ระบุที่อยู่ร้าน',
          customerName: order.userDisplayName || 'Customer',
          customerAddress: order.userAddress || 'ไม่ระบุที่อยู่',
          userId: order.userId || undefined,
          note: (order as any).note || '',
          distance: '1.5 km',
          fee: order.total || 0,
          items: items.length,
          itemsList: items,
          pickup: customerCoords, // ที่รับผ้า = ที่อยู่ลูกค้า
          dropoff: customerCoords, // ที่ส่งผ้า = ที่อยู่ลูกค้า
          shop: shopCoords, // พิกัดร้าน (ไปร้านหลังรับผ้า)
          paymentMethod: order.paymentMethod || 'cash',
          status: order.status || 'decision',
          shopType: shop?.type ?? 'full',
          hasWashItem: washDry.hasWashItem,
          hasDryItem: washDry.hasDryItem,
          coinWashDone: (order as any).coinWashDone ?? false,
          coinDryDone: (order as any).coinDryDone ?? false,
        };
      })
    );

    console.log('✅ Orders enriched successfully');
    res.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error('❌ Get Pending Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending orders' });
  }
};

// ดึงประวัติออเดอร์ที่ completed ของ Rider (ตาม riderId)
export const getRiderOrderHistory = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = (req.query.riderId as string) || (req as any).user?.userId;
    if (!riderId) {
      return res
        .status(400)
        .json({ success: false, message: 'riderId is required (query or auth)' });
    }

    // riderId ใน DB อาจเป็นทั้ง User._id (เดิม) หรือ RiderRegistration._id (ใหม่)
    const riderIds: string[] = [String(riderId)];
    const user = await User.findById(riderId).lean();
    if (user) {
      let reg: any = null;
      if (user.email) {
        const emailLower = String(user.email).trim().toLowerCase();
        const emailRegex = new RegExp(
          `^${emailLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`,
          'i'
        );
        reg = await RiderRegistration.findOne({ email: emailRegex }).sort({ createdAt: -1 }).lean();
      }
      if (!reg && user.phone) {
        const phoneStr = String(user.phone).trim();
        reg = await RiderRegistration.findOne({
          $or: [
            { phone: phoneStr },
            { phone: phoneStr.replace(/^0/, '') },
            { phone: '0' + phoneStr.replace(/^0/, '') },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
      }
      if (reg?._id) {
        riderIds.push(String(reg._id));
      }
    }

    const orders = await Order.find({
      riderId: { $in: riderIds },
      status: { $in: ['completed', 'Completed'] },
    })
      .sort({ updatedAt: -1 })
      .limit(200);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        let shop: any = null;
        if (order.shopId && /^[0-9a-fA-F]{24}$/.test(String(order.shopId))) {
          shop = await Shop.findById(order.shopId).lean();
        }
        let merchantUser: any = null;
        if (shop?.merchantUserId && /^[0-9a-fA-F]{24}$/.test(String(shop.merchantUserId))) {
          merchantUser = await MerchantUser.findById(shop.merchantUserId).lean();
        }
        let note = (order as any).note || '';
        if (!note && (order as any).merchantOrderId) {
          const merchantOrder = await OrderForMerchant.findById((order as any).merchantOrderId)
            .select('note')
            .lean();
          note = (merchantOrder as any)?.note || '';
        }

        const customerCoords =
          (order as any).userLat != null && (order as any).userLon != null
            ? { latitude: (order as any).userLat, longitude: (order as any).userLon }
            : { latitude: 13.113625, longitude: 100.919286 };

        const shopCoords = shop?.location
          ? { latitude: shop.location.lat, longitude: shop.location.lng }
          : { latitude: 13.117629, longitude: 100.916613 };

        const items = order.items || [];
        const washDry = parseWashDryFromItems(items);

        return {
          id: String(order._id),
          shopName: order.shopName || shop?.name || 'Unknown Shop',
          shopAddress: shop?.address || 'ไม่ระบุที่อยู่ร้าน',
          shopPhone: merchantUser?.phone || (shop as any)?.phone || '',
          customerName: order.userDisplayName || 'Customer',
          customerAddress: order.userAddress || '',
          distance: '1.5 km',
          fee: order.deliveryFee ?? order.total ?? 0,
          items: items.length,
          itemsList: items,
          pickup: customerCoords,
          dropoff: customerCoords,
          shop: shopCoords,
          paymentMethod: order.paymentMethod || 'cash',
          status: order.status || 'completed',
          completedAt: order.updatedAt || order.createdAt,
          shopType: shop?.type ?? 'full',
          note,
          hasWashItem: washDry.hasWashItem,
          hasDryItem: washDry.hasDryItem,
          coinWashDone: (order as any).coinWashDone ?? false,
          coinDryDone: (order as any).coinDryDone ?? false,
        };
      })
    );

    res.json({ success: true, orders: enriched });
  } catch (error) {
    console.error('Get Rider Order History Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get rider order history' });
  }
};

/** ดึง Order ที่ Ready for Pickup ของ rider นี้ (ผ้าอยู่ที่ร้าน รอไรเดอร์มารับไปส่งลูกค้า) */
export const getRiderReadyForPickup = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = (req.query.riderId as string) || (req as any).user?.userId;
    if (!riderId) {
      return res
        .status(400)
        .json({ success: false, message: 'riderId is required (query or auth)' });
    }

    // riderId ใน DB อาจเป็นทั้ง User._id (เดิม) หรือ RiderRegistration._id (ใหม่)
    const riderIds: string[] = [String(riderId)];
    const user = await User.findById(riderId).lean();
    if (user) {
      let reg: any = null;
      if (user.email) {
        const emailLower = String(user.email).trim().toLowerCase();
        const emailRegex = new RegExp(
          `^${emailLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`,
          'i'
        );
        reg = await RiderRegistration.findOne({ email: emailRegex }).sort({ createdAt: -1 }).lean();
      }
      if (!reg && user.phone) {
        const phoneStr = String(user.phone).trim();
        reg = await RiderRegistration.findOne({
          $or: [
            { phone: phoneStr },
            { phone: phoneStr.replace(/^0/, '') },
            { phone: '0' + phoneStr.replace(/^0/, '') },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
      }
      if (reg?._id) {
        riderIds.push(String(reg._id));
      }
    }

    const orders = await Order.find({
      riderId: { $in: riderIds },
      status: { $in: ['in_progress', 'out_for_delivery'] },
    }).sort({ updatedAt: -1 });

    const enriched = await Promise.all(
      orders.map(async (order) => {
        let shop: any = null;
        if (order.shopId && /^[0-9a-fA-F]{24}$/.test(String(order.shopId))) {
          shop = await Shop.findById(order.shopId).lean();
        }
        let merchantUser: any = null;
        if (shop?.merchantUserId && /^[0-9a-fA-F]{24}$/.test(String(shop.merchantUserId))) {
          merchantUser = await MerchantUser.findById(shop.merchantUserId).lean();
        }
        let note = (order as any).note || '';
        if (!note && (order as any).merchantOrderId) {
          const merchantOrder = await OrderForMerchant.findById((order as any).merchantOrderId)
            .select('note')
            .lean();
          note = (merchantOrder as any)?.note || '';
        }
        const shopCoords = shop?.location
          ? { latitude: shop.location.lat, longitude: shop.location.lng }
          : { latitude: 13.117629, longitude: 100.916613 };
        const customerCoords =
          (order as any).userLat != null && (order as any).userLon != null
            ? { latitude: (order as any).userLat, longitude: (order as any).userLon }
            : { latitude: 13.113625, longitude: 100.919286 };

        const items = order.items || [];
        const washDry = parseWashDryFromItems(items);

        return {
          id: String(order._id),
          orderId: `ORD-${String(order._id).slice(-4)}`,
          status: order.status,
          statusLabel: 'Ready for Pickup',
          total: order.total || 0,
          paymentMethod: order.paymentMethod || 'cash',
          paymentLabel: order.paymentMethod === 'wallet' ? 'Wallet' : 'เงินสด',
          customerName: order.userDisplayName || 'Customer',
          customerAddress: order.userAddress || '',
          customerPhone: (order as any).customerPhone || '',
          shopName: order.shopName || shop?.name || 'Unknown Shop',
          shopAddress: shop?.address || 'ไม่ระบุที่อยู่ร้าน',
          shopPhone: merchantUser?.phone || (shop as any)?.phone || '',
          items: items,
          note,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          pickup: shopCoords,
          dropoff: customerCoords,
          shop: shopCoords,
          fee: order.deliveryFee || 0,
          shopType: shop?.type ?? 'full',
          hasWashItem: washDry.hasWashItem,
          hasDryItem: washDry.hasDryItem,
          coinWashDone: (order as any).coinWashDone ?? false,
          coinDryDone: (order as any).coinDryDone ?? false,
        };
      })
    );

    res.json({ success: true, orders: enriched });
  } catch (error) {
    console.error('Get Rider Ready For Pickup Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ready-for-pickup orders' });
  }
};

/** ดึง Order ที่อยู่ที่ร้านกำลังซัก (at_shop) ของ rider นี้ — ตรงกับ "In progress" ในร้าน */
export const getRiderAtShopOrders = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = (req.query.riderId as string) || (req as any).user?.userId;
    if (!riderId) {
      return res
        .status(400)
        .json({ success: false, message: 'riderId is required (query or auth)' });
    }

    // riderId ใน DB อาจเป็นทั้ง User._id (เดิม) หรือ RiderRegistration._id (ใหม่)
    const riderIds: string[] = [String(riderId)];
    const user = await User.findById(riderId).lean();
    if (user) {
      let reg: any = null;
      if (user.email) {
        const emailLower = String(user.email).trim().toLowerCase();
        const emailRegex = new RegExp(
          `^${emailLower.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`,
          'i'
        );
        reg = await RiderRegistration.findOne({ email: emailRegex }).sort({ createdAt: -1 }).lean();
      }
      if (!reg && user.phone) {
        const phoneStr = String(user.phone).trim();
        reg = await RiderRegistration.findOne({
          $or: [
            { phone: phoneStr },
            { phone: phoneStr.replace(/^0/, '') },
            { phone: '0' + phoneStr.replace(/^0/, '') },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
      }
      if (reg?._id) {
        riderIds.push(String(reg._id));
      }
    }

    const orders = await Order.find({
      riderId: { $in: riderIds },
      status: 'at_shop',
    }).sort({ updatedAt: -1 });

    const enriched = await Promise.all(
      orders.map(async (order) => {
        let shop: any = null;
        if (order.shopId && /^[0-9a-fA-F]{24}$/.test(String(order.shopId))) {
          shop = await Shop.findById(order.shopId).lean();
        }
        let merchantUser: any = null;
        if (shop?.merchantUserId && /^[0-9a-fA-F]{24}$/.test(String(shop.merchantUserId))) {
          merchantUser = await MerchantUser.findById(shop.merchantUserId).lean();
        }
        let note = (order as any).note || '';
        if (!note && (order as any).merchantOrderId) {
          const merchantOrder = await OrderForMerchant.findById((order as any).merchantOrderId)
            .select('note')
            .lean();
          note = (merchantOrder as any)?.note || '';
        }
        const shopCoords = shop?.location
          ? { latitude: shop.location.lat, longitude: shop.location.lng }
          : { latitude: 13.117629, longitude: 100.916613 };
        const customerCoords =
          (order as any).userLat != null && (order as any).userLon != null
            ? { latitude: (order as any).userLat, longitude: (order as any).userLon }
            : { latitude: 13.113625, longitude: 100.919286 };

        const items = order.items || [];
        const washDry = parseWashDryFromItems(items);

        return {
          id: String(order._id),
          orderId: `ORD-${String(order._id).slice(-4)}`,
          status: order.status,
          statusLabel: 'In progress',
          total: order.total || 0,
          paymentMethod: order.paymentMethod || 'cash',
          paymentLabel: order.paymentMethod === 'wallet' ? 'Wallet' : 'เงินสด',
          customerName: order.userDisplayName || 'Customer',
          customerAddress: order.userAddress || '',
          shopName: order.shopName || shop?.name || 'Unknown Shop',
          shopAddress: shop?.address || 'ไม่ระบุที่อยู่ร้าน',
          shopPhone: merchantUser?.phone || (shop as any)?.phone || '',
          items: items,
          note,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          pickup: customerCoords,
          dropoff: customerCoords,
          shop: shopCoords,
          fee: order.deliveryFee ?? order.total ?? 0,
          shopType: shop?.type ?? 'full',
          hasWashItem: washDry.hasWashItem,
          hasDryItem: washDry.hasDryItem,
          coinWashDone: (order as any).coinWashDone ?? false,
          coinDryDone: (order as any).coinDryDone ?? false,
        };
      })
    );

    res.json({ success: true, orders: enriched });
  } catch (error) {
    console.error('Get Rider At-Shop Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get at-shop orders' });
  }
};

/** POST /api/orders/:orderId/start-coin-wash - Rider เริ่มเครื่องซัก (ร้าน coin) */
export const startCoinWash = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'at_shop') {
      return res
        .status(400)
        .json({ success: false, message: 'Order must be at_shop to start wash' });
    }

    const shop = await Shop.findById(order.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    if (shop.type !== 'coin') {
      return res.status(400).json({ success: false, message: 'Shop is not a coin-operated shop' });
    }

    const washDry = parseWashDryFromItems(order.items || []);
    if (!washDry.hasWashItem) {
      return res.status(400).json({ success: false, message: 'Order has no wash item' });
    }

    const washServices = shop.washServices || [];
    const targetWeight = washDry.washWeight ?? 14;
    let washIdx = -1;
    let duration = washDry.washDuration ?? 45;
    // เลือกเฉพาะเครื่องที่ available (ไม่ใช้ ready = รอไรเดอร์มารับ)
    for (let i = 0; i < washServices.length; i++) {
      const ws = washServices[i];
      if (
        ws.status === 'available' &&
        ws.weight >= targetWeight - 3 &&
        ws.weight <= targetWeight + 5
      ) {
        washIdx = i;
        if (ws.options?.[0]) duration = ws.options[0].duration;
        break;
      }
    }
    if (washIdx < 0) {
      for (let i = 0; i < washServices.length; i++) {
        if (washServices[i].status === 'available') {
          washIdx = i;
          if (washServices[i].options?.[0]) duration = washServices[i].options[0].duration;
          break;
        }
      }
    }
    if (washIdx < 0) {
      return res.status(400).json({ success: false, message: 'No available wash machine' });
    }

    const finishTime = new Date(Date.now() + duration * 60 * 1000);

    // ใช้ positional $set แทนการแทนที่ทั้ง array เพื่อให้ Mongoose อัปเดตได้ถูกต้อง
    const shopUpdate: Record<string, unknown> = {
      [`washServices.${washIdx}.status`]: 'busy',
      [`washServices.${washIdx}.finishTime`]: finishTime,
    };
    const shopUpdated = await Shop.findByIdAndUpdate(
      order.shopId,
      { $set: shopUpdate },
      { new: true }
    );
    if (!shopUpdated) {
      console.error('Start Coin Wash: Shop update failed for', order.shopId);
      return res.status(500).json({ success: false, message: 'Failed to update shop machine' });
    }
    console.log(
      'Start Coin Wash: Shop washServices updated',
      shopUpdated.washServices?.[washIdx]?.status
    );
    await Order.findByIdAndUpdate(orderId, {
      coinWashFinishTime: finishTime,
      washMachineIndex: washIdx,
    });

    res.json({ success: true, message: 'Wash started', duration });
  } catch (error) {
    console.error('Start Coin Wash Error:', error);
    res.status(500).json({ success: false, message: 'Failed to start wash' });
  }
};

/** POST /api/orders/:orderId/start-coin-dry - Rider เริ่มเครื่องอบ (ร้าน coin, หลัง wash เสร็จ) */
export const startCoinDry = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'in_progress' && order.status !== 'out_for_delivery') {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Order must be Ready for Pickup to start dry (rider picked up after wash)',
        });
    }

    const washDry = parseWashDryFromItems(order.items || []);
    if (!washDry.hasDryItem) {
      return res.status(400).json({ success: false, message: 'Order has no dry item' });
    }
    if ((order as any).coinDryDone) {
      return res.status(400).json({ success: false, message: 'Dry already done' });
    }

    const shop = await Shop.findById(order.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    if (shop.type !== 'coin') {
      return res.status(400).json({ success: false, message: 'Shop is not a coin-operated shop' });
    }

    const dryServices = shop.dryServices || [];
    const targetWeight = washDry.dryWeight ?? 15;
    let dryIdx = -1;
    let duration = washDry.dryDuration ?? 45;
    // เลือกเฉพาะเครื่องที่ available (ไม่ใช้ ready)
    for (let i = 0; i < dryServices.length; i++) {
      const ds = dryServices[i];
      if (
        ds.status === 'available' &&
        ds.weight >= targetWeight - 5 &&
        ds.weight <= targetWeight + 10
      ) {
        dryIdx = i;
        if (ds.options?.[0]) duration = ds.options[0].duration;
        break;
      }
    }
    if (dryIdx < 0) {
      for (let i = 0; i < dryServices.length; i++) {
        if (dryServices[i].status === 'available') {
          dryIdx = i;
          if (dryServices[i].options?.[0]) duration = dryServices[i].options[0].duration;
          break;
        }
      }
    }
    if (dryIdx < 0) {
      return res.status(400).json({ success: false, message: 'No available dry machine' });
    }

    const finishTime = new Date(Date.now() + duration * 60 * 1000);

    // ใช้ positional $set แทนการแทนที่ทั้ง array
    const shopUpdate: Record<string, unknown> = {
      [`dryServices.${dryIdx}.status`]: 'busy',
      [`dryServices.${dryIdx}.finishTime`]: finishTime,
    };
    const shopUpdated = await Shop.findByIdAndUpdate(
      order.shopId,
      { $set: shopUpdate },
      { new: true }
    );
    if (!shopUpdated) {
      console.error('Start Coin Dry: Shop update failed for', order.shopId);
      return res.status(500).json({ success: false, message: 'Failed to update shop machine' });
    }
    // ไรเดอร์มารับผ้าซักแล้ว → เครื่องซัก ready → available
    const washIdx = (order as any).washMachineIndex;
    if (typeof washIdx === 'number' && washIdx >= 0) {
      await Shop.findByIdAndUpdate(order.shopId, {
        $set: {
          [`washServices.${washIdx}.status`]: 'available',
          [`washServices.${washIdx}.finishTime`]: null,
        },
      });
    }
    await Order.findByIdAndUpdate(orderId, {
      status: 'at_shop',
      coinWashDone: true,
      coinDryFinishTime: finishTime,
      dryMachineIndex: dryIdx,
    });

    res.json({ success: true, message: 'Dry started', duration });
  } catch (error) {
    console.error('Start Coin Dry Error:', error);
    res.status(500).json({ success: false, message: 'Failed to start dry' });
  }
};

// POST /api/orders/:orderId/rate - User ให้คะแนน rider
export const rateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    // หา order เพื่อดึง riderId
    const foundOrder = await findOrderWithModel(orderId);
    const order = foundOrder?.order;
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.status) !== 'completed' && String(order.status) !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Only completed orders can be rated' });
    }

    if ((order as any).riderRating != null) {
      return res.status(400).json({ success: false, message: 'Rider already rated for this order' });
    }

    const riderId = (order as any).riderId;
    if (!riderId) {
      return res.status(400).json({ success: false, message: 'No rider assigned to this order' });
    }

    // พยายามหา RiderRegistration จาก riderId โดยตรงก่อน (กรณีใหม่ที่ใช้ reg._id เป็น riderId)
    let registration = await RiderRegistration.findById(riderId).lean();
    let riderUser = null as any;

    if (!registration) {
      // กรณีเก่า: riderId เป็น User._id → หา User ก่อนแล้ว map ไป RiderRegistration
      riderUser = await User.findById(riderId).lean();
      if (!riderUser) {
        return res.status(404).json({ success: false, message: 'Rider user not found' });
      }

      if (riderUser.email) {
        registration = await RiderRegistration.findOne({
          email: {
            $regex: new RegExp(
              `^${riderUser.email.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`,
              'i'
            ),
          },
        }).lean();
      }
      if (!registration && riderUser.phone) {
        registration = await RiderRegistration.findOne({ phone: riderUser.phone }).lean();
      }
    }

    if (registration) {
      // บันทึก riderRating ใน Order เพื่อกัน rate ซ้ำ
      const updateId = String((order as any)._id);
      await foundOrder!.model.findByIdAndUpdate(updateId, { riderRating: rating });

      // sync ไป Order / OrderForMerchant หากมีการเชื่อมกับอีกตาราง
      if ((order as any).merchantOrderId) {
        await OrderForMerchant.findByIdAndUpdate((order as any).merchantOrderId, { riderRating: rating });
      } else if ((order as any).ordersId) {
        await Order.findByIdAndUpdate((order as any).ordersId, { riderRating: rating });
      }

      // อัพเดท rating ใน RiderRegistration: เพิ่ม totalRating และ ratingCount
      await RiderRegistration.findByIdAndUpdate(registration._id, {
        $inc: { totalRating: rating, ratingCount: 1 },
      });
      console.log(`⭐ Rating ${rating} added to rider ${registration.fullName}`);
    } else {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    res.json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    console.error('Rate Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rating' });
  }
};
