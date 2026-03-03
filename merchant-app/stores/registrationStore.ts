import { create } from 'zustand';

export type BusinessHoursDay = {
  day: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

export type DryCleaningItem = { name: string; price: number };
export type IronOnlyItem = { name: string; price: number };

export type RegistrationServiceItem = {
  id: string;
  name: string;
  price?: number;
  weight_kg?: string;
  duration_minutes?: string;
  description?: string;
};

export type RegistrationServiceCategory = {
  id: string;
  name: string;
  items: RegistrationServiceItem[];
};

export type WashDryFoldService = {
  enabled: boolean;
  standard_price_per_kg?: number;
  express_price_per_kg?: number;
  express_duration_hours?: number;
};

export type DryCleaningService = {
  enabled: boolean;
  items: DryCleaningItem[];
};

export type IronOnlyService = {
  enabled: boolean;
  items: IronOnlyItem[];
};

export type CoinMachineOption = {
  id: string;
  setting: string;
  duration: number;
  price: number;
};

export type CoinMachine = {
  id: string;
  machineId: string;
  type: 'washer' | 'dryer';
  capacityKg: number;
  /** ค่า base เดิม เผื่อใช้ fallback/คำนวณ template ภายหลัง */
  pricePerCycle?: number;
  durationMinutes?: number;
  options: CoinMachineOption[];
};

export interface RegistrationFormData {
  // Step 1
  shop_name?: string;
  phone?: string;
  email?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_phone?: string;
  // Step 2
  id_card_front?: string;
  id_card_back?: string;
  selfie_with_id?: string;
  id_number?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  address_on_card?: string;
  // Step 3
  business_type?: 'individual' | 'juristic';
  tax_id?: string;
  registered_name?: string;
  registered_address?: string;
  business_document?: string;
  // Step 4
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  account_type?: 'savings' | 'current';
  bank_book_image?: string;
  // Step 5
  logo?: string;
  shop_photos?: string[];
  address_line?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  capacity_per_day?: number;
  // Step 6
  business_hours?: BusinessHoursDay[];
  cut_off_time?: string;
  // Step 7
  wash_dry_fold?: WashDryFoldService;
  dry_cleaning?: DryCleaningService;
  iron_only?: IronOnlyService;
  service_categories?: RegistrationServiceCategory[];
  delivery_fee_type?: 'free' | 'by_distance' | 'fixed';
  delivery_fixed_price?: number;
  standard_duration_hours?: number;
  coin_machines?: CoinMachine[];
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

interface RegistrationState {
  formData: RegistrationFormData;
  currentStep: number;
  merchantUserId?: string;
  prefillEmail?: string;
  prefillDisplayName?: string;
  prefillPhone?: string;
  businessType?: 'full' | 'coin';
  setStep: (n: number) => void;
  updateForm: (data: Partial<RegistrationFormData>) => void;
  setPrefill: (p: { email?: string; displayName?: string; phone?: string }) => void;
  setMerchantUser: (id: string) => void;
  setBusinessType: (t: 'full' | 'coin') => void;
  resetForm: () => void;
  addServiceCategory: (name: string) => void;
  addServiceItem: (categoryId: string, name: string, price?: number, extras?: { weight_kg?: string; duration_minutes?: string; description?: string }) => void;
  removeServiceCategory: (id: string) => void;
  removeServiceItem: (categoryId: string, itemId: string) => void;
  addCoinMachine: (machine: Omit<CoinMachine, 'id'>) => void;
  updateCoinMachine: (id: string, patch: Partial<Omit<CoinMachine, 'id'>>) => void;
  removeCoinMachine: (id: string) => void;
}

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

export function build24hBusinessHours(): BusinessHoursDay[] {
  return DAYS.map((day) => ({
    day,
    is_open: true,
    open_time: '00:00',
    close_time: '23:59',
  }));
}

const defaultBusinessHours: BusinessHoursDay[] = DAYS.map((day) => ({
  day,
  is_open: day !== 'อาทิตย์',
  open_time: '08:00',
  close_time: '20:00',
}));

const defaultDryCleaningItems: DryCleaningItem[] = [
  { name: 'เสื้อเชิ้ต', price: 0 },
  { name: 'กางเกงขายาว', price: 0 },
  { name: 'สูท/แจ็คเก็ต', price: 0 },
  { name: 'ชุดราตรี', price: 0 },
];

const defaultIronOnlyItems: IronOnlyItem[] = [
  { name: 'เสื้อ', price: 0 },
  { name: 'กางเกง', price: 0 },
];

function buildDefaultCoinOptions(type: 'washer' | 'dryer'): CoinMachineOption[] {
  if (type === 'washer') {
    return ['Cold', 'Warm', 'Hot'].map((label) => ({
      id: generateId(),
      setting: label,
      duration: 0,
      price: 0,
    }));
  }
  return ['Low Heat', 'Medium Heat', 'High Heat'].map((label) => ({
    id: generateId(),
    setting: label,
    duration: 0,
    price: 0,
  }));
}

const DEFAULT_SERVICE_CATEGORIES: RegistrationServiceCategory[] = [
  { id: 'wash', name: 'Washing', items: [] },
  { id: 'dry', name: 'Drying', items: [] },
  { id: 'iron-1', name: 'Ironing - ชุดทำงาน', items: [] },
  { id: 'iron-2', name: 'Ironing - ชุดลำลอง', items: [] },
  { id: 'iron-3', name: 'Ironing - ชุดพิเศษ', items: [] },
  { id: 'fold', name: 'Folding', items: [] },
  { id: 'special', name: 'ซักพิเศษ', items: [] },
  { id: 'extra', name: 'บริการเสริม', items: [] },
];

const initialState: RegistrationFormData = {
  service_radius_km: 5,
  standard_duration_hours: 24,
  business_hours: defaultBusinessHours,
  wash_dry_fold: { enabled: false },
  dry_cleaning: { enabled: false, items: defaultDryCleaningItems },
  iron_only: { enabled: false, items: defaultIronOnlyItems },
  service_categories: DEFAULT_SERVICE_CATEGORIES,
  delivery_fee_type: 'free',
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  formData: initialState,
  currentStep: 1,
  setStep: (n) => set({ currentStep: n }),
  updateForm: (data) =>
    set((s) => ({
      formData: { ...s.formData, ...data },
    })),
  setPrefill: (p) =>
    set({
      prefillEmail: p.email,
      prefillDisplayName: p.displayName,
      prefillPhone: p.phone,
    }),
  setMerchantUser: (id) => set({ merchantUserId: id }),
  setBusinessType: (t) =>
    set((s) => ({
      businessType: t,
      formData:
        t === 'coin'
          ? {
              ...s.formData,
              business_hours: build24hBusinessHours(),
            }
          : s.formData,
    })),
  resetForm: () =>
    set({
      formData: { ...initialState },
      currentStep: 1,
    }),
  addServiceCategory: (name) =>
    set((s) => ({
      formData: {
        ...s.formData,
        service_categories: [
          ...(s.formData.service_categories || DEFAULT_SERVICE_CATEGORIES),
          { id: generateId(), name, items: [] },
        ],
      },
    })),
  addServiceItem: (categoryId, name, price, extras?: { weight_kg?: string; duration_minutes?: string; description?: string }) =>
    set((s) => {
      const cats = s.formData.service_categories || DEFAULT_SERVICE_CATEGORIES;
      const item = {
        id: generateId(),
        name,
        price: price ?? 0,
        ...(extras && {
          weight_kg: extras.weight_kg || undefined,
          duration_minutes: extras.duration_minutes || undefined,
          description: extras.description || undefined,
        }),
      };
      return {
        formData: {
          ...s.formData,
          service_categories: cats.map((c) =>
            c.id === categoryId ? { ...c, items: [...c.items, item] } : c
          ),
        },
      };
    }),
  removeServiceCategory: (id) =>
    set((s) => ({
      formData: {
        ...s.formData,
        service_categories: (s.formData.service_categories || []).filter(
          (c) => c.id !== id
        ),
      },
    })),
  removeServiceItem: (categoryId, itemId) =>
    set((s) => ({
      formData: {
        ...s.formData,
        service_categories: (s.formData.service_categories || []).map((c) =>
          c.id === categoryId
            ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
            : c
        ),
      },
    })),
  addCoinMachine: (machine) =>
    set((s) => {
      const existing = s.formData.coin_machines || [];
      const withId: CoinMachine = {
        id: generateId(),
        ...machine,
        options:
          machine.options && machine.options.length
            ? machine.options
            : buildDefaultCoinOptions(machine.type),
      };
      return {
        formData: {
          ...s.formData,
          coin_machines: [...existing, withId],
        },
      };
    }),
  updateCoinMachine: (id, patch) =>
    set((s) => ({
      formData: {
        ...s.formData,
        coin_machines: (s.formData.coin_machines || []).map((m) =>
          m.id === id ? { ...m, ...patch } : m
        ),
      },
    })),
  removeCoinMachine: (id) =>
    set((s) => ({
      formData: {
        ...s.formData,
        coin_machines: (s.formData.coin_machines || []).filter((m) => m.id !== id),
      },
    })),
}));
