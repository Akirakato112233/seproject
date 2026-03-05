// constants/config.ts

const ENV = {
    dev: {
        // Base URL ต้องลงท้ายด้วย /api เพราะ route ใช้ Config.API_URL + '/riders/registrations/...'
        apiUrl: 'https://nonheritably-panpsychistic-joannie.ngrok-free.dev/api',
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
