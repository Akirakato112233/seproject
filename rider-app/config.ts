// config.ts

// ใช้ ngrok (ต้องรัน ngrok http 3000 ก่อน) — ใส่ใน .env ได้: EXPO_PUBLIC_BASE_URL=https://xxx.ngrok-free.dev
const _envUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim();
export const BASE_URL =
    _envUrl && _envUrl.startsWith('http')
        ? _envUrl
        : 'https://nonheritably-panpsychistic-joannie.ngrok-free.dev';

// ถ้าใช้ ngrok ต้องส่ง header นี้ทุก request ไม่งั้นได้ HTML แทน JSON
export const NGROK_HEADERS: Record<string, string> = BASE_URL.includes('ngrok')
  ? { 'ngrok-skip-browser-warning': '1' }
  : {};

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
    ORDERS_PENDING: `${BASE_URL}/api/orders/pending`,
    ORDERS_ACTIVE: `${BASE_URL}/api/orders/active`,
    ORDERS_HISTORY: `${BASE_URL}/api/orders/history`,
    ORDER_START_COIN_WASH: (orderId: string) => `${BASE_URL}/api/orders/${orderId}/start-coin-wash`,
    ORDER_START_COIN_DRY: (orderId: string) => `${BASE_URL}/api/orders/${orderId}/start-coin-dry`,
};
