# 🚀 Backend Setup Guide - MongoDB + Express + Node.js

## 📋 สารบัญ

1. [การติดตั้ง Backend](#การติดตั้ง-backend)
2. [การตั้งค่า MongoDB](#การตั้งค่า-mongodb)
3. [โครงสร้าง Backend](#โครงสร้าง-backend)
4. [การเชื่อมต่อ Frontend](#การเชื่อมต่อ-frontend)

---

## 🔧 การติดตั้ง Backend

### 1. สร้างโฟลเดอร์ Backend (แยกจาก Frontend)

```bash
# สร้างโฟลเดอร์ใหม่
mkdir laundry-backend
cd laundry-backend

# สร้าง package.json
npm init -y
```

### 2. ติดตั้ง Dependencies

```bash
npm install express mongoose cors dotenv
npm install -D @types/express @types/node typescript ts-node nodemon
```

### 3. สร้างไฟล์ `package.json` scripts

```json
{
    "scripts": {
        "dev": "nodemon src/server.ts",
        "build": "tsc",
        "start": "node dist/server.js"
    }
}
```

---

## 🗄️ การตั้งค่า MongoDB

### ตัวเลือก 1: MongoDB Atlas (Cloud - ฟรี)

1. ไปที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Account และ Cluster ฟรี
3. สร้าง Database User
4. เอา Connection String มาใช้

### ตัวเลือก 2: MongoDB Local

```bash
# ติดตั้ง MongoDB บนเครื่อง
# Windows: ดาวน์โหลดจาก mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb
```

---

## 📁 โครงสร้าง Backend

```
laundry-backend/
├── src/
│   ├── server.ts          # Entry point
│   ├── config/
│   │   └── database.ts    # MongoDB connection
│   ├── models/
│   │   └── Shop.ts        # Mongoose model
│   ├── routes/
│   │   └── shops.ts       # API routes
│   └── controllers/
│       └── shopController.ts
├── .env                   # Environment variables
├── tsconfig.json
└── package.json
```

---

## 💻 ตัวอย่างโค้ด Backend

### 1. `src/config/database.ts`

```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry';

        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
```

### 2. `src/models/Shop.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
    name: string;
    rating: number;
    reviewCount: number;
    priceLevel: number; // 1-4
    type: 'coin' | 'full';
    deliveryFee: number;
    deliveryTime: number; // minutes
    imageUrl?: string;
    location?: {
        lat: number;
        lng: number;
    };
}

const ShopSchema = new Schema<IShop>(
    {
        name: { type: String, required: true },
        rating: { type: Number, required: true, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
        priceLevel: { type: Number, required: true, min: 1, max: 4 },
        type: { type: String, enum: ['coin', 'full'], required: true },
        deliveryFee: { type: Number, required: true },
        deliveryTime: { type: Number, required: true },
        imageUrl: { type: String },
        location: {
            lat: { type: Number },
            lng: { type: Number },
        },
    },
    {
        timestamps: true, // เพิ่ม createdAt, updatedAt อัตโนมัติ
    }
);

export const Shop = mongoose.model<IShop>('Shop', ShopSchema);
```

### 3. `src/controllers/shopController.ts`

```typescript
import { Request, Response } from 'express';
import { Shop } from '../models/Shop';

export const getShops = async (req: Request, res: Response) => {
    try {
        const { type, rating, price, delivery, nearMe, promo, open } = req.query;

        // สร้าง query object
        const query: any = {};

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Filter by rating (มากกว่าหรือเท่ากับ)
        if (rating) {
            query.rating = { $gte: Number(rating) };
        }

        // Filter by price level
        if (price) {
            query.priceLevel = Number(price);
        }

        // Filter by delivery fee
        if (delivery && delivery !== 'Any') {
            const maxFee = parseInt(delivery.toString().replace(/\D/g, ''));
            query.deliveryFee = { $lte: maxFee };
        }

        // TODO: Filter by nearMe (ต้องใช้ location)
        // TODO: Filter by promo (ต้องมี field ใน database)
        // TODO: Filter by open (ต้องมี field openingHours)

        const shops = await Shop.find(query).sort({ rating: -1 });

        res.json(shops);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
};

export const getShopById = async (req: Request, res: Response) => {
    try {
        const shop = await Shop.findById(req.params.id);

        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        res.json(shop);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shop' });
    }
};
```

### 4. `src/routes/shops.ts`

```typescript
import { Router } from 'express';
import { getShops, getShopById } from '../controllers/shopController';

const router = Router();

router.get('/', getShops);
router.get('/:id', getShopById);

export default router;
```

### 5. `src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import shopsRoutes from './routes/shops';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // อนุญาตให้ React Native เรียก API ได้
app.use(express.json());

// Routes
app.use('/api/shops', shopsRoutes);

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
```

### 6. `.env`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/laundry
# หรือใช้ MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laundry?retryWrites=true&w=majority
```

### 7. `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
}
```

---

## 🔗 การเชื่อมต่อ Frontend

### 1. เปลี่ยน URL ใน `services/api.ts`

```typescript
// สำหรับ Android Emulator
const API_BASE_URL = 'http://10.64.71.179:3000/api';

// สำหรับ iOS Simulator
const API_BASE_URL = 'http://localhost:3000/api';

// สำหรับ Device จริง (ใช้ IP address ของคอมพิวเตอร์)
const API_BASE_URL = 'http://10.64.71.179:3000/api';
```

### 2. เปลี่ยน `useMockData` ใน `app/index.tsx`

```typescript
const { shops, loading, error } = useShops({
  filters: { ... },
  useMockData: false, // เปลี่ยนเป็น false เพื่อใช้ API จริง
});
```

---

## 🧪 ทดสอบ API

### 1. เริ่ม Backend Server

```bash
npm run dev
```

### 2. ทดสอบด้วย Postman หรือ Browser

```
GET http://localhost:3000/api/shops
GET http://localhost:3000/api/shops?type=coin&rating=4
GET http://localhost:3000/api/shops/1234567890
```

### 3. เพิ่มข้อมูลตัวอย่างใน MongoDB

```javascript
// ใช้ MongoDB Compass หรือ mongo shell
db.shops.insertMany([
    {
        name: 'oi oi oi (หยอดเหรียญจร้า) - บ้านพิม',
        rating: 4.9,
        reviewCount: 2000,
        priceLevel: 3,
        type: 'coin',
        deliveryFee: 10,
        deliveryTime: 35,
    },
    // ... เพิ่มข้อมูลอื่นๆ
]);
```

---

## 📝 สรุป

1. **Backend**: Node.js + Express + MongoDB
2. **Frontend**: React Native เรียก API ผ่าน `fetch()`
3. **URL**: เปลี่ยนตาม environment (emulator/simulator/device)
4. **Mock Data**: ใช้ fallback เมื่อ API ไม่พร้อม

---

## 🆘 Troubleshooting

### CORS Error

- ตรวจสอบว่าใช้ `cors()` middleware ใน Express

### Connection Refused

- ตรวจสอบว่า Backend server กำลังรันอยู่
- ตรวจสอบ URL และ Port
- สำหรับ device จริง ต้องใช้ IP address ไม่ใช่ localhost

### MongoDB Connection Error

- ตรวจสอบ Connection String
- ตรวจสอบว่า MongoDB กำลังรันอยู่
- สำหรับ MongoDB Atlas ตรวจสอบ Network Access
