import { LaundryShop } from '../components/LaundryShopCard';
import { Config } from '../constants/config';


// ดึง URL จากไฟล์ Config มาใช้
const API_BASE_URL = Config.API_URL;


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
 * ดึงข้อมูลร้านซักรีดทั้งหมด (Search/Filter)
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

    // ต่อ String URL ให้ถูกต้อง
    const url = `${API_BASE_URL}/shops${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Fetching URL:', url); // log ดูว่ายิงไปถูกที่ไหม

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
    
    // Map _id ของ MongoDB ให้เป็น id ที่ frontend รู้จัก
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
 * ดึงข้อมูลร้านซักรีดรายตัว (Detail)
 * ใช้สำหรับหน้า shop/[id].tsx
 */
export const getShopById = async (id: string): Promise<LaundryShop> => {
  try {
    const url = `${API_BASE_URL}/shops/${id}`;
    console.log('Fetching Detail URL:', url);

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
    return { ...data, id: data._id };
  } catch (error) {
    console.error('Error fetching shop details:', error);
    throw error;
  }
};