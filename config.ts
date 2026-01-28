// config.ts

// 🔥 แก้ IP ตรงนี้แค่จุดเดียว จบเลย!
<<<<<<< HEAD
export const BASE_URL = 'http://10.64.34.19:3000'; 
=======
export const BASE_URL = 'http://192.168.0.247:3000';
>>>>>>> ea686b9dcf6c5b383d269f60ae49dd461a978a7e

// ลิ้งค์ย่อยต่างๆ (Optional: จะได้ไม่ต้องพิมพ์ยาวๆ ในหน้าอื่น)
export const API = {
    REDEEM: `${BASE_URL}/api/redeem`,
    BALANCE: `${BASE_URL}/api/redeem/balance`,
    RIDERS: `${BASE_URL}/api/riders`,
    CHAT: `${BASE_URL}/api/chat`,
    SHOPS: `${BASE_URL}/api/shops`,
<<<<<<< HEAD
    SIGNUP: `${BASE_URL}/api/auth/signup`,
    REQUEST_OTP: `${BASE_URL}/api/auth/request-otp`, // email OTP
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,   // email OTP
=======
    // Order APIs
    ORDERS: `${BASE_URL}/api/orders`,
    ORDERS_ACTIVE: `${BASE_URL}/api/orders/active`,
    ORDERS_HISTORY: `${BASE_URL}/api/orders/history`,
>>>>>>> ea686b9dcf6c5b383d269f60ae49dd461a978a7e
};