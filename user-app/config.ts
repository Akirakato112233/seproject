// config.ts

// 🔥 แก้ IP ตรงนี้แค่จุดเดียว จบเลย!
export const BASE_URL = 'http://192.168.0.247:3000';

// ลิ้งค์ย่อยต่างๆ (Optional: จะได้ไม่ต้องพิมพ์ยาวๆ ในหน้าอื่น)
export const API = {
    REDEEM: `${BASE_URL}/api/redeem`,
    BALANCE: `${BASE_URL}/api/redeem/balance`,
    RIDERS: `${BASE_URL}/api/riders`,
    CHAT: `${BASE_URL}/api/chat`,
    SHOPS: `${BASE_URL}/api/shops`,
    // Auth APIs
    SIGNUP: `${BASE_URL}/api/auth/signup`,
    REQUEST_OTP: `${BASE_URL}/api/auth/request-otp`,
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,
    // Google Auth APIs (old)
    CHECK_USER: `${BASE_URL}/api/auth/check-user`,
    REGISTER_GOOGLE: `${BASE_URL}/api/auth/register-google-user`,
    // Google Auth APIs (new)
    GOOGLE_LOGIN: `${BASE_URL}/api/google/login`,
    GOOGLE_REGISTER: `${BASE_URL}/api/google/register`,
    // Order APIs
    ORDERS: `${BASE_URL}/api/orders`,
    ORDERS_ACTIVE: `${BASE_URL}/api/orders/active`,
    ORDERS_HISTORY: `${BASE_URL}/api/orders/history`,
};