import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API, NGROK_HEADERS, SHOP_ID } from '../config';
import { setWalletShopId } from './walletStore';
import { useAuth } from './AuthContext';

// ========== Types matching backend Shop model ==========
export interface WashServiceOption {
  setting: string;
  duration: number;
  price: number;
}
export interface WashService {
  weight: number;
  options: WashServiceOption[];
}

export interface DryServiceOption {
  setting: string;
  duration: number;
  price: number;
}
export interface DryService {
  weight: number;
  options: DryServiceOption[];
}

export interface IroningServiceOption {
  type: string;
  price: number;
}
export interface IroningService {
  category: string;
  options: IroningServiceOption[];
}

export interface FoldingServiceOption {
  type: string;
  pricePerKg: number;
}
export interface FoldingService {
  options: FoldingServiceOption[];
}

export interface OtherServiceOption {
  name: string;
  price: number;
  unit: string;
}
export interface OtherService {
  category: string;
  defaultUnit?: string;
  options: OtherServiceOption[];
}

export interface ShopData {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  type: 'coin' | 'full';
  deliveryFee: number;
  deliveryTime: number;
  balance?: number; // ยอดเงินคงเหลือ (บาท)
  status?: boolean; // ร้านเปิด true / ปิด false
  openingHours?: { days: string[]; open: string; close: string }[]; // ชื่อวัน: จันทร์, อังคาร, ..., อาทิตย์, HH:mm
  imageUrl?: string;
  washServices?: WashService[];
  dryServices?: DryService[];
  ironingServices?: IroningService[];
  foldingServices?: FoldingService[];
  otherServices?: OtherService[];
}

interface ShopContextType {
  shop: ShopData | null;
  loading: boolean;
  error: string | null;
  refreshShop: () => Promise<void>;
  updateShop: (updates: Partial<ShopData>) => Promise<boolean>;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // โหลดข้อมูลร้าน (มี retry เมื่อ 502/network error)
  const loadShop = useCallback(async () => {
    const maxRetries = 3;
    const retryDelay = 2000;

    const doFetch = async (): Promise<ShopData | null> => {
      // 1) ถ้ามี user (merchant) ให้ลองดึงร้านของ user นั้นก่อน
      if (user?._id) {
        const res = await fetch(
          `${API.SHOPS}?merchantUserId=${encodeURIComponent(user._id)}`,
          { headers: NGROK_HEADERS }
        );
        if (!res.ok) {
          throw new Error(
            res.status === 502
              ? 'Backend ไม่พร้อม (ตรวจสอบ backend + ngrok)'
              : 'Failed to fetch shop by merchantUserId'
          );
        }
        const shops: ShopData[] = await res.json();
        if (shops.length > 0) {
          return shops[0];
        }
        // ถ้าไม่พบร้านของ user ให้ fallback ต่อไปด้านล่าง
      }

      // 2) ถ้ากำหนด SHOP_ID ไว้ ให้โหลดร้านตาม id
      if (SHOP_ID && SHOP_ID.trim()) {
        const res = await fetch(`${API.SHOPS}/${SHOP_ID}`, { headers: NGROK_HEADERS });
        if (!res.ok) throw new Error(res.status === 502 ? 'Backend ไม่พร้อม (ตรวจสอบ backend + ngrok)' : 'Failed to fetch shop');
        return await res.json();
      }

      // 3) สุดท้าย fallback เป็นร้าน full-service ร้านแรกในระบบ
      const res = await fetch(`${API.SHOPS}?type=full`, { headers: NGROK_HEADERS });
      if (!res.ok) throw new Error(res.status === 502 ? 'Backend ไม่พร้อม (ตรวจสอบ backend + ngrok)' : 'Failed to fetch shops');
      const shops: ShopData[] = await res.json();
      return shops.length > 0 ? shops[0] : null;
    };

    try {
      setLoading(true);
      setError(null);
      let shopData: ShopData | null = null;
      let lastErr: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          shopData = await doFetch();
          break;
        } catch (err: any) {
          lastErr = err;
          if (i < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, retryDelay));
          }
        }
      }

      if (shopData) {
        setShop(shopData);
        setWalletShopId(shopData._id);
      } else if (lastErr) {
        setError(lastErr.message);
      } else {
        setError('ไม่พบร้านในระบบ');
      }
    } catch (err: any) {
      console.error('❌ Error loading shop:', err);
      setError(err.message || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  // อัปเดตข้อมูลร้านไปที่ backend
  const updateShop = useCallback(async (updates: Partial<ShopData>): Promise<boolean> => {
    if (!shop) return false;
    try {
      const res = await fetch(`${API.SHOPS}/${shop._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update shop');
      const updated: ShopData = await res.json();
      setShop(updated);
      console.log('✅ Shop updated');
      return true;
    } catch (err: any) {
      console.error('❌ Error updating shop:', err);
      return false;
    }
  }, [shop]);

  return (
    <ShopContext.Provider value={{ shop, loading, error, refreshShop: loadShop, updateShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
