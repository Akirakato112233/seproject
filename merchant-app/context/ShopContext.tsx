import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API, SHOP_ID } from '../config';
import { setWalletShopId } from './OrdersContext';

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

  // โหลดข้อมูลร้าน
  // ถ้ามี SHOP_ID ใน config จะโหลดร้านนั้นโดยตรง (ตรงกับดาต้าเบสที่เปิดใน Atlas)
  // ถ้าไม่มี จะโหลดร้านแรกที่ type "full" เรียงตาม rating
  const loadShop = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let shopData: ShopData | null = null;

      if (SHOP_ID && SHOP_ID.trim()) {
        const res = await fetch(`${API.SHOPS}/${SHOP_ID}`);
        if (!res.ok) throw new Error('Failed to fetch shop');
        shopData = await res.json();
        console.log('✅ Shop loaded by ID:', shopData.name);
      } else {
        const res = await fetch(`${API.SHOPS}?type=full`);
        if (!res.ok) throw new Error('Failed to fetch shops');
        const shops: ShopData[] = await res.json();
        if (shops.length > 0) shopData = shops[0];
      }

      if (shopData) {
        setShop(shopData);
        setWalletShopId(shopData._id);
      } else {
        setError('ไม่พบร้านในระบบ');
      }
    } catch (err: any) {
      console.error('❌ Error loading shop:', err);
      setError(err.message || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  // อัปเดตข้อมูลร้านไปที่ backend
  const updateShop = useCallback(async (updates: Partial<ShopData>): Promise<boolean> => {
    if (!shop) return false;
    try {
      const res = await fetch(`${API.SHOPS}/${shop._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
