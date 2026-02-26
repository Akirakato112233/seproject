import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import googleAuthRoutes from './routes/googleAuth';
import redeemRoutes from './routes/redeem';
import ridersRoutes from './routes/riders';
import shopsRoutes from './routes/shops';
import orderRoutes from './routes/orderRoutes';
import { Order } from './models/Order';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);
app.use('/api/google/', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/redeem', redeemRoutes);
// DEV: สร้าง test order โดยไม่ต้อง auth (ต้องวางก่อน orderRoutes เพราะ orderRoutes ต้อง auth ทุก route)
app.post('/api/orders/pending/dev-create', async (req, res) => {
  try {
    const { shopName, shopAddress, userDisplayName, userAddress, items, serviceTotal, deliveryFee, total, paymentMethod } = req.body;

    const order = await Order.create({
      userId: 'dev-test-user',
      userDisplayName: userDisplayName || 'Test User',
      userAddress: userAddress || 'Test Address',
      shopId: 'dev-shop-id',
      shopName: shopName || 'Test Shop',
      items: items || [],
      serviceTotal: serviceTotal || 0,
      deliveryFee: deliveryFee || 0,
      total: total || 0,
      paymentMethod: paymentMethod || 'cash',
      status: 'decision',
    });

    console.log('✅ DEV Test Order Created:', order._id);
    console.log('📅 Order createdAt:', order.createdAt);
    console.log('📅 Order updatedAt:', order.updatedAt);
    res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error('❌ DEV Create Order Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/api/orders', orderRoutes);
app.use('/api/google', googleAuthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
connectDB();

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
