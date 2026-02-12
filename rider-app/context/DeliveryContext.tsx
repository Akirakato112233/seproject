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
const KU_SRIRACHA_COORDS = { latitude: 13.1219, longitude: 100.9209 };

const MOCK_AVAILABLE: Order[] = [
  {
    id: "1",
    shopName: "WashPro Laundry",
    shopAddress: "100 Shop St, Bangkok",
    customerName: "John Doe",
    customerAddress: "123 Main St, Bangkok",
    distance: "2.5 km",
    fee: 150,
    items: 3,
    pickup: { latitude: 13.0918, longitude: 100.9036 },
    dropoff: KU_SRIRACHA_COORDS, // มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
    note: "แยกขาว/สี",
    timeWindow: "Today, 2:00 PM - 4:00 PM",
    paymentMethod: "cash",
    customerPhone: "+66800000001",
    shopPhone: "+66800000011",
  },
  {
    id: "2",
    shopName: "Clean Express",
    shopAddress: "22 Oak Ave, Bangkok",
    customerName: "Jane Smith",
    customerAddress: "456 Oak Ave, Bangkok",
    distance: "3.2 km",
    fee: 200,
    items: 5,
    pickup: { latitude: 13.0672, longitude: 100.9196 },
    dropoff: KU_SRIRACHA_COORDS, // มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
    note: "เสื้อเชิ้ตรีดเรียบ",
    timeWindow: "Today, 1:00 PM - 3:00 PM",
    paymentMethod: "cash",
    customerPhone: "+66800000002",
    shopPhone: "+66800000012",
  },
  {
    id: "3",
    shopName: "Fresh & Clean",
    shopAddress: "9 Pine Rd, Bangkok",
    customerName: "Mike Johnson",
    customerAddress: "789 Pine Rd, Bangkok",
    distance: "1.8 km",
    fee: 120,
    items: 2,
    pickup: { latitude: 13.0827, longitude: 100.9274 },
    dropoff: KU_SRIRACHA_COORDS, // มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
    note: "ผ้าเปราะบาง",
    timeWindow: "Today, 3:00 PM - 5:00 PM",
    paymentMethod: "cash",
    customerPhone: "+66800000003",
    shopPhone: "+66800000013",
  },
];

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = useState<Order[]>(MOCK_AVAILABLE);
  const [active, setActive] = useState<ActiveOrder | null>(null);
  const [history, setHistory] = useState<CompletedOrder[]>([]);

  const [isOnline, setIsOnline] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);

  const toggleOnline = () => {
    setIsOnline((v) => {
      const next = !v;
      // ปิด autoAccept ทุกครั้งที่ offline
      if (!next) setAutoAccept(false);
      return next;
    });
  };
  // อนุญาตให้เปลี่ยน autoAccept เฉพาะตอน online
  const toggleAutoAccept = () => {
    if (!isOnline) return;
    setAutoAccept((v) => !v);
  };

  // load
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);

        // ถ้า available ว่าง ให้ใช้ mock data ใหม่ (กัน order หมดจากการทดสอบครั้งก่อน)
        if (Array.isArray(parsed.available) && parsed.available.length > 0) {
          setAvailable(parsed.available);
        } else {
          setAvailable(MOCK_AVAILABLE);
        }

        // ไม่โหลด active เก่า ถ้ามันค้างจากเซสชั่นก่อน (กัน state ค้าง)
        if (Array.isArray(parsed.history)) setHistory(parsed.history);

        // ไม่โหลด isOnline / autoAccept — เริ่มต้น Offline เสมอ
        // isOnline = false, autoAccept = false (ค่า default)
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
