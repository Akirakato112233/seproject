import { Router } from 'express';
import {
    createOrder,
    getOrderById,
    getActiveOrder,
    updateOrderStatus,
    getOrderHistory
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all order routes
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
