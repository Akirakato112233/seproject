import { Router } from 'express';
import {
    createOrder,
    getOrderById,
    getActiveOrder,
    updateOrderStatus,
    getOrderHistory,
    getPendingOrders,
    getRiderReadyForPickup,
    getRiderAtShopOrders,
    getMerchantPendingOrders,
    getMerchantCurrentOrders,
    getMerchantOrderHistory,
    merchantAcceptOrder,
    merchantUpdateOrderStatus,
    startCoinWash,
    startCoinDry
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/orders/pending - ดึง order ที่รอ Rider (ไม่ต้อง auth เพื่อให้ dev mode ใช้ได้)
router.get('/pending', getPendingOrders);

// GET /api/orders/rider/ready-for-pickup?riderId=xxx - ออเดอร์ที่ร้านซักเสร็จแล้ว รอไรเดอร์มารับ
router.get('/rider/ready-for-pickup', getRiderReadyForPickup);
// GET /api/orders/rider/at-shop?riderId=xxx - ออเดอร์ที่อยู่ที่ร้านกำลังซัก (In progress ฝั่งร้าน)
router.get('/rider/at-shop', getRiderAtShopOrders);

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

// PATCH /api/orders/:orderId/status - อัพเดทสถานะ order (Rider ใช้ - ไม่ต้อง auth)
router.patch('/:orderId/status', updateOrderStatus);

// POST /api/orders/:orderId/start-coin-wash - Rider เริ่มเครื่องซัก (ร้าน coin)
router.post('/:orderId/start-coin-wash', startCoinWash);
// POST /api/orders/:orderId/start-coin-dry - Rider เริ่มเครื่องอบ (ร้าน coin)
router.post('/:orderId/start-coin-dry', startCoinDry);

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

// (moved above auth middleware)

export default router;
