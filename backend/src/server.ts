import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
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
app.use(cors()); // อนุญาตให้ React Native เรียก API ได้
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/redeem', redeemRoutes);
// DEV: สร้าง test order โดยไม่ต้อง auth (ต้องวางก่อน orderRoutes เพราะ orderRoutes ต้อง auth ทุก route)
app.post('/api/orders/pending/dev-create', async (req, res) => {
  try {
    const { shopId, shopName, shopAddress, userDisplayName, userAddress, items, serviceTotal, deliveryFee, total, paymentMethod } = req.body;

    const order = await Order.create({
      userId: 'dev-test-user',
      userDisplayName: userDisplayName || 'Test User',
      userAddress: userAddress || 'Test Address',
      shopId: shopId || 'dev-shop-id', // ใช้ shopId จาก request หรือ fallback
      shopName: shopName || 'Test Shop',
      items: items || [],
      serviceTotal: serviceTotal || 0,
      deliveryFee: deliveryFee || 0,
      total: total || 0,
      paymentMethod: paymentMethod || 'cash',
      status: 'rider_coming',
    });

    console.log('✅ DEV Test Order Created:', order._id);
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
