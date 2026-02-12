import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DeliveryStatus = "picking_up" | "delivering";

export type LatLng = { latitude: number; longitude: number };
export type PaymentMethod = "cash" | "card";

export type Order = {
  id: string;

  // UI fields
  shopName: string;
  shopAddress: string;
  customerName: string;
  customerAddress: string;
  distance: string;
  fee: number;
  items: number;

  // map fields (ใช้โชว์เส้นทาง/หมุด)
  pickup: LatLng;
  dropoff: LatLng;

  // optional extras (ไว้ทำ UI แบบตัวอย่าง)
  note?: string;
  timeWindow?: string;
  paymentMethod?: PaymentMethod;
  customerPhone?: string;
  shopPhone?: string;
};

export type ActiveOrder = Order & { status: DeliveryStatus };
export type CompletedOrder = Order & { completedAt: string };

type DeliveryContextType = {
  available: Order[];
  active: ActiveOrder | null;
  history: CompletedOrder[];

  // ✅ ใช้ตัวนี้เวลาเรา "เริ่มงาน" (รับจากรายการหรือ demo ก็ได้)
  startOrder: (order: Order) => void;

  // (ยังเก็บไว้ให้ไฟล์เก่าใช้งานได้)
  acceptOrder: (id: string) => void;

  declineOrder: (id: string) => void;

  markPickedUp: () => void;
  markDelivered: () => void;

  clearHistory: () => void;
  totals: { totalOrders: number; totalEarnings: number };

  isOnline: boolean;
  toggleOnline: () => void;

  autoAccept: boolean;
  toggleAutoAccept: () => void;
};

const STORAGE_KEY = "rider_delivery_state_v1";
const DeliveryContext = createContext<DeliveryContextType>(null as any);

// NOTE: ปลายทางล็อคที่มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
// 199 ตำบลทุ่งสุขลา อำเภอศรีราชา ชลบุรี 20230
// ... imports
import { API } from '../config';

// ... types ...

// NOTE: ปลายทางล็อคที่มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
// 199 ตำบลทุ่งสุขลา อำเภอศรีราชา ชลบุรี 20230
const KU_SRIRACHA_COORDS = { latitude: 13.1219, longitude: 100.9209 };

import { useAuth } from './AuthContext';

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<ActiveOrder | null>(null);
  const [history, setHistory] = useState<CompletedOrder[]>([]);

  const [isOnline, setIsOnline] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);

  // Auth
  const { token } = useAuth();

  const toggleOnline = () => {
    setIsOnline((v) => {
      const next = !v;
      if (!next) setAutoAccept(false);
      return next;
    });
  };

  const toggleAutoAccept = () => {
    if (!isOnline) return;
    setAutoAccept((v) => !v);
  };

  // Fetch pending orders from API
  const fetchAvailableOrders = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(API.ORDERS_PENDING, { headers });
      const data = await response.json();
      if (data.success) {
        // Filter out active order if exists
        const pending = data.orders.filter((o: any) => o.id !== active?.id);
        setAvailable(pending);
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
    }
  };

  // Poll for orders when online
  useEffect(() => {
    if (!isOnline) {
      setAvailable([]);
      return;
    }

    fetchAvailableOrders(); // Initial fetch
    const interval = setInterval(fetchAvailableOrders, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [isOnline, active]);

  // Load state from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);

        // Don't load available/active from storage to avoid stale data
      } catch {
        // ignore
      }
    })();
  }, []);

  // save
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ available, active, history, isOnline, autoAccept })
    ).catch(() => { });
  }, [available, active, history, isOnline, autoAccept]);

  // ✅ เริ่มงานด้วย object (รองรับ demo ที่ไม่ได้อยู่ใน available)
  const startOrder = (order: Order) => {
    if (active) return; // กันรับซ้อน

    setActive({ ...order, status: "picking_up" });

    // ถ้า order นี้มาจาก available ให้เอาออก (ถ้าไม่มีก็ไม่เป็นไร)
    setAvailable((prev) => prev.filter((o) => o.id !== order.id));
  };

  // สำหรับโค้ดเก่า
  const acceptOrder = (id: string) => {
    if (active) return;
    const order = available.find((o) => o.id === id);
    if (!order) return;
    startOrder(order);
  };

  const declineOrder = (id: string) => {
    setAvailable((prev) => prev.filter((o) => o.id !== id));
  };

  // NOTE: Auto-accept logic moved to HomeScreen (index.tsx)
  // เพื่อให้แสดง popup ก่อนรับงานอัตโนมัติ

  const markPickedUp = () => {
    if (!active) return;
    setActive({ ...active, status: "delivering" });
  };

  const markDelivered = () => {
    if (!active) return;

    const done: CompletedOrder = {
      ...active,
      completedAt: new Date().toISOString(),
    };

    setHistory((prev) => [done, ...prev]);
    setActive(null);
  };

  const clearHistory = () => setHistory([]);

  const totals = useMemo(() => {
    const totalOrders = history.length;
    const totalEarnings = history.reduce((sum, o) => sum + o.fee, 0);
    return { totalOrders, totalEarnings };
  }, [history]);

  return (
    <DeliveryContext.Provider
      value={{
        available,
        active,
        history,
        startOrder,
        acceptOrder,
        declineOrder,
        markPickedUp,
        markDelivered,
        clearHistory,
        totals,
        isOnline,
        toggleOnline,
        autoAccept,
        toggleAutoAccept,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  return useContext(DeliveryContext);
}
