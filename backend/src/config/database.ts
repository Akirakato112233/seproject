import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry';

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // ไม่ exit เพื่อให้ server ยังรันได้ (health check ยังใช้ได้) — รีสตาร์ทเมื่อเน็ตกลับ
  }
};
