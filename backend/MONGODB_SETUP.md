# 🔗 วิธีเชื่อมต่อ MongoDB Atlas

## ขั้นตอนที่ 1: เอา Connection String จาก MongoDB Atlas

1. ไปที่ [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. คลิกที่ **"Connect"** บน Cluster ของคุณ
3. เลือก **"Connect your application"**
4. Copy **Connection String** ที่ได้
   - ตัวอย่าง: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. แทนที่ `<password>` ด้วย password จริงของคุณ
6. แทนที่ database name เป็น `Wit` (หรือชื่อ database ที่คุณใช้)

## ขั้นตอนที่ 2: ตั้งค่า Network Access

1. ใน MongoDB Atlas Dashboard
2. ไปที่ **"Network Access"** (เมนูซ้าย)
3. คลิก **"Add IP Address"**
4. เลือก **"Allow Access from Anywhere"** (0.0.0.0/0) สำหรับ development
   - หรือเพิ่ม IP address เฉพาะของคอมพิวเตอร์คุณ

## ขั้นตอนที่ 3: สร้างไฟล์ .env

```bash
cd backend-example
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/Wit?retryWrites=true&w=majority
```

**⚠️ หมายเหตุ:**
- แทนที่ `username` และ `password` ด้วยข้อมูลจริง
- แทนที่ `cluster0.xxxxx.mongodb.net` ด้วย cluster ของคุณ
- แทนที่ `Wit` ด้วยชื่อ database ของคุณ (ถ้าไม่ใช่ Wit)

## ขั้นตอนที่ 4: ตรวจสอบ Collection Name

ใน MongoDB Atlas ของคุณมี collection ชื่อ **"ร้านซักผ้า"**

ต้องแก้ไข model ให้ตรงกับ collection name:

```typescript
// ใน src/models/Shop.ts
export const Shop = mongoose.model<IShop>('Shop', ShopSchema, 'ร้านซักผ้า');
// หรือ
export const Shop = mongoose.model<IShop>('Shop', ShopSchema, 'shops'); // ถ้าต้องการใช้ชื่ออื่น
```

## ขั้นตอนที่ 5: ตรวจสอบ Schema

ตรวจสอบว่า fields ใน database ตรงกับ model หรือไม่:

- `name` - ชื่อร้าน
- `rating` - คะแนน
- `reviewCount` - จำนวนรีวิว
- `priceLevel` - ระดับราคา (1-4)
- `type` - ประเภท ('coin' หรือ 'full')
- `deliveryFee` - ค่าจัดส่ง
- `deliveryTime` - เวลาจัดส่ง (นาที)
- `imageUrl` - URL รูปภาพ (optional)

## ขั้นตอนที่ 6: ทดสอบการเชื่อมต่อ

```bash
cd backend-example
npm install
npm run dev
```

ถ้าเห็นข้อความ **"✅ MongoDB Connected"** แสดงว่าสำเร็จ!

## 🆘 Troubleshooting

### Connection Error
- ตรวจสอบ Connection String ว่าถูกต้อง
- ตรวจสอบ Network Access ว่า allow IP ของคุณแล้ว
- ตรวจสอบ username/password ว่าถูกต้อง

### Collection Not Found
- ตรวจสอบชื่อ database และ collection
- ใช้ MongoDB Compass หรือ Atlas UI ดูว่ามี collection อะไรบ้าง
