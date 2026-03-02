// constants/config.ts

const ENV = {
  dev: {
    apiUrl: 'http://192.168.2.37:3000/api',
  },
  prod: {
    // อันนี้สำหรับตอนเอาขึ้น Server จริง (ค่อยมาแก้ทีหลังได้)
    apiUrl: 'https://unwainscotted-unshoved-deborah.ngrok-free.dev/api',
  },
};

export const Config = {
  // ระบบจะเลือก URL ให้อัตโนมัติ:
  // ถ้าเป็นโหมดพัฒนา (Development) จะใช้ dev.apiUrl
  // ถ้า build ขายจริง (Production) จะใช้ prod.apiUrl
  API_URL: __DEV__ ? ENV.dev.apiUrl : ENV.prod.apiUrl,
};