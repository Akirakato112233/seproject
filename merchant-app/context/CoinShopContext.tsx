import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API } from '../config';

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

export interface CoinShopData {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  type: 'coin' | 'full';
  deliveryFee: number;
  deliveryTime: number;
  imageUrl?: string;
  washServices?: WashService[];
  dryServices?: DryService[];
  balance?: number;
}

interface CoinShopContextType {
  shop: CoinShopData | null;
  loading: boolean;
  error: string | null;
  refreshShop: () => Promise<void>;
  updateShop: (updates: Partial<CoinShopData>) => Promise<boolean>;
}

const CoinShopContext = createContext<CoinShopContextType | null>(null);

export function CoinShopProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShop] = useState<CoinShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShop = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API.SHOPS + '?type=coin');
      if (!res.ok) throw new Error('Failed to fetch shops');
      const shops: CoinShopData[] = await res.json();
      if (shops.length > 0) {
        setShop(shops[0]);
        console.log('Coin Shop loaded:', shops[0].name);
      } else {
        setError('No coin shop found');
      }
    } catch (err: any) {
      console.error('Error loading coin shop:', err);
      setError(err.message || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const updateShop = useCallback(async (updates: Partial<CoinShopData>): Promise<boolean> => {
    if (!shop) return false;
    try {
      const res = await fetch(API.SHOPS + '/' + shop._id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update shop');
      const updated: CoinShopData = await res.json();
      setShop(updated);
      console.log('Coin Shop updated');
      return true;
    } catch (err: any) {
      console.error('Error updating coin shop:', err);
      return false;
    }
  }, [shop]);

  return (
    <CoinShopContext.Provider value={{ shop, loading, error, refreshShop: loadShop, updateShop }}>
      {children}
    </CoinShopContext.Provider>
  );
}

export function useCoinShop() {
  const ctx = useContext(CoinShopContext);
  if (!ctx) throw new Error('useCoinShop must be used within CoinShopProvider');
  return ctx;
}
