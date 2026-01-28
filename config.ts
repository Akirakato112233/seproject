// config.ts

// 🔥 แก้ IP ตรงนี้แค่จุดเดียว จบเลย!
export const BASE_URL = 'http://10.64.34.19:3000'; 

// ลิ้งค์ย่อยต่างๆ (Optional: จะได้ไม่ต้องพิมพ์ยาวๆ ในหน้าอื่น)
export const API = {
    REDEEM: `${BASE_URL}/api/redeem`,
    BALANCE: `${BASE_URL}/api/redeem/balance`,
    RIDERS: `${BASE_URL}/api/riders`,
    CHAT: `${BASE_URL}/api/chat`,
    SHOPS: `${BASE_URL}/api/shops`,
    SIGNUP: `${BASE_URL}/api/auth/signup`,
    REQUEST_OTP: `${BASE_URL}/api/auth/request-otp`, // email OTP
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,   // email OTP
};