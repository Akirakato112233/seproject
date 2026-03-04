import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models/User';

dotenv.config();

// Update demo_user ให้มี displayName และ address
const updateDemoUser = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to MongoDB');

    // Update demo_user
    const result = await User.findOneAndUpdate(
      { username: 'demo_user' },
      {
        displayName: 'Bakugoa ku',
        address: 'The One Place Sriracha (ร้า พอม)',
      },
      { new: true, upsert: true } // upsert = สร้างใหม่ถ้าไม่มี
    );

    console.log('✅ Updated demo_user:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateDemoUser();
