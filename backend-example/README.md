# 📦 Backend Example - Laundry App API

นี่คือตัวอย่างโค้ด Backend ที่สมบูรณ์สำหรับ Laundry App

## 🚀 Quick Start

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้างไฟล์ .env
cp .env.example .env

# 3. แก้ไข MONGODB_URI ใน .env

# 4. รัน server
npm run dev
```

## 📁 โครงสร้าง

```
backend-example/
├── src/
│   ├── server.ts
│   ├── config/
│   │   └── database.ts
│   ├── models/
│   │   └── Shop.ts
│   ├── routes/
│   │   └── shops.ts
│   └── controllers/
│       └── shopController.ts
├── .env.example
└── package.json
```

## 🔗 API Endpoints

- `GET /api/shops` - ดึงรายการร้านทั้งหมด
- `GET /api/shops/:id` - ดึงข้อมูลร้านตาม ID
- `GET /api/shops?type=coin&rating=4` - ดึงร้านพร้อม filter
