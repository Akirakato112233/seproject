// constants/config.ts

const ENV = {
  dev: {
    // สำคัญ: เปลี่ยนตรงนี้เป็น IP Address ของเครื่องคอมพิวเตอร์
    // วิธีดู IP:
    // Windows: เปิด cmd พิมพ์ ipconfig ดูตรง IPv4 Address
    // Mac: เปิด Terminal พิมพ์ ifconfig หรือดูใน Network Settings
    apiUrl: 'http://10.64.68.226:3000/api',
  },
  prod: {
    // อันนี้สำหรับตอนเอาขึ้น Server จริง (ค่อยมาแก้ทีหลังได้)
    apiUrl: 'https://your-api-domain.com/api',
  },
};

export const Config = {
  // ระบบจะเลือก URL ให้อัตโนมัติ:
  // ถ้าเป็นโหมดพัฒนา (Development) จะใช้ dev.apiUrl
  // ถ้า build ขายจริง (Production) จะใช้ prod.apiUrl
  API_URL: __DEV__ ? ENV.dev.apiUrl : ENV.prod.apiUrl,
};