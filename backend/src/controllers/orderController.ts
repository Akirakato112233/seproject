import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Shop } from '../models/Shop';

// สร้าง Order ใหม่
export const createOrder = async (req: AuthRequest, res: Response) => {
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

        // ถ้าจ่ายด้วย wallet ต้องหักเงิน
        if (paymentMethod === 'wallet') {
            if (user.balance < total) {
                return res.status(400).json({ success: false, message: 'Insufficient balance' });
            }

            // หักเงินจาก wallet
            await User.findByIdAndUpdate(
                userId,
                { $inc: { balance: -total } }
            );
            console.log('Wallet deducted:', total);
        }

        // สร้าง order ใหม่ (รวม user info จาก database)
        const orderData = {
            userId,
            userDisplayName: user.displayName || 'Unknown User',
            userAddress: user.address || 'No address set',
            shopId,
            shopName,
            items,
            serviceTotal,
            deliveryFee,
            total,
            paymentMethod: paymentMethod || 'cash',
            status: 'rider_coming' // เริ่มต้นที่สถานะ rider กำลังมา
        };

        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

        const order = await Order.create(orderData);
        console.log('Order created successfully:', order._id);

        res.status(201).json({
            success: true,
            order,
            message: 'Order created successfully!'
        });
    } catch (error: any) {
        console.error('=== CREATE ORDER ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

// ดึง Order ตาม ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
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
export const getActiveOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

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
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
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
export const getOrderHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ orders });
    } catch (error) {
        console.error('Get Order History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get order history' });
    }
};

// ดึง Order ที่รอ Rider รับงาน (status = 'rider_coming')
export const getPendingOrders = async (req: AuthRequest, res: Response) => {
    try {
        console.log('📦 Fetching pending orders...');
        const orders = await Order.find({
            status: { $in: ['rider_coming', 'pending'] }
        }).sort({ createdAt: -1 });

        console.log(`✅ Found ${orders.length} pending orders`);

        // Map ข้อมูลให้ตรงกับ Rider App Order type
        const enrichedOrders = await Promise.all(orders.map(async (order) => {
            // พิกัดลูกค้า (ที่รับผ้า/ส่งผ้า) - ยังไม่มีใน User ใช้ default ก่อน
            const customerCoords = { latitude: 13.113625, longitude: 100.919286 };
    

            let shop = null;
            if (order.shopId && /^[0-9a-fA-F]{24}$/.test(String(order.shopId))) {
                shop = await Shop.findById(order.shopId);
            }

            const shopCoords = shop?.location
                ? { latitude: shop.location.lat, longitude: shop.location.lng }
                : { latitude: 13.117629, longitude: 100.916613 };

            return {
                id: String(order._id),
                shopName: order.shopName || shop?.name || 'Unknown Shop',
                shopAddress: shop?.name || 'ไม่ระบุที่อยู่ร้าน',
                customerName: order.userDisplayName || 'Customer',
                customerAddress: order.userAddress || 'ไม่ระบุที่อยู่',
                distance: '1.5 km',
                fee: order.total || 0,
                items: Array.isArray(order.items) ? order.items.length : 0,
                pickup: customerCoords,   // ที่รับผ้า = ที่อยู่ลูกค้า
                dropoff: customerCoords,  // ที่ส่งผ้า = ที่อยู่ลูกค้า
                shop: shopCoords,         // พิกัดร้าน (ไปร้านหลังรับผ้า)
                paymentMethod: order.paymentMethod || 'cash',
            };
        }));

        console.log('✅ Orders enriched successfully');
        res.json({ success: true, orders: enrichedOrders });
    } catch (error) {
        console.error('❌ Get Pending Orders Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get pending orders' });
    }
};
