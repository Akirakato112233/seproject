import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API } from '../config';
import { useShop } from './ShopContext';

export interface MerchantOrder {
  id: string;
  customerName: string;
  orderId: string;
  serviceType: string;
  status: 'washing' | 'ready';
  statusRaw?: string;
  total: number;
  paymentMethod?: string;
  dueText?: string;
  pickupText?: string;
  completedAt?: Date;
}

interface OrdersContextType {
  currentOrders: MerchantOrder[];
  completedOrders: MerchantOrder[];
  addOrder: (order: Omit<MerchantOrder, 'status' | 'pickupText'>) => void;
  setOrderReady: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  walletBalance: number;
  withdraw: (amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  refreshCurrentOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

// shopId will be set from ShopContext
let _shopId: string | null = null;
export function setWalletShopId(id: string) {
  _shopId = id;
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { shop, refreshShop } = useShop();
  const [currentOrders, setCurrentOrders] = useState<MerchantOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<MerchantOrder[]>([]);

  const refreshCurrentOrders = useCallback(async () => {
    if (!shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_CURRENT(shop._id));
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setCurrentOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching current orders:', err);
    }
  }, [shop?._id]);

  useEffect(() => {
    refreshCurrentOrders();
  }, [refreshCurrentOrders]);

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

  const setOrderReady = useCallback(async (orderId: string) => {
    if (!shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_STATUS(orderId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress', shopId: shop._id }),
      });
      if (res.ok) {
        await refreshCurrentOrders();
      }
    } catch (err) {
      console.error('Error setting order ready:', err);
    }
  }, [shop?._id, refreshCurrentOrders]);

  const completeOrder = useCallback(async (orderId: string) => {
    const order = currentOrders.find((o) => o.id === orderId);
    if (!order || !shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_STATUS(orderId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deliverying', shopId: shop._id }),
      });
      if (res.ok) {
        setCompletedOrders((done) => [
          ...done,
          { ...order, completedAt: new Date() },
        ]);
        await refreshCurrentOrders();
        // เฉพาะเงินกระเป๋าเท่านั้นที่นำเงินเข้าในระบบ (deposit)
        // เงินสดไม่ต้อง deposit แต่ยังแสดงใน history
        const isWallet = order.paymentMethod === 'เงินกระเป๋า' || order.paymentMethod === 'wallet';
        if (isWallet && shop._id) {
          fetch(`${API.SHOPS}/${shop._id}/balance/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: order.total }),
          })
            .then((r) => r.ok && refreshShop())
            .catch((err) => console.error('Error depositing:', err));
        }
      }
    } catch (err) {
      console.error('Error completing order:', err);
    }
  }, [shop?._id, refreshShop, refreshCurrentOrders, currentOrders]);

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
        refreshCurrentOrders,
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
