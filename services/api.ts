import { LaundryShop } from '../components/LaundryShopCard';

// เปลี่ยน URL นี้เป็น URL ของ backend server ของคุณ
// สำหรับ development: 'http://localhost:3000'
// สำหรับ production: 'https://your-api-domain.com'
const API_BASE_URL = __DEV__
  ? 'http://192.168.0.247:3000/api'  // Development - ใช้ IP จริงสำหรับ device
  : 'https://your-api-domain.com/api';  // Production

// สำหรับ Android Emulator ใช้: 'http://10.0.2.2:3000/api'
// สำหรับ iOS Simulator ใช้: 'http://localhost:3000/api'
// สำหรับ device จริง ใช้ IP address ของคอมพิวเตอร์: 'http://192.168.1.xxx:3000/api'

export interface FilterParams {
  type?: string;
  rating?: number;
  price?: number;
  delivery?: string;
  nearMe?: boolean;
  promo?: boolean;
  open?: boolean;
}

/**
 * ดึงข้อมูลร้านซักรีดทั้งหมด
 */
export const getShops = async (filters?: FilterParams): Promise<LaundryShop[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.rating) queryParams.append('rating', filters.rating.toString());
      if (filters.price) queryParams.append('price', filters.price.toString());
      if (filters.delivery) queryParams.append('delivery', filters.delivery);
      if (filters.nearMe) queryParams.append('nearMe', 'true');
      if (filters.promo) queryParams.append('promo', 'true');
      if (filters.open) queryParams.append('open', 'true');
    }

    const url = `${API_BASE_URL}/shops${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Map _id จาก MongoDB เป็น id ที่ frontend ใช้
    return data.map((shop: any) => ({
      ...shop,
      id: shop._id,
    }));
  } catch (error) {
    console.error('Error fetching shops:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลร้านซักรีดตาม ID
 */
export const getShopById = async (id: string): Promise<LaundryShop> => {
  try {
    const response = await fetch(`${API_BASE_URL}/shops/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching shop:', error);
    throw error;
  }
};
