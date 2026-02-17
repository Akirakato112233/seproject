import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API } from '../config';
import { useShop } from './ShopContext';

export interface MerchantOrder {
  id: string;
  customerName: string;
  orderId: string;
  serviceType: string;
  status: 'washing' | 'ready';
  total: number;
  dueText?: string;
  pickupText?: string;
  completedAt?: Date;
}

const defaultOrders: MerchantOrder[] = [
  {
    id: '7721',
    customerName: 'Thana some',
    orderId: 'ORD-7721',
    serviceType: 'Wash & Fold',
    status: 'washing',
    total: 200,
    dueText: 'Due in 2h',
  },
  {
    id: '7719',
    customerName: 'Mike Ross',
    orderId: 'ORD-7719',
    serviceType: 'Wash & Fold',
    status: 'ready',
    total: 120,
    pickupText: 'Waiting for Pickup',
  },
];

interface OrdersContextType {
  currentOrders: MerchantOrder[];
  completedOrders: MerchantOrder[];
  addOrder: (order: Omit<MerchantOrder, 'status' | 'pickupText'>) => void;
  setOrderReady: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  walletBalance: number;
  withdraw: (amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

// shopId will be set from ShopContext
let _shopId: string | null = null;
export function setWalletShopId(id: string) {
  _shopId = id;
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { shop, refreshShop } = useShop();
  const [currentOrders, setCurrentOrders] = useState<MerchantOrder[]>(defaultOrders);
  const [completedOrders, setCompletedOrders] = useState<MerchantOrder[]>([]);

  // balance มาจาก shop.balance ในฐานข้อมูล
  const walletBalance = shop?.balance ?? 0;

  const refreshBalance = useCallback(async () => {
    await refreshShop();
  }, [refreshShop]);

  const addOrder = useCallback((order: Omit<MerchantOrder, 'status' | 'pickupText'>) => {
    setCurrentOrders((prev) => [
      ...prev,
      {
        ...order,
        status: 'washing' as const,
        dueText: 'Due in 2h',
      },
    ]);
  }, []);

  const setOrderReady = useCallback((orderId: string) => {
    setCurrentOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'ready' as const, pickupText: 'Waiting for Pickup' } : o
      )
    );
  }, []);

  const completeOrder = useCallback((orderId: string) => {
    setCurrentOrders((prev) => {
      const order = prev.find((o) => o.id === orderId);
      if (order) {
        setCompletedOrders((done) => [
          ...done,
          { ...order, completedAt: new Date() },
        ]);
        // เพิ่ม balance ใน Shop (ฐานข้อมูล) - ใช้ $inc แบบ atomic
        if (shop?._id) {
          fetch(`${API.SHOPS}/${shop._id}/balance/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: order.total }),
          })
            .then((res) => res.ok && refreshShop())
            .catch((err) => console.error('Error depositing:', err));
        }
        return prev.filter((o) => o.id !== orderId);
      }
      return prev;
    });
  }, [shop?._id, refreshShop]);

  const withdraw = useCallback(async (amount: number): Promise<boolean> => {
    if (!shop?._id) return false;
    try {
      const res = await fetch(`${API.SHOPS}/${shop._id}/balance/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        await refreshShop();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error withdrawing:', err);
      return false;
    }
  }, [shop?._id, refreshShop]);

  return (
    <OrdersContext.Provider
      value={{
        currentOrders,
        completedOrders,
        addOrder,
        setOrderReady,
        completeOrder,
        walletBalance,
        withdraw,
        refreshBalance,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
