import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useCoinShop, type WashService, type DryService } from './CoinShopContext';

/** สถานะเครื่องซัก */
export type MachineStatus = 'running' | 'available' | 'finished' | 'offline';

export type WashMode = 'Quick' | 'Normal' | 'Heavy Duty' | 'Delicate';
export type WaterTemp = 'Cold' | 'Warm' | 'Hot';

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  type: 'washer' | 'dryer';
  capacity: string;          // เช่น '15' (kg)
  price: string;             // เช่น '40' (บาท)
  cycleTime: string;         // เช่น '45' (นาที)
  enabled: boolean;
  program?: string;
  washMode?: WashMode;
  waterTemp?: WaterTemp;
  /** สำหรับ running: เวลาที่เหลือเป็นวินาที */
  secondsLeft?: number;
}

interface MachineContextType {
  machines: Machine[];
  setMachines: React.Dispatch<React.SetStateAction<Machine[]>>;
  /** อัปเดต config ของเครื่อง (price, capacity, cycleTime) */
  updateMachineConfig: (id: string, updates: { price?: string; capacity?: string; cycleTime?: string }) => void;
  /** สลับ enabled/disabled */
  toggleMachineEnabled: (id: string) => void;
  /** เพิ่มเครื่องใหม่ */
  addMachine: (machine: Machine) => void;
  /** เริ่มเครื่อง (available → running) */
  startMachine: (id: string, washMode: WashMode, waterTemp: WaterTemp) => void;
  /** ลบเครื่อง */
  removeMachine: (id: string) => void;
  /** ข้ามรอบ (running → finished ทันที) */
  skipMachine: (id: string) => void;
  /** รับเงิน (finished → available) คืนค่า price ของเครื่องนั้น */
  collectMachine: (id: string) => number;
  /** รายได้วันนี้ */
  todayRevenue: number;
}

const MachineContext = createContext<MachineContextType | null>(null);

/** แปลง washServices + dryServices จาก backend เป็น Machine[] */
function buildMachinesFromShop(
  washServices?: WashService[],
  dryServices?: DryService[],
): Machine[] {
  const machines: Machine[] = [];
  let wIdx = 1;
  let dIdx = 1;

  if (washServices) {
    for (const ws of washServices) {
      const firstOption = ws.options?.[0];
      machines.push({
        id: `W-${String(wIdx).padStart(2, '0')}`,
        name: `W-${String(wIdx).padStart(2, '0')}`,
        status: 'available',
        type: 'washer',
        capacity: String(ws.weight),
        price: String(firstOption?.price ?? 0),
        cycleTime: String(firstOption?.duration ?? 45),
        enabled: true,
        program: 'Ready',
      });
      wIdx++;
    }
  }

  if (dryServices) {
    for (const ds of dryServices) {
      const firstOption = ds.options?.[0];
      machines.push({
        id: `D-${String(dIdx).padStart(2, '0')}`,
        name: `D-${String(dIdx).padStart(2, '0')}`,
        status: 'available',
        type: 'dryer',
        capacity: String(ds.weight),
        price: String(firstOption?.price ?? 0),
        cycleTime: String(firstOption?.duration ?? 45),
        enabled: true,
        program: 'Ready',
      });
      dIdx++;
    }
  }

  // ถ้าไม่มีข้อมูลจาก backend ให้ใช้เครื่องเริ่มต้น
  if (machines.length === 0) {
    return [
      { id: 'W-01', name: 'W-01', status: 'available', type: 'washer', capacity: '15', price: '40', cycleTime: '45', enabled: true, program: 'Ready' },
      { id: 'W-02', name: 'W-02', status: 'available', type: 'washer', capacity: '10', price: '30', cycleTime: '45', enabled: true, program: 'Ready' },
    ];
  }

  return machines;
}

export function MachineProvider({ children }: { children: React.ReactNode }) {
  const { shop, updateShop } = useCoinShop();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const initialized = useRef(false);

  // โหลดเครื่องจาก backend shop data
  useEffect(() => {
    if (shop && !initialized.current) {
      const built = buildMachinesFromShop(shop.washServices, shop.dryServices);
      setMachines(built);
      initialized.current = true;
      console.log('Machines loaded from backend:', built.length);
    }
  }, [shop]);

  // นับถอยหลังจริงทุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setMachines((prev) =>
        prev.map((m) => {
          if (m.status !== 'running' || m.secondsLeft == null) return m;
          const next = m.secondsLeft - 1;
          if (next <= 0) {
            return { ...m, status: 'finished' as MachineStatus, secondsLeft: undefined };
          }
          return { ...m, secondsLeft: next };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // sync machines กลับไป backend เป็น washServices + dryServices
  const syncToBackend = useCallback((updatedMachines: Machine[]) => {
    if (!updateShop) return;
    const washServices: WashService[] = updatedMachines
      .filter((m) => m.type === 'washer' && m.enabled)
      .map((m) => ({
        weight: parseInt(m.capacity, 10) || 0,
        options: [
          { setting: 'Cold', duration: parseInt(m.cycleTime, 10) || 45, price: parseInt(m.price, 10) || 0 },
          { setting: 'Warm', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 10 },
          { setting: 'Hot', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 20 },
        ],
      }));
    const dryServices: DryService[] = updatedMachines
      .filter((m) => m.type === 'dryer' && m.enabled)
      .map((m) => ({
        weight: parseInt(m.capacity, 10) || 0,
        options: [
          { setting: 'Low Heat', duration: parseInt(m.cycleTime, 10) || 45, price: parseInt(m.price, 10) || 0 },
          { setting: 'Medium Heat', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 10 },
          { setting: 'High Heat', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 20 },
        ],
      }));
    updateShop({ washServices, dryServices } as any);
  }, [updateShop]);

  const updateMachineConfig = useCallback((id: string, updates: { price?: string; capacity?: string; cycleTime?: string }) => {
    setMachines((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      syncToBackend(updated);
      return updated;
    });
  }, [syncToBackend]);

  const toggleMachineEnabled = useCallback((id: string) => {
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newEnabled = !m.enabled;
        return {
          ...m,
          enabled: newEnabled,
          status: newEnabled ? 'available' : 'offline',
          secondsLeft: newEnabled ? undefined : undefined,
          program: newEnabled ? 'Ready' : 'Maintenance',
        };
      })
    );
  }, []);

  const addMachine = useCallback((machine: Machine) => {
    setMachines((prev) => {
      const updated = [...prev, machine];
      syncToBackend(updated);
      return updated;
    });
  }, [syncToBackend]);

  const startMachine = useCallback((id: string, washMode: WashMode, waterTemp: WaterTemp) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'running' as MachineStatus,
              secondsLeft: parseInt(m.cycleTime || '45', 10) * 60,
              program: washMode,
              washMode,
              waterTemp,
            }
          : m
      )
    );
  }, []);

  const removeMachine = useCallback((id: string) => {
    setMachines((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      syncToBackend(updated);
      return updated;
    });
  }, [syncToBackend]);

  const skipMachine = useCallback((id: string) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'finished' as MachineStatus, secondsLeft: undefined, program: m.washMode ?? m.program }
          : m
      )
    );
  }, []);

  const collectMachine = useCallback((id: string): number => {
    let earned = 0;
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id === id && m.status === 'finished') {
          earned = parseInt(m.price || '0', 10);
          return { ...m, status: 'available' as MachineStatus, program: 'Ready', washMode: undefined, waterTemp: undefined };
        }
        return m;
      })
    );
    if (earned > 0) {
      setTodayRevenue((prev) => prev + earned);
    }
    return earned;
  }, []);

  return (
    <MachineContext.Provider
      value={{ machines, setMachines, updateMachineConfig, toggleMachineEnabled, addMachine, startMachine, removeMachine, skipMachine, collectMachine, todayRevenue }}
    >
      {children}
    </MachineContext.Provider>
  );
}

export function useMachines() {
  const ctx = useContext(MachineContext);
  if (!ctx) throw new Error('useMachines must be used within MachineProvider');
  return ctx;
}
