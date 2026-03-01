# แก้ Error 400: invalid_request (Google OAuth)

เมื่อขึ้นข้อความ **"Access blocked: An error occurred during authorization"** หรือ **Error 400: invalid_request** มาจากการตั้งค่า OAuth ใน Google Cloud Console ไม่ตรงกับที่แอปใช้

## ขั้นตอนแก้ใน Google Cloud Console

1. เปิด [Google Cloud Console](https://console.cloud.google.com/) → เลือกโปรเจกต์ **project-543704041787**

2. ไปที่ **APIs & Services** → **Credentials** → เลือก OAuth 2.0 Client ID แบบ **Web application**  
   (ตัวที่ลงท้าย `...o6geb9.apps.googleusercontent.com`)

3. ใน **Authorized redirect URIs** ให้เพิ่ม URI ที่แอปใช้:
   - ถ้ารันบน **Expo Go / development** มักได้รูปแบบ:
     - `https://auth.expo.io/@0822189639/WIT-Rider`
   - ดูค่า redirect URI จริงได้จาก log ในเทอร์มินัลเมื่อเปิดหน้า Login (มี `[Google OAuth] redirectUri: ...`)
   - **สำคัญ:** ต้องใส่ให้ตรงตัวอักษรทุกตัว (รวม slash ท้ายหรือไม่)

4. ใน **Authorized JavaScript origins** (ถ้ามี) ให้เพิ่ม:
   - `https://auth.expo.io`

5. ไปที่ **OAuth consent screen**:
   - ถ้าเป็น **Testing** ให้เพิ่มอีเมลที่ใช้ทดสอบลงใน "Test users"
   - ใส่ **Authorized domains**: `expo.io` (และ `auth.expo.io` ถ้ามีช่อง)

6. บันทึก (Save) แล้วรอสักครู่ก่อนลองลงชื่อเข้าใช้ใหม่

## ถ้ายังไม่ผ่าน

- ใช้ **Development Build** แทน Expo Go (Expo Go บางทีใช้ redirect แบบ dynamic ที่ลงทะเบียนใน Google ไม่ได้)
- ตรวจว่าใช้ Client ID เดียวกับในโค้ด: `543704041787-0slqpuv7ecelpgsfg73s6gao3qo6geb9.apps.googleusercontent.com`
