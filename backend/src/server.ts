/**
 * Express server entry: CORS, JSON body, rate limiting, static uploads, and API routes.
 * Auth routes handle profile (name, phone, profile photo URL). Use ngrok in dev and set trust proxy.
 */
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import googleAuthRoutes from './routes/googleAuth';
import merchantAuthRoutes from './routes/merchantAuth';
import redeemRoutes from './routes/redeem';
import ridersRoutes from './routes/riders';
import shopsRoutes from './routes/shops';
import orderRoutes from './routes/orderRoutes';
import { Order } from './models/Order';
import { Shop } from './models/Shop';

dotenv.config();

const dns = require("dns");
const app = express();
const PORT = process.env.PORT || 3000;
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// ต้อง trust proxy เมื่อใช้ ngrok (X-Forwarded-For)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// โหมด dev หรือใช้ผ่าน ngrok: ผ่อน limit (ทุกเครื่องใช้ IP เดียว)
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 200,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);
app.use('/api/google/', authLimiter);
app.use('/api/merchants/', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/redeem', redeemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api/merchants', merchantAuthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
connectDB();

// Cron: ตรวจสอบ coin wash/dry เสร็จ → อัปเดต order เป็น Ready for Pickup
function runCoinCompletionCron() {
  Order.updateMany(
    { status: 'at_shop', coinWashFinishTime: { $lte: new Date(), $exists: true, $ne: null } },
    { $set: { status: 'in_progress', coinWashDone: true }, $unset: { coinWashFinishTime: '' } }
  )
    .then((r) => {
      if (r.modifiedCount > 0)
        console.log('[Coin Cron] Wash completed:', r.modifiedCount, 'orders');
    })
    .catch((e) => console.error('[Coin Cron] Wash error:', e));

  Order.updateMany(
    { status: 'at_shop', coinDryFinishTime: { $lte: new Date(), $exists: true, $ne: null } },
    { $set: { status: 'in_progress', coinDryDone: true }, $unset: { coinDryFinishTime: '' } }
  )
    .then((r) => {
      if (r.modifiedCount > 0) console.log('[Coin Cron] Dry completed:', r.modifiedCount, 'orders');
    })
    .catch((e) => console.error('[Coin Cron] Dry error:', e));
}

// Cron: เครื่องซัก/อบในร้าน coin เสร็จแล้ว → เปลี่ยน status เป็น ready
// และอัปเดต Order ที่ใช้เครื่องนั้นเป็น Ready for Pickup (in_progress)
async function runShopMachineCompletionCron() {
  const now = new Date();

  const setWashReady = (r: { modifiedCount: number }) => {
    if (r.modifiedCount > 0)
      console.log('[Coin Cron] Shop wash machines set to ready:', r.modifiedCount);
  };
  const setDryReady = (r: { modifiedCount: number }) => {
    if (r.modifiedCount > 0)
      console.log('[Coin Cron] Shop dry machines set to ready:', r.modifiedCount);
  };

  // เครื่องซัก: busy → ready เมื่อ finishTime ผ่าน (รอไรเดอร์มารับ)
  await Shop.updateMany(
    { type: 'coin', 'washServices.status': 'busy' },
    { $set: { 'washServices.$[elem].status': 'ready', 'washServices.$[elem].finishTime': null } },
    { arrayFilters: [{ 'elem.status': 'busy', 'elem.finishTime': { $lte: now } }] }
  )
    .then(setWashReady)
    .catch((e) => console.error('[Coin Cron] Shop wash error:', e));

  // เครื่องซัก: busy + finishTime เป็น null → ready
  await Shop.updateMany(
    { type: 'coin', 'washServices.status': 'busy' },
    { $set: { 'washServices.$[elem].status': 'ready', 'washServices.$[elem].finishTime': null } },
    { arrayFilters: [{ 'elem.status': 'busy', 'elem.finishTime': null }] }
  )
    .then(setWashReady)
    .catch((e) => console.error('[Coin Cron] Shop wash (null) error:', e));

  // เครื่องอบ: busy → ready เมื่อ finishTime ผ่าน
  await Shop.updateMany(
    { type: 'coin', 'dryServices.status': 'busy' },
    { $set: { 'dryServices.$[elem].status': 'ready', 'dryServices.$[elem].finishTime': null } },
    { arrayFilters: [{ 'elem.status': 'busy', 'elem.finishTime': { $lte: now } }] }
  )
    .then(setDryReady)
    .catch((e) => console.error('[Coin Cron] Shop dry error:', e));

  // เครื่องอบ: busy + finishTime เป็น null → ready
  await Shop.updateMany(
    { type: 'coin', 'dryServices.status': 'busy' },
    { $set: { 'dryServices.$[elem].status': 'ready', 'dryServices.$[elem].finishTime': null } },
    { arrayFilters: [{ 'elem.status': 'busy', 'elem.finishTime': null }] }
  )
    .then(setDryReady)
    .catch((e) => console.error('[Coin Cron] Shop dry (null) error:', e));

  // เครื่อง ready แล้ว → อัปเดต Order ที่ใช้เครื่องนั้นเป็น Ready for Pickup
  try {
    const shops = await Shop.find({ type: 'coin' }).lean();
    for (const shop of shops) {
      const shopId = String(shop._id);
      const washServices = shop.washServices || [];
      for (let i = 0; i < washServices.length; i++) {
        if (washServices[i].status === 'ready') {
          const r = await Order.updateMany(
            { shopId, status: 'at_shop', washMachineIndex: i },
            {
              $set: { status: 'in_progress', coinWashDone: true },
              $unset: { coinWashFinishTime: '' },
            }
          );
          if (r.modifiedCount > 0)
            console.log('[Coin Cron] Orders → Ready for Pickup (wash):', r.modifiedCount);
        }
      }
      const dryServices = shop.dryServices || [];
      for (let i = 0; i < dryServices.length; i++) {
        if (dryServices[i].status === 'ready') {
          const r = await Order.updateMany(
            { shopId, status: 'at_shop', dryMachineIndex: i },
            {
              $set: { status: 'in_progress', coinDryDone: true },
              $unset: { coinDryFinishTime: '' },
            }
          );
          if (r.modifiedCount > 0)
            console.log('[Coin Cron] Orders → Ready for Pickup (dry):', r.modifiedCount);
        }
      }
    }
    // Fallback: Order ที่ coinWashFinishTime ผ่านแล้วแต่ยังไม่มี washMachineIndex (order เก่า)
    const r = await Order.updateMany(
      { status: 'at_shop', coinWashFinishTime: { $lte: now, $exists: true, $ne: null } },
      { $set: { status: 'in_progress', coinWashDone: true }, $unset: { coinWashFinishTime: '' } }
    );
    if (r.modifiedCount > 0)
      console.log('[Coin Cron] Orders → Ready for Pickup (fallback):', r.modifiedCount);
  } catch (e) {
    console.error('[Coin Cron] Order update error:', e);
  }
}

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  // รอ DB connect ก่อนรัน cron (connectDB ถูกเรียกก่อน listen แต่อาจยังไม่เสร็จ)
  setTimeout(() => {
    runCoinCompletionCron();
    runShopMachineCompletionCron();
  }, 2000);
  setInterval(runCoinCompletionCron, 15000); // ทุก 15 วินาที
  setInterval(runShopMachineCompletionCron, 15000); // ทุก 15 วินาที
});
