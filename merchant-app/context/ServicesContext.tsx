import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useShop, ShopData } from './ShopContext';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  items: ServiceItem[];
  defaultUnit?: string; // สำหรับ Other Services - หน่วยเริ่มต้น
}

interface ServicesContextType {
  categories: ServiceCategory[];
  loading: boolean;
  saveError: string | null;
  clearSaveError: () => void;
  addCategory: (name: string, defaultUnit?: string) => void;
  addItem: (
    categoryId: string,
    itemName: string,
    opts?: { description?: string; price?: number; weight?: number; duration?: number; unit?: string }
  ) => void;
  removeCategory: (id: string) => void;
  removeItem: (categoryId: string, itemId: string) => void;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

// แปลงข้อมูลจาก backend (ShopData) เป็นรูปแบบ categories/items สำหรับ UI
function shopToCategories(shop: ShopData): ServiceCategory[] {
  const cats: ServiceCategory[] = [];

  // Wash Services
  if (shop.washServices && shop.washServices.length > 0) {
    const items: ServiceItem[] = [];
    shop.washServices.forEach((ws, wi) => {
      ws.options.forEach((opt, oi) => {
        items.push({
          id: `wash-${wi}-${oi}`,
          name: `${opt.setting} (${ws.weight}kg)`,
          description: `${opt.duration} นาที`,
          price: opt.price,
        });
      });
    });
    cats.push({ id: 'wash', name: 'Washing', items });
  }

  // Dry Services
  if (shop.dryServices && shop.dryServices.length > 0) {
    const items: ServiceItem[] = [];
    shop.dryServices.forEach((ds, di) => {
      ds.options.forEach((opt, oi) => {
        items.push({
          id: `dry-${di}-${oi}`,
          name: `${opt.setting} (${ds.weight}kg)`,
          description: `${opt.duration} นาที`,
          price: opt.price,
        });
      });
    });
    cats.push({ id: 'dry', name: 'Drying', items });
  }

  // Ironing Services
  if (shop.ironingServices && shop.ironingServices.length > 0) {
    shop.ironingServices.forEach((is_, ii) => {
      const items: ServiceItem[] = is_.options.map((opt, oi) => ({
        id: `iron-${ii}-${oi}`,
        name: opt.type,
        price: opt.price,
      }));
      cats.push({ id: `iron-${ii}`, name: `Ironing - ${is_.category}`, items });
    });
  }

  // Folding Services
  if (shop.foldingServices && shop.foldingServices.length > 0) {
    const items: ServiceItem[] = [];
    shop.foldingServices.forEach((fs, fi) => {
      fs.options.forEach((opt, oi) => {
        items.push({
          id: `fold-${fi}-${oi}`,
          name: opt.type,
          price: opt.pricePerKg,
          description: 'ต่อ กก.',
        });
      });
    });
    cats.push({ id: 'fold', name: 'Folding', items });
  }

  // Other Services
  if (shop.otherServices && shop.otherServices.length > 0) {
    shop.otherServices.forEach((os, oi_) => {
      const items: ServiceItem[] = os.options.map((opt, oi) => ({
        id: `other-${oi_}-${oi}`,
        name: opt.name,
        price: opt.price,
        description: `ต่อ ${opt.unit}`,
      }));
      cats.push({
        id: `other-${oi_}`,
        name: os.category,
        items,
        defaultUnit: os.defaultUnit,
      });
    });
  }

  return cats;
}

// แปลงกลับจาก categories UI → backend format เพื่อ save
function categoriesToShopServices(categories: ServiceCategory[]) {
  const washServices: any[] = [];
  const dryServices: any[] = [];
  const ironingServices: any[] = [];
  const foldingServices: any[] = [];
  const otherServices: any[] = [];

  for (const cat of categories) {
    if (cat.id === 'wash' || cat.name.toLowerCase().includes('wash')) {
      // จัดกลุ่มตาม weight
      const byWeight: Record<number, any[]> = {};
      cat.items.forEach((item) => {
        const weightMatch = item.name.match(/\((\d+)kg\)/);
        const weight = weightMatch ? parseInt(weightMatch[1]) : 9;
        if (!byWeight[weight]) byWeight[weight] = [];
        const settingName = item.name.replace(/\s*\(\d+kg\)/, '');
        byWeight[weight].push({
          setting: settingName,
          duration: parseInt(item.description || '30') || 30,
          price: item.price || 0,
        });
      });
      Object.entries(byWeight).forEach(([w, opts]) => {
        washServices.push({ weight: Number(w), options: opts });
      });
    } else if (cat.id === 'dry' || cat.name.toLowerCase().includes('dry')) {
      const byWeight: Record<number, any[]> = {};
      cat.items.forEach((item) => {
        const weightMatch = item.name.match(/\((\d+)kg\)/);
        const weight = weightMatch ? parseInt(weightMatch[1]) : 15;
        if (!byWeight[weight]) byWeight[weight] = [];
        const settingName = item.name.replace(/\s*\(\d+kg\)/, '');
        byWeight[weight].push({
          setting: settingName,
          duration: parseInt(item.description || '30') || 30,
          price: item.price || 0,
        });
      });
      Object.entries(byWeight).forEach(([w, opts]) => {
        dryServices.push({ weight: Number(w), options: opts });
      });
    } else if (cat.id.startsWith('iron') || cat.name.toLowerCase().includes('iron')) {
      const catName = cat.name.replace(/^Ironing\s*-\s*/, '');
      ironingServices.push({
        category: catName,
        options: cat.items.map((item) => ({
          type: item.name,
          price: item.price || 0,
        })),
      });
    } else if (cat.id === 'fold' || cat.name.toLowerCase().includes('fold')) {
      foldingServices.push({
        options: cat.items.map((item) => ({
          type: item.name,
          pricePerKg: item.price || 0,
        })),
      });
    } else {
      otherServices.push({
        category: cat.name,
        defaultUnit: cat.defaultUnit,
        options: cat.items.map((item) => ({
          name: item.name,
          price: item.price || 0,
          unit: item.description?.replace('ต่อ ', '') || 'ชิ้น',
        })),
      });
    }
  }

  return { washServices, dryServices, ironingServices, foldingServices, otherServices };
}

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const { shop, updateShop, loading: shopLoading } = useShop();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // โหลด categories จาก shop data
  useEffect(() => {
    if (shop) {
      const cats = shopToCategories(shop);
      setCategories(cats);
      setLoading(false);
      setSaveError(null);
    } else if (!shopLoading) {
      setLoading(false);
    }
  }, [shop, shopLoading]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  // บันทึกการเปลี่ยนแปลงกลับไปที่ backend
  // ถ้าบันทึกไม่สำเร็จ จะ rollback categories ให้ตรงกับข้อมูลจาก DB และแจ้งผู้ใช้
  const saveToBackend = useCallback(
    async (newCategories: ServiceCategory[]) => {
      const services = categoriesToShopServices(newCategories);
      const success = await updateShop(services);
      if (success) {
        setSaveError(null);
      } else {
        setSaveError('ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ');
        if (shop) {
          setCategories(shopToCategories(shop));
        }
        const msg = 'บันทึกไม่สำเร็จ ข้อมูลได้ถูกคืนค่าให้ตรงกับฐานข้อมูลแล้ว';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('เกิดข้อผิดพลาด', msg, [{ text: 'ตกลง' }]);
        }
      }
    },
    [updateShop, shop]
  );

  const addCategory = useCallback((name: string, defaultUnit?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      const updated = [
        ...prev,
        {
          id: Date.now().toString(),
          name: trimmed,
          items: [],
          defaultUnit: defaultUnit?.trim() || undefined,
        },
      ];
      saveToBackend(updated);
      return updated;
    });
  }, [saveToBackend]);

  const addItem = useCallback(
    (categoryId: string, itemName: string, opts?: { description?: string; price?: number; weight?: number; duration?: number; unit?: string }) => {
      const trimmed = itemName.trim();
      if (!trimmed) return;
      const cat = categories.find((c) => c.id === categoryId);
      const isWash = cat?.id === 'wash' || cat?.name.toLowerCase().includes('wash');
      const isDry = cat?.id === 'dry' || cat?.name.toLowerCase().includes('dry');
      const isOther = cat && !isWash && !isDry && !cat.id.startsWith('iron') && !(cat.id === 'fold' || cat.name.toLowerCase().includes('fold'));

      let displayName = trimmed;
      let description = opts?.description;
      if (isWash || isDry) {
        const w = opts?.weight ?? (isWash ? 9 : 15);
        displayName = `${trimmed} (${w}kg)`;
        description = opts?.duration != null ? `${opts.duration} นาที` : (description || '30 นาที');
      } else if (isOther) {
        const u = opts?.unit || cat?.defaultUnit || 'ชิ้น';
        description = `ต่อ ${u}`;
      }

      setCategories((prev) => {
        const updated = prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                items: [
                  ...c.items,
                  {
                    id: `${categoryId}-${Date.now()}`,
                    name: displayName,
                    description,
                    price: opts?.price,
                  },
                ],
              }
            : c
        );
        saveToBackend(updated);
        return updated;
      });
    },
    [saveToBackend, categories]
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveToBackend(updated);
      return updated;
    });
  }, [saveToBackend]);

  const removeItem = useCallback((categoryId: string, itemId: string) => {
    setCategories((prev) => {
      const updated = prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
          : cat
      );
      saveToBackend(updated);
      return updated;
    });
  }, [saveToBackend]);

  return (
    <ServicesContext.Provider
      value={{
        categories,
        loading,
        saveError,
        clearSaveError,
        addCategory,
        addItem,
        removeCategory,
        removeItem,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
