import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API } from '../config';
import { useShop } from './ShopContext';

export interface MerchantOrder {
  id: string;
  customerName: string;
  orderId: string;
  serviceType: string;
  status: 'wait_for_rider' | 'washing' | 'ready';
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
  setRiderArrived: (orderId: string) => Promise<void>;
  setOrderReady: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  walletBalance: number;
  withdraw: (amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  refreshCurrentOrders: () => Promise<void>;
  refreshCompletedOrders: () => Promise<void>;
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

  const refreshCompletedOrders = useCallback(async () => {
    if (!shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_HISTORY(shop._id));
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const mapped: MerchantOrder[] = data.orders.map((o: { id: string; customerName: string; orderId: string; serviceType: string; total: number; paymentMethod?: string; completedAt?: string }) => ({
          id: o.id,
          customerName: o.customerName,
          orderId: o.orderId,
          serviceType: o.serviceType,
          status: 'ready',
          total: o.total,
          paymentMethod: o.paymentMethod,
          completedAt: o.completedAt ? new Date(o.completedAt) : undefined,
        }));
        setCompletedOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching completed orders (history):', err);
    }
  }, [shop?._id]);

  useEffect(() => {
    refreshCurrentOrders();
  }, [refreshCurrentOrders]);

  useEffect(() => {
    refreshCompletedOrders();
  }, [refreshCompletedOrders]);

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
        status: 'wait_for_rider' as const,
        dueText: undefined,
        pickupText: 'Waiting for rider',
      },
    ]);
  }, []);

  const setRiderArrived = useCallback(async (orderId: string) => {
    if (!shop?._id) return;
    try {
      const res = await fetch(API.ORDERS_MERCHANT_STATUS(orderId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'at_shop', shopId: shop._id }),
      });
      if (res.ok) {
        await refreshCurrentOrders();
      }
    } catch (err) {
      console.error('Error setting rider arrived:', err);
    }
  }, [shop?._id, refreshCurrentOrders]);

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
        await refreshCurrentOrders();
        await refreshCompletedOrders();
        // Backend โอนเงินเข้า balance ร้านอัตโนมัติเมื่อ status เป็น deliverying (ชำระ wallet) — ดึงยอดล่าสุด
        await refreshShop();
      }
    } catch (err) {
      console.error('Error completing order:', err);
    }
  }, [shop?._id, refreshShop, refreshCurrentOrders, refreshCompletedOrders, currentOrders]);

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
        setRiderArrived,
        setOrderReady,
        completeOrder,
        walletBalance,
        withdraw,
        refreshBalance,
        refreshCurrentOrders,
        refreshCompletedOrders,
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
