/**
 * Backfill: โอนเงินเข้า Shop.balance สำหรับออเดอร์ที่ completed แต่ยังไม่เคยได้ credit
 * รัน: npm run backfill-shop-credits
 */
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Order } from '../models/Order';
import { Shop } from '../models/Shop';

dotenv.config();

async function backfill() {
  await connectDB();

  const orders = await Order.find({
    status: 'completed',
    shopBalanceCredited: { $ne: true },
    shopId: { $exists: true, $ne: null },
    total: { $gt: 0 },
  }).lean();

  console.log(`พบออเดอร์ที่ยังไม่ได้รับ credit: ${orders.length} รายการ`);

  let credited = 0;
  for (const o of orders) {
    const amt = Math.round(Number(o.serviceTotal) || Number(o.total) || 0);
    const shopId = o.shopId;
    if (amt <= 0 || !shopId) continue;

    try {
      await Shop.findByIdAndUpdate(shopId, { $inc: { balance: amt } });
      await Order.findByIdAndUpdate(o._id, { $set: { shopBalanceCredited: true } });
      credited++;
      console.log(`  ✓ Order ${o._id} → โอน ฿${amt} เข้า Shop ${shopId}`);
    } catch (err) {
      console.error(`  ✗ Order ${o._id} failed:`, err);
    }
  }

  console.log(`\nเสร็จสิ้น: โอนเงินให้ ${credited} ออเดอร์`);
  await import('mongoose').then((m) => m.default.disconnect());
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
