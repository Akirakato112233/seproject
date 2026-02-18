import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { ObjectId } from 'mongodb';

dotenv.config();

const sampleUsers = [
  {
    _id: new ObjectId('698e27ff93d8fdbda13bb05c'),
    username: 'dev-user',
    email: 'dev-user@example.com',
    displayName: 'Dev user',
    phone: '',
    address: '',
    balance: 9999,
    role: 'user',
    isOnboarded: true,
    createdAt: new Date('2026-02-12T19:20:30.622+00:00'),
    updatedAt: new Date('2026-02-12T19:42:46.143+00:00'),
  },
  {
    username: 'testuser1',
    email: 'test1@example.com',
    displayName: 'ทดสอบ ผู้ใช้',
    phone: '+66812345678',
    address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเต็น กรุงเทพมหานคร 10110',
    balance: 500,
    googleSub: 'google_test_1',
    isOnboarded: true,
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    displayName: 'นาย สมชาย ใจดี',
    phone: '+66898765432',
    address: '456 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400',
    balance: 1200,
    googleSub: 'google_test_2',
    isOnboarded: true,
  },
  {
    username: 'testuser3',
    email: 'test3@example.com',
    displayName: 'คุณ สมศรี มีสุข',
    phone: '+66876543210',
    address: '789 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
    balance: 300,
    googleSub: 'google_test_3',
    isOnboarded: true,
  },
];

const seedUsers = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await connectDB();

    // ลบข้อมูล users เก่าทั้งหมด (ถ้ามี)
    await User.deleteMany({});
    console.log('🗑️  ลบข้อมูล users เก่าแล้ว');

    // สร้าง users ใหม่
    const users = await User.insertMany(sampleUsers.map(user => {
      const userData: any = {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        address: user.address,
        balance: user.balance,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
      };

      // เพิ่ม field พิเศษถ้ามี
      if (user.googleSub) userData.googleSub = user.googleSub;
      if (user.role) userData.role = user.role;
      if (user._id) userData._id = user._id;

      return userData;
    }));

    console.log(`✅ เพิ่มข้อมูล ${users.length} users เรียบร้อยแล้ว!`);

    // แสดงข้อมูลที่เพิ่ม
    console.log('\n📋 รายการ users ที่เพิ่ม:');
    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.displayName} - ${user.email} - ยอดเงิน: ฿${user.balance}`);
      if (user._id.toString() === '698e27ff93d8fdbda13bb05c') {
        console.log(`   ⭐ DEV USER (ID: ${user._id})`);
      }
    });

    console.log('\n🎉 สามารถทดสอบได้แล้ว!');
    console.log('📱 Dev user พร้อมใช้งานสำหรับ dev:skip-login:');
    console.log('   - Dev user (ID: 698e27ff93d8fdbda13bb05c) - Balance: ฿9999');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

// รัน script
seedUsers();
