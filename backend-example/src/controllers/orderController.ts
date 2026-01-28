import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { User } from '../models/User';

// สร้าง Order ใหม่
export const createOrder = async (req: Request, res: Response) => {
    try {
        const {
            shopId,
            shopName,
            items,
            serviceTotal,
            deliveryFee,
            total,
            paymentMethod
        } = req.body;

        // ใช้ demo_user สำหรับตอนนี้
        const userId = 'demo_user';

        // ดึงข้อมูล user (displayName, address)
        const user = await User.findOne({ username: userId });

        // ถ้าจ่ายด้วย wallet ต้องหักเงิน
        if (paymentMethod === 'wallet') {
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            if (user.balance < total) {
                return res.status(400).json({ success: false, message: 'Insufficient balance' });
            }

            // หักเงินจาก wallet
            user.balance -= total;
            await user.save();
        }

        // สร้าง order ใหม่ (รวม user info)
        const order = await Order.create({
            userId,
            userDisplayName: user?.displayName || 'Customer',
            userAddress: user?.address || '',
            shopId,
            shopName,
            items,
            serviceTotal,
            deliveryFee,
            total,
            paymentMethod,
            status: 'rider_coming' // เริ่มต้นที่สถานะ rider กำลังมา
        });

        res.status(201).json({
            success: true,
            order,
            message: 'Order created successfully!'
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
};

// ดึง Order ตาม ID
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Get Order By ID Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get order' });
    }
};

// ดึง Order ที่กำลังดำเนินการ (ยังไม่เสร็จ/ยกเลิก)
export const getActiveOrder = async (req: Request, res: Response) => {
    try {
        const userId = 'demo_user';

        // หา order ที่ยังไม่เสร็จ (ไม่ใช่ completed หรือ cancelled) เรียงจากใหม่สุด
        const activeOrder = await Order.findOne({
            userId,
            status: { $nin: ['completed', 'cancelled'] }
        }).sort({ createdAt: -1 });

        if (!activeOrder) {
            return res.json({ hasActiveOrder: false, order: null });
        }

        res.json({
            hasActiveOrder: true,
            order: activeOrder
        });
    } catch (error) {
        console.error('Get Active Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get active order' });
    }
};

// อัพเดทสถานะ Order
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};

// ดึง Order ทั้งหมดของ User (ประวัติ)
export const getOrderHistory = async (req: Request, res: Response) => {
    try {
        const userId = 'demo_user';

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ orders });
    } catch (error) {
        console.error('Get Order History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get order history' });
    }
};
