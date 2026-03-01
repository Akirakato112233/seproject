// config.ts
import { Platform } from 'react-native';

// Web: ใช้ localhost (เครื่องเดียวกับ backend)
// Mobile: ใช้ ngrok (ต้องรัน ngrok http 3000 ก่อน)
const NGROK_URL = 'https://uncomputably-energetic-carolyn.ngrok-free.dev';
export const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : NGROK_URL;

// ngrok ต้องใส่ header นี้เพื่อข้ามหน้า warning
export const NGROK_HEADERS: Record<string, string> = BASE_URL.includes('ngrok')
  ? { 'ngrok-skip-browser-warning': '1' }
  : {};

// ระบุร้านที่ต้องการโหลด (จาก _id ใน MongoDB Atlas)
// ถ้ากำหนดไว้ แอปจะโหลดร้านนี้โดยตรง ให้ตรงกับดาต้าเบสที่เปิดอยู่
// ใส่ '' หรือลบบรรทัดนี้ถ้าต้องการโหลดร้านแรกจากรายการ
export const SHOP_ID: string | undefined = '69941b8b695062aef87deb15';

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
    // Merchant Auth (เก็บใน merchant-user)
    MERCHANTS_GOOGLE_LOGIN: `${BASE_URL}/api/merchants/google/login`,
    MERCHANTS_GOOGLE_REGISTER: `${BASE_URL}/api/merchants/google/register`,
    // Order APIs
    ORDERS: `${BASE_URL}/api/orders`,
    ORDERS_ACTIVE: `${BASE_URL}/api/orders/active`,
    ORDERS_HISTORY: `${BASE_URL}/api/orders/history`,
    ORDERS_MERCHANT_PENDING: (shopId: string) => `${BASE_URL}/api/orders/merchant/${shopId}/pending`,
    ORDERS_MERCHANT_CURRENT: (shopId: string) => `${BASE_URL}/api/orders/merchant/${shopId}/current`,
    ORDERS_MERCHANT_HISTORY: (shopId: string) => `${BASE_URL}/api/orders/merchant/${shopId}/history`,
    ORDERS_MERCHANT_ACCEPT: (orderId: string) => `${BASE_URL}/api/orders/${orderId}/merchant-accept`,
    ORDERS_MERCHANT_STATUS: (orderId: string) => `${BASE_URL}/api/orders/${orderId}/merchant-status`,
    // Wallet APIs
    WALLET: `${BASE_URL}/api/wallet`,
};