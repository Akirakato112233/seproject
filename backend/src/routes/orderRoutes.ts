import { Router } from 'express';
import {
    createOrder,
    getOrderById,
    getActiveOrder,
    updateOrderStatus,
    getOrderHistory,
    getPendingOrders,
    getMerchantPendingOrders,
    getMerchantCurrentOrders,
    getMerchantOrderHistory,
    merchantAcceptOrder,
    merchantUpdateOrderStatus
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/orders/pending - ดึง order ที่รอ Rider (ไม่ต้อง auth เพื่อให้ dev mode ใช้ได้)
router.get('/pending', getPendingOrders);

// GET /api/orders/merchant/:shopId/pending - ดึง order ที่รอ Merchant รับ (สำหรับร้าน)
router.get('/merchant/:shopId/pending', getMerchantPendingOrders);

// GET /api/orders/merchant/:shopId/current - ดึง order ที่ร้านกำลังดำเนินการ
router.get('/merchant/:shopId/current', getMerchantCurrentOrders);

// GET /api/orders/merchant/:shopId/history - ดึงประวัติออเดอร์ที่ completed จาก ordersformerchant + orders
router.get('/merchant/:shopId/history', getMerchantOrderHistory);

// POST /api/orders/:orderId/merchant-accept - Merchant รับ order (ไม่ต้อง auth)
router.post('/:orderId/merchant-accept', merchantAcceptOrder);

// PATCH /api/orders/:orderId/merchant-status - Merchant อัพเดทสถานะ (ไม่ต้อง auth)
router.patch('/:orderId/merchant-status', merchantUpdateOrderStatus);

// Apply auth middleware to remaining order routes
router.use(authenticateToken);

// POST /api/orders - สร้าง order ใหม่
router.post('/', createOrder);

// GET /api/orders/active - ดึง order ที่กำลังดำเนินการ
router.get('/active', getActiveOrder);

// GET /api/orders/history - ดึงประวัติ orders
router.get('/history', getOrderHistory);

// GET /api/orders/:orderId - ดึง order ตาม ID
router.get('/:orderId', getOrderById);

// PATCH /api/orders/:orderId/status - อัพเดทสถานะ order
router.patch('/:orderId/status', updateOrderStatus);

export default router;
