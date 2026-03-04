import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Order } from '../models/Order';
import { Shop } from '../models/Shop';

dotenv.config();

const sampleOrders = [
  {
    shopName: 'oi oi oi (หยอดเหรียญจร้า) - บ้านพิม',
    userDisplayName: 'ทดสอบ ผู้ใช้',
    userAddress: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเต็น กรุงเทพมหานคร 10110',
    items: [
      { name: 'ซัก 9 โล (น้ำอุ่น)', details: 'Warm water ≈ 40°, 40 นาที', price: 50 },
      { name: 'อบ 15 โล (ความร้อนปานกลาง)', details: 'Medium Heat 50°-60° C, 40 นาที', price: 50 },
    ],
    serviceTotal: 100,
    deliveryFee: 10,
    total: 110,
    paymentMethod: 'cash',
    status: 'rider_coming',
  },
  {
    shopName: 'Clean & Fresh Laundry',
    userDisplayName: 'นาย สมชาย ใจดี',
    userAddress: '456 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400',
    items: [
      { name: 'ซัก 14 โล (น้ำร้อน)', details: 'Hot water ≈ 60°, 45 นาที', price: 85 },
      { name: 'รีดผ้า', details: 'บริการรีดผ้าทั่วไป', price: 30 },
    ],
    serviceTotal: 115,
    deliveryFee: 20,
    total: 135,
    paymentMethod: 'wallet',
    status: 'at_shop',
  },
  {
    shopName: 'Quick Wash Coin Laundry',
    userDisplayName: 'คุณ สมศรี มีสุข',
    userAddress: '789 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
    items: [
      { name: 'ซัก 9 โล (เย็น)', details: 'Cold, 30 นาที', price: 35 },
      { name: 'อบ 15 โล (ร้อนน้อย)', details: 'Low Heat 30°-40° C, 40 นาที', price: 45 },
    ],
    serviceTotal: 80,
    deliveryFee: 15,
    total: 95,
    paymentMethod: 'cash',
    status: 'out_for_delivery',
  },
];

const seedOrders = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await connectDB();

    // ตรวจสอบว่ามีร้านค้าอยู่แล้วหรือไม่
    const shopCount = await Shop.countDocuments();
    if (shopCount === 0) {
      console.log('❌ ไม่พบข้อมูลร้านค้า กรุณารัน npm run seed ก่อนเพื่อสร้างข้อมูลร้านค้า');
      process.exit(1);
    }

    // ลบข้อมูล orders เก่าทั้งหมด (ถ้ามี)
    await Order.deleteMany({});
    console.log('🗑️  ลบข้อมูล orders เก่าแล้ว');

    // สร้าง orders ใหม่
    const orders = await Order.insertMany(
      sampleOrders.map((order) => ({
        ...order,
        userId: 'dev-test-user',
        shopId: 'dev-shop-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    console.log(`✅ เพิ่มข้อมูล ${orders.length} orders เรียบร้อยแล้ว!`);

    // แสดงข้อมูลที่เพิ่ม
    console.log('\n📋 รายการ orders ที่เพิ่ม:');
    orders.forEach((order: any, index: number) => {
      console.log(
        `${index + 1}. ${order.shopName} - ${order.userDisplayName} - สถานะ: ${order.status} - ราคา: ฿${order.total}`
      );
    });

    console.log('\n🎉 สามารถทดสอบได้แล้ว!');
    console.log('📱 ลองเปิด user-app และสั่งซื้อสินค้า หรือทดสอบกับ order IDs:');
    orders.forEach((order: any) => {
      console.log(`   - Order ID: ${order._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    process.exit(1);
  }
};

// รัน script
seedOrders();
