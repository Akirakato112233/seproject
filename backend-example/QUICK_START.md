# 🚀 Quick Start - เชื่อมต่อ MongoDB Atlas

## ขั้นตอนด่วน (5 นาที)

### 1. เอา Connection String

1. ไปที่ [MongoDB Atlas](https://cloud.mongodb.com/)
2. คลิก **Connect** → **Connect your application**
3. Copy Connection String
4. แทนที่ `<password>` ด้วย password จริง

### 2. สร้างไฟล์ .env

```bash
cd backend-example
```

สร้างไฟล์ `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/Wit?retryWrites=true&w=majority
```

**⚠️ แทนที่:**
- `YOUR_USERNAME` = username ของคุณ
- `YOUR_PASSWORD` = password ของคุณ  
- `YOUR_CLUSTER` = cluster address ของคุณ
- `Wit` = ชื่อ database (หรือเปลี่ยนตามที่คุณใช้)

### 3. ตั้งค่า Network Access

1. ใน MongoDB Atlas → **Network Access**
2. คลิก **Add IP Address**
3. เลือก **Allow Access from Anywhere** (0.0.0.0/0)
4. คลิก **Confirm**

### 4. ติดตั้งและรัน

```bash
npm install
npm run dev
```

### 5. ทดสอบ

เปิด browser ไปที่: `http://localhost:3000/api/health`

ควรเห็น:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 6. ทดสอบ API

```
GET http://localhost:3000/api/shops
```

---

## ✅ Checklist

- [ ] เอา Connection String จาก MongoDB Atlas
- [ ] สร้างไฟล์ `.env` และใส่ Connection String
- [ ] ตั้งค่า Network Access (Allow from anywhere)
- [ ] รัน `npm install`
- [ ] รัน `npm run dev`
- [ ] ตรวจสอบว่าเห็น "✅ MongoDB Connected"
- [ ] ทดสอบ API ด้วย browser หรือ Postman

---

## 📝 หมายเหตุ

- Collection name ใน code ตั้งเป็น **"ร้านซักผ้า"** แล้ว
- Database name ใช้ **"Wit"** (แก้ไขใน Connection String)
- ถ้า fields ใน database ไม่ตรงกับ model อาจต้องแก้ไข model
