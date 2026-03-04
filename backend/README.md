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

### Shops (example)
- `GET /api/shops` - ดึงรายการร้านทั้งหมด
- `GET /api/shops/:id` - ดึงข้อมูลร้านตาม ID
- `GET /api/shops?type=coin&rating=4` - ดึงร้านพร้อม filter

### Auth / user profile
- `GET /api/auth/user/:userId` - ดึงข้อมูล user รวม profilePhoto
- `PUT /api/auth/update-profile/:userId` - แก้ displayName และ/หรือ phone (body: `{ displayName?, phone? }`). เบอร์โทรต้อง 10 หลัก ขึ้นต้นด้วย 0
- `PUT /api/auth/update-photo/:userId` - เก็บ URL รูปโปรไฟล์ (body: `{ profilePhoto: string }`) ใช้คู่กับ Supabase Storage
