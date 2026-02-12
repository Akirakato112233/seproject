import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API } from '../config';

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
  const [currentOrders, setCurrentOrders] = useState<MerchantOrder[]>(defaultOrders);
  const [completedOrders, setCompletedOrders] = useState<MerchantOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch balance from backend
  const refreshBalance = useCallback(async () => {
    if (!_shopId) return;
    try {
      const res = await fetch(`${API.WALLET}/${_shopId}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance ?? 0);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  }, []);

  // Refresh balance periodically and on mount
  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 10000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

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
        // Deposit to backend wallet
        if (_shopId) {
          fetch(`${API.WALLET}/${_shopId}/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: order.total }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setWalletBalance(data.balance);
              }
            })
            .catch((err) => console.error('Error depositing:', err));
        }
        return prev.filter((o) => o.id !== orderId);
      }
      return prev;
    });
  }, []);

  const withdraw = useCallback(async (amount: number): Promise<boolean> => {
    if (!_shopId) return false;
    try {
      const res = await fetch(`${API.WALLET}/${_shopId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.balance);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error withdrawing:', err);
      return false;
    }
  }, []);

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
