import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 4 ขั้น: ไปรับผ้าที่ลูกค้า → ไปร้าน(ส่งผ้า) → [ปล่อยไรเดอร์] → ไปร้าน(รับผ้าซักเสร็จ) → ไปส่งลูกค้า
export type DeliveryStatus = "going_to_customer" | "going_to_shop" | "going_to_shop_pickup" | "delivering";

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

  // map: ที่อยู่ลูกค้า (รับผ้า/ส่งผ้า), ร้าน
  pickup: LatLng;   // ที่รับผ้า = ลูกค้า (หรือร้านเมื่อ stage = going_to_shop_pickup)
  dropoff: LatLng;  // ที่ส่งผ้า = ลูกค้า (จุดเดียวกัน)
  shop: LatLng;     // พิกัดร้าน

  // optional extras
  note?: string;
  timeWindow?: string;
  paymentMethod?: PaymentMethod;
  customerPhone?: string;
  shopPhone?: string;

  // order status from backend
  status?: string;
};

export type ActiveOrder = Order & { status: DeliveryStatus };
export type CompletedOrder = Order & { completedAt: string };

/** ออเดอร์จาก API Ready for Pickup (ผ้าซักเสร็จ รอไรเดอร์มารับ) */
export type ReadyForPickupOrder = Order & {
  orderId?: string;
  total?: number;
  paymentLabel?: string;
  itemsList?: { name: string; details?: string; price: number }[];
  note?: string;
  shopPhone?: string;
  customerPhone?: string;
};

type DeliveryContextType = {
  available: Order[];
  active: ActiveOrder | null;
  history: CompletedOrder[];
  readyForPickup: ReadyForPickupOrder[];
  /** ออเดอร์ที่ส่งผ้าให้ร้านแล้ว กำลังซัก (at_shop) — ตรงกับ In progress ฝั่งร้าน */
  atShopOrders: ReadyForPickupOrder[];

  // ✅ ใช้ตัวนี้เวลาเรา "เริ่มงาน" (รับจากรายการหรือ demo ก็ได้)
  startOrder: (order: Order) => Promise<boolean>;

  acceptOrder: (id: string) => void;
  declineOrder: (id: string) => void;

  // รับผ้าจากลูกค้าแล้ว → ไปร้าน
  markPickedUp: () => void;
  // ถึงร้านแล้ว (วางผ้า) → ปล่อยไรเดอร์ รอร้านซักเสร็จ
  markAtShop: () => void;
  // เริ่มไปรับผ้าที่ร้าน (จาก Ready for Pickup)
  startPickupFromShop: (order: ReadyForPickupOrder) => void;
  // รับผ้าที่ร้านแล้ว (ซักเสร็จ) → ไปส่งลูกค้า
  markPickedUpFromShop: () => void;
  markDelivered: () => void;

  refreshReadyForPickup: () => Promise<void>;
  refreshAtShopOrders: () => Promise<void>;

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

// โหมด dev ไม่ login: ใช้ riderId นี้เพื่อรับงานและดึง Ready for Pickup (ต้องมี user นี้ใน DB เช่นจาก seed)
const DEV_RIDER_ID = '698e27ff93d8fdbda13bb05c';

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<ActiveOrder | null>(null);
  const [history, setHistory] = useState<CompletedOrder[]>([]);

  const [isOnline, setIsOnline] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);

  // Auth; โหมด dev ไม่ login ใช้ DEV_RIDER_ID แทน user._id
  const { token, user, isDevMode } = useAuth();
  const effectiveRiderId = user?._id ?? (isDevMode ? DEV_RIDER_ID : undefined);
  const [readyForPickup, setReadyForPickup] = useState<ReadyForPickupOrder[]>([]);
  const [atShopOrders, setAtShopOrders] = useState<ReadyForPickupOrder[]>([]);

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

  const updateBackendStatus = async (orderId: string, status: string, riderId?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const body: { status: string; riderId?: string } = { status };
      if (riderId) body.riderId = riderId;
      const response = await fetch(`${API.ORDERS}/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      // ถ้า order ถูกรับไปแล้ว ให้ return false
      if (response.status === 409 || !data.success) {
        console.log('Order already taken:', data.message);
        return false;
      }
      return true;
    } catch (error) {
      console.log('Error updating backend status:', error);
      return false;
    }
  };

  const startOrder = async (order: Order): Promise<boolean> => {
    if (active) return false;
    // ใช้ user._id เป็น riderId; โหมด dev ไม่ login ใช้ DEV_RIDER_ID
    const riderId = effectiveRiderId;
    if (!riderId) return false;

    const success = await updateBackendStatus(order.id, 'rider_coming', riderId);
    if (!success) {
      setAvailable((prev) => prev.filter((o) => o.id !== order.id));
      return false;
    }

    const shop = (order as any).shop ?? order.pickup;
    setActive({ ...order, shop, status: "going_to_customer" });
    setAvailable((prev) => prev.filter((o) => o.id !== order.id));
    return true;
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
    setActive({ ...active, status: "going_to_shop" });
    // ไม่อัปเดต backend ตอนนี้ — จะอัปเดตเป็น at_shop เมื่อกด "ถึงร้านแล้ว"
  };

  const markAtShop = () => {
    if (!active) return;
    // อัปเดต backend: ถึงร้านแล้ว ส่งผ้าให้ร้านแล้ว (ร้านจะซัก) → ปล่อยไรเดอร์
    updateBackendStatus(active.id, 'at_shop');
    setActive(null);
  };

  const fetchReadyForPickup = async () => {
    const riderId = effectiveRiderId;
    if (!riderId) {
      setReadyForPickup([]);
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API.ORDERS}/rider/ready-for-pickup?riderId=${encodeURIComponent(riderId)}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const mapped: ReadyForPickupOrder[] = data.orders.map((o: any) => ({
          id: o.id,
          orderId: o.orderId,
          shopName: o.shopName,
          shopAddress: o.shopAddress,
          customerName: o.customerName,
          customerAddress: o.customerAddress,
          distance: '1.5 km',
          fee: o.fee ?? o.total ?? 0,
          items: Array.isArray(o.items) ? o.items.length : 0,
          pickup: o.pickup ?? o.shop,
          dropoff: o.dropoff,
          shop: o.shop ?? o.pickup,
          paymentMethod: o.paymentMethod === 'wallet' ? 'card' : 'cash',
          paymentLabel: o.paymentLabel,
          status: o.status,
          total: o.total,
          note: o.note,
          shopPhone: o.shopPhone,
          customerPhone: o.customerPhone,
          ...(Array.isArray(o.items) && { itemsList: o.items }),
        }));
        setReadyForPickup(mapped);
      } else {
        setReadyForPickup([]);
      }
    } catch (e) {
      console.log('Fetch ready-for-pickup error:', e);
      setReadyForPickup([]);
    }
  };

  const refreshReadyForPickup = () => fetchReadyForPickup();

  const fetchAtShopOrders = async () => {
    const riderId = effectiveRiderId;
    if (!riderId) {
      setAtShopOrders([]);
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API.ORDERS}/rider/at-shop?riderId=${encodeURIComponent(riderId)}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const mapped: ReadyForPickupOrder[] = data.orders.map((o: any) => ({
          id: o.id,
          orderId: o.orderId,
          shopName: o.shopName,
          shopAddress: o.shopAddress,
          customerName: o.customerName,
          customerAddress: o.customerAddress,
          distance: '1.5 km',
          fee: o.fee ?? o.total ?? 0,
          items: Array.isArray(o.items) ? o.items.length : 0,
          pickup: o.pickup ?? o.shop,
          dropoff: o.dropoff,
          shop: o.shop ?? o.pickup,
          paymentMethod: o.paymentMethod === 'wallet' ? 'card' : 'cash',
          paymentLabel: o.paymentLabel,
          status: o.status,
          total: o.total,
          note: o.note,
          shopPhone: o.shopPhone,
          customerPhone: o.customerPhone,
          updatedAt: o.updatedAt,
          createdAt: o.createdAt,
          ...(Array.isArray(o.items) && { itemsList: o.items }),
        }));
        setAtShopOrders(mapped);
      } else {
        setAtShopOrders([]);
      }
    } catch (e) {
      console.log('Fetch at-shop orders error:', e);
      setAtShopOrders([]);
    }
  };

  const refreshAtShopOrders = () => fetchAtShopOrders();

  // ดึง Ready for Pickup + At Shop (In progress) เมื่อ login หรือโหมด dev
  useEffect(() => {
    if (!effectiveRiderId) return;
    fetchReadyForPickup();
    fetchAtShopOrders();
    const t = setInterval(() => {
      fetchReadyForPickup();
      fetchAtShopOrders();
    }, 8000);
    return () => clearInterval(t);
  }, [effectiveRiderId]);

  const startPickupFromShop = (order: ReadyForPickupOrder) => {
    if (active) return;
    const shop = (order as any).shop ?? order.pickup;
    setActive({
      ...order,
      shop,
      status: "going_to_shop_pickup",
    });
    setReadyForPickup((prev) => prev.filter((o) => o.id !== order.id));
  };

  const markPickedUpFromShop = () => {
    if (!active || active.status !== "going_to_shop_pickup") return;
    updateBackendStatus(active.id, 'deliverying');
    setActive({ ...active, status: "delivering" });
  };

  const markDelivered = () => {
    if (!active) return;

    const done: CompletedOrder = {
      ...active,
      completedAt: new Date().toISOString(),
    };

    // อัปเดต backend: ส่งผ้าเสร็จแล้ว
    updateBackendStatus(active.id, 'completed');
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
        readyForPickup,
        atShopOrders,
        startOrder,
        acceptOrder,
        declineOrder,
        markPickedUp,
        markAtShop,
        startPickupFromShop,
        markPickedUpFromShop,
        markDelivered,
        refreshReadyForPickup,
        refreshAtShopOrders,
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
