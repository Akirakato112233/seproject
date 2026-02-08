import React, { createContext, useCallback, useContext, useState } from 'react';

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
}

const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [currentOrders, setCurrentOrders] = useState<MerchantOrder[]>(defaultOrders);
  const [completedOrders, setCompletedOrders] = useState<MerchantOrder[]>([]);

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
        return prev.filter((o) => o.id !== orderId);
      }
      return prev;
    });
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        currentOrders,
        completedOrders,
        addOrder,
        setOrderReady,
        completeOrder,
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
