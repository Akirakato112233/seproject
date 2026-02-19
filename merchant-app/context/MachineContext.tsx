import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useCoinShop, type WashService, type DryService } from './CoinShopContext';

/** สถานะเครื่องซัก */
export type MachineStatus = 'running' | 'available' | 'finished' | 'offline';

export type WashMode = 'Quick' | 'Normal' | 'Heavy Duty' | 'Delicate';
export type WaterTemp = 'Cold' | 'Warm' | 'Hot';

export interface MachineOption {
  setting: string;
  duration: number;
  price: number;
}

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
  /** options จาก backend สำหรับเลือก setting/duration/price */
  options?: MachineOption[];
  /** เวลาเสร็จสิ้น (ISO string) จาก backend */
  finishTime?: string | null;
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
  /** เริ่มเครื่อง (available → running) ใช้ selectedOption.duration สำหรับ finishTime */
  startMachine: (id: string, selectedOption: MachineOption) => void;
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
      const id = ws.machineId ?? `WASH-${String(wIdx).padStart(2, '0')}`;
      const firstOption = ws.options?.[0];
      const status = ws.status ?? 'available';
      const finishTime = ws.finishTime ?? null;
      let machineStatus: MachineStatus = 'available';
      let secondsLeft: number | undefined;
      if (status === 'busy' && finishTime) {
        const remaining = Math.floor((new Date(finishTime).getTime() - Date.now()) / 1000);
        if (remaining <= 0) {
          machineStatus = 'finished';
        } else {
          machineStatus = 'running';
          secondsLeft = remaining;
        }
      } else if (status === 'busy' && !finishTime) {
        machineStatus = 'finished';
      } else {
        machineStatus = 'available';
      }
      machines.push({
        id,
        name: id,
        status: machineStatus,
        type: 'washer',
        capacity: String(ws.weight),
        price: String(firstOption?.price ?? 0),
        cycleTime: String(firstOption?.duration ?? 45),
        enabled: true,
        program: 'Ready',
        options: ws.options ?? [],
        finishTime,
        secondsLeft,
      });
      wIdx++;
    }
  }

  if (dryServices) {
    for (const ds of dryServices) {
      const id = ds.machineId ?? `DRY-${String(dIdx).padStart(2, '0')}`;
      const firstOption = ds.options?.[0];
      const status = ds.status ?? 'available';
      const finishTime = ds.finishTime ?? null;
      let machineStatus: MachineStatus = 'available';
      let secondsLeft: number | undefined;
      if (status === 'busy' && finishTime) {
        const remaining = Math.floor((new Date(finishTime).getTime() - Date.now()) / 1000);
        if (remaining <= 0) {
          machineStatus = 'finished';
        } else {
          machineStatus = 'running';
          secondsLeft = remaining;
        }
      } else if (status === 'busy' && !finishTime) {
        machineStatus = 'finished';
      } else {
        machineStatus = 'available';
      }
      machines.push({
        id,
        name: id,
        status: machineStatus,
        type: 'dryer',
        capacity: String(ds.weight),
        price: String(firstOption?.price ?? 0),
        cycleTime: String(firstOption?.duration ?? 45),
        enabled: true,
        program: 'Ready',
        options: ds.options ?? [],
        finishTime,
        secondsLeft,
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

  // sync machines กลับไป backend เป็น washServices + dryServices
  const syncToBackend = useCallback((updatedMachines: Machine[]) => {
    if (!updateShop) return;
    const washServices: WashService[] = updatedMachines
      .filter((m) => m.type === 'washer' && m.enabled)
      .map((m) => ({
        machineId: m.id,
        weight: parseInt(m.capacity, 10) || 0,
        status: m.status === 'running' ? 'busy' : m.status === 'finished' ? 'busy' : 'available',
        finishTime: m.status === 'running' && m.finishTime ? m.finishTime : null,
        options: m.options ?? [
          { setting: 'Cold', duration: parseInt(m.cycleTime, 10) || 45, price: parseInt(m.price, 10) || 0 },
          { setting: 'Warm', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 10 },
          { setting: 'Hot', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 20 },
        ],
      }));
    const dryServices: DryService[] = updatedMachines
      .filter((m) => m.type === 'dryer' && m.enabled)
      .map((m) => ({
        machineId: m.id,
        weight: parseInt(m.capacity, 10) || 0,
        status: m.status === 'running' ? 'busy' : m.status === 'finished' ? 'busy' : 'available',
        finishTime: m.status === 'running' && m.finishTime ? m.finishTime : null,
        options: m.options ?? [
          { setting: 'Low Heat', duration: parseInt(m.cycleTime, 10) || 45, price: parseInt(m.price, 10) || 0 },
          { setting: 'Medium Heat', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 10 },
          { setting: 'High Heat', duration: parseInt(m.cycleTime, 10) || 45, price: (parseInt(m.price, 10) || 0) + 20 },
        ],
      }));
    updateShop({ washServices, dryServices } as any);
  }, [updateShop]);

  const syncRef = useRef(syncToBackend);
  syncRef.current = syncToBackend;

  // นับถอยหลังจาก finishTime ทุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setMachines((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (m.status !== 'running') return m;
          const remaining = m.finishTime
            ? Math.floor((new Date(m.finishTime).getTime() - Date.now()) / 1000)
            : (m.secondsLeft ?? 0) - 1;
          if (remaining <= 0) {
            changed = true;
            return { ...m, status: 'finished' as MachineStatus, secondsLeft: undefined, finishTime: null };
          }
          return { ...m, secondsLeft: remaining };
        });
        if (changed) {
          syncRef.current(next);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const startMachine = useCallback((id: string, selectedOption: MachineOption) => {
    const finishTime = new Date(Date.now() + selectedOption.duration * 60 * 1000).toISOString();
    setMachines((prev) => {
      const updated = prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'running' as MachineStatus,
              secondsLeft: selectedOption.duration * 60,
              finishTime,
              price: String(selectedOption.price),
              cycleTime: String(selectedOption.duration),
              program: selectedOption.setting,
            }
          : m
      );
      syncToBackend(updated);
      return updated;
    });
  }, [syncToBackend]);

  const removeMachine = useCallback((id: string) => {
    setMachines((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      syncToBackend(updated);
      return updated;
    });
  }, [syncToBackend]);

  const skipMachine = useCallback((id: string) => {
    setMachines((prev) => {
      const updated = prev.map((m) =>
        m.id === id
          ? { ...m, status: 'finished' as MachineStatus, secondsLeft: undefined, finishTime: null, program: m.washMode ?? m.program }
          : m
      );
      syncToBackend(updated);
      return updated;
    });
  }, [syncToBackend]);

  const collectMachine = useCallback((id: string): number => {
    let earned = 0;
    setMachines((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id && m.status === 'finished') {
          earned = parseInt(m.price || '0', 10);
          return { ...m, status: 'available' as MachineStatus, program: 'Ready', washMode: undefined, waterTemp: undefined, finishTime: null };
        }
        return m;
      });
      syncToBackend(updated);
      return updated;
    });
    if (earned > 0) {
      setTodayRevenue((prev) => prev + earned);
    }
    return earned;
  }, [syncToBackend]);

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
