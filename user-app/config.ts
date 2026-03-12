/**
 * App config: base API URL and named endpoints.
 * For local dev, use ngrok (run `ngrok http 3000`) and set BASE_URL to the ngrok URL.
 */

// ใช้ ngrok (ต้องรัน ngrok http 3000 ก่อน) — ใส่ใน .env ได้: EXPO_PUBLIC_BASE_URL=https://putative-renea-whisperingly.ngrok-free.dev
const _envUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim();
export const BASE_URL =
    _envUrl && _envUrl.startsWith('http')
        ? _envUrl
        : 'https://putative-renea-whisperingly.ngrok-free.dev';

/** Named API paths; all use BASE_URL as prefix. */
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
