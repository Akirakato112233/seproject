import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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

const WASH_DURATION_SEC = 60 * 60; // 60 นาที

const INITIAL_MACHINES: Machine[] = [
  { id: 'W-01', name: 'W-01', status: 'running', type: 'washer', capacity: '15', price: '40', cycleTime: '45', enabled: true, program: 'Cotton', secondsLeft: 12 * 60 },
  { id: 'W-02', name: 'W-02', status: 'available', type: 'washer', capacity: '15', price: '40', cycleTime: '45', enabled: true, program: 'Ready' },
  { id: 'W-03', name: 'W-03', status: 'finished', type: 'washer', capacity: '10', price: '30', cycleTime: '45', enabled: true, program: 'Quick' },
  { id: 'W-04', name: 'W-04', status: 'offline', type: 'washer', capacity: '10', price: '30', cycleTime: '45', enabled: false, program: 'Maintenance' },
  { id: 'W-05', name: 'W-05', status: 'running', type: 'washer', capacity: '15', price: '40', cycleTime: '45', enabled: true, program: 'Cotton', secondsLeft: 25 * 60 },
  { id: 'W-06', name: 'W-06', status: 'available', type: 'washer', capacity: '10', price: '30', cycleTime: '45', enabled: true, program: 'Ready' },
  { id: 'W-07', name: 'W-07', status: 'running', type: 'washer', capacity: '15', price: '40', cycleTime: '45', enabled: true, program: 'Quick', secondsLeft: 8 * 60 },
  { id: 'W-08', name: 'W-08', status: 'finished', type: 'washer', capacity: '10', price: '30', cycleTime: '45', enabled: true, program: 'Cotton' },
];

export function MachineProvider({ children }: { children: React.ReactNode }) {
  const [machines, setMachines] = useState<Machine[]>(() => [...INITIAL_MACHINES]);
  const [todayRevenue, setTodayRevenue] = useState(0);

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

  const updateMachineConfig = useCallback((id: string, updates: { price?: string; capacity?: string; cycleTime?: string }) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

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
    setMachines((prev) => [...prev, machine]);
  }, []);

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
    setMachines((prev) => prev.filter((m) => m.id !== id));
  }, []);

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
