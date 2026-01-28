import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import redeemRoutes from './routes/redeem';
import ridersRoutes from './routes/riders';
import shopsRoutes from './routes/shops';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
