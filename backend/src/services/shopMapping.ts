import { IShop, IOtherService, IOtherServiceOption } from '../models/Shop';
import { IShopRegistration } from '../models/ShopRegistration';
import {
  defaultDryServices,
  defaultFoldingServices,
  defaultIroningServices,
  defaultOtherServices,
  defaultWashServices,
} from '../config/defaultServices';

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function buildOpeningHours(
  businessHours: IShopRegistration['business_hours']
): IShop['openingHours'] {
  if (!businessHours || !businessHours.length) return [];
  return businessHours
    .filter((b) => b.is_open)
    .map((b) => ({
      days: [b.day],
      open: b.open_time,
      close: b.close_time,
    }));
}

function mergeOtherServicesFromCategories(
  registration: IShopRegistration,
  base: IOtherService[]
): IOtherService[] {
  const categories = registration.service_categories || [];
  if (!categories.length) return base;

  const result: IOtherService[] = clone(base);

  const upsertCategory = (categoryName: string, defaultUnit: string): IOtherService => {
    let cat = result.find((c) => c.category === categoryName);
    if (!cat) {
      cat = { category: categoryName, defaultUnit, options: [] };
      result.push(cat);
    }
    return cat;
  };

  for (const cat of categories) {
    if (!cat.items || !cat.items.length) continue;

    if (cat.id === 'special' || cat.name.includes('ซักพิเศษ')) {
      const target = upsertCategory('ซักพิเศษ', 'ชิ้น');
      const extras: IOtherServiceOption[] = cat.items.map((item) => ({
        name: item.name,
        price: item.price ?? 0,
        unit: target.defaultUnit || 'ชิ้น',
      }));
      target.options.push(...extras);
    }

    if (cat.id === 'extra' || cat.name.includes('บริการเสริม')) {
      const target = upsertCategory('บริการเสริม', 'ชิ้น');
      const extras: IOtherServiceOption[] = cat.items.map((item) => ({
        name: item.name,
        price: item.price ?? 0,
        unit: target.defaultUnit || 'ชิ้น',
      }));
      target.options.push(...extras);
    }
  }

  // dry_cleaning.items → ซักพิเศษ
  if (registration.dry_cleaning?.enabled && registration.dry_cleaning.items?.length) {
    const target = upsertCategory('ซักพิเศษ', 'ชิ้น');
    for (const item of registration.dry_cleaning.items) {
      target.options.push({
        name: item.name,
        price: item.price,
        unit: target.defaultUnit || 'ชิ้น',
      });
    }
  }

  return result;
}

export function buildShopFromRegistration(reg: IShopRegistration): Partial<IShop> {
  const type: IShop['type'] = reg.businessType === 'coin' ? 'coin' : 'full';

  const deliveryFeeType = reg.delivery_fee_type || 'free';
  let deliveryFee = 0;
  if (deliveryFeeType === 'fixed' && typeof reg.delivery_fixed_price === 'number') {
    deliveryFee = reg.delivery_fixed_price;
  }

  const standardHours = reg.standard_duration_hours ?? 24;
  const deliveryTime = standardHours > 0 ? standardHours * 60 : 90;

  const imageUrl = reg.logo || (reg.shop_photos && reg.shop_photos[0]) || undefined;

  const location =
    typeof reg.latitude === 'number' && typeof reg.longitude === 'number'
      ? { lat: reg.latitude, lng: reg.longitude }
      : undefined;

  let washServices: IShop['washServices'] | undefined = [];
  let dryServices: IShop['dryServices'] | undefined = [];
  let ironingServices: IShop['ironingServices'] | undefined = [];
  let foldingServices: IShop['foldingServices'] | undefined = [];
  // otherServices: สำหรับ coin ใช้ template + registration, สำหรับ full ใช้เฉพาะ registration
  let otherServices: IShop['otherServices'] | undefined;

  if (type === 'coin') {
    const machines = reg.coin_machines || [];
    if (machines.length) {
      const washerMachines = machines.filter((m) => m.type === 'washer');
      const dryerMachines = machines.filter((m) => m.type === 'dryer');

      if (washerMachines.length) {
        washServices = washerMachines.map((m) => {
          const hasOptions = m.options && m.options.length > 0;
          const options = hasOptions
            ? m.options!.map((o) => ({
                setting: o.setting,
                duration: o.duration,
                price: o.price,
              }))
            : [
                {
                  setting: 'Standard',
                  duration: m.durationMinutes ?? 45,
                  price: m.pricePerCycle ?? 0,
                },
              ];
          return {
            machineId: m.machineId,
            weight: m.capacityKg,
            status: 'available',
            finishTime: null,
            options,
          };
        });
      }

      if (dryerMachines.length) {
        dryServices = dryerMachines.map((m) => {
          const hasOptions = m.options && m.options.length > 0;
          const options = hasOptions
            ? m.options!.map((o) => ({
                setting: o.setting,
                duration: o.duration,
                price: o.price,
              }))
            : [
                {
                  setting: 'Standard',
                  duration: m.durationMinutes ?? 45,
                  price: m.pricePerCycle ?? 0,
                },
              ];
          return {
            machineId: m.machineId,
            weight: m.capacityKg,
            status: 'available',
            finishTime: null,
            options,
          };
        });
      }
    }
    // ถ้าไม่มี coin_machines เลย ให้ fallback ใช้ template เดิม
    if (!washServices || !washServices.length) {
      washServices = clone(defaultWashServices);
    }
    if (!dryServices || !dryServices.length) {
      dryServices = clone(defaultDryServices);
    }
    if (!ironingServices || !ironingServices.length) {
      ironingServices = clone(defaultIroningServices);
    }
    if (!foldingServices || !foldingServices.length) {
      foldingServices = clone(defaultFoldingServices);
    }

    // coin shop: otherServices เริ่มจาก template + registration
    otherServices = mergeOtherServicesFromCategories(reg, defaultOtherServices);
  } else {
    // สำหรับร้าน full-service: พยายามสร้าง services จาก service_categories ถ้ามี
    const categories = reg.service_categories || [];
    if (categories.length) {
      for (const cat of categories) {
        const items = cat.items || [];
        if (!items.length) continue;

        if (cat.id === 'wash' || /wash/i.test(cat.name)) {
          const byWeight: Record<number, { setting: string; duration: number; price: number }[]> = {};
          for (const item of items) {
            const w = item.weight_kg ? parseFloat(item.weight_kg) : 9;
            const d = item.duration_minutes ? parseInt(item.duration_minutes, 10) || 30 : 30;
            const p = typeof item.price === 'number' ? item.price : 0;
            if (!byWeight[w]) byWeight[w] = [];
            byWeight[w].push({
              setting: item.name,
              duration: d,
              price: p,
            });
          }
          Object.entries(byWeight).forEach(([w, opts]) => {
            (washServices as any).push({ weight: Number(w), options: opts });
          });
        } else if (cat.id === 'dry' || /dry/i.test(cat.name)) {
          const byWeight: Record<number, { setting: string; duration: number; price: number }[]> = {};
          for (const item of items) {
            const w = item.weight_kg ? parseFloat(item.weight_kg) : 15;
            const d = item.duration_minutes ? parseInt(item.duration_minutes, 10) || 30 : 30;
            const p = typeof item.price === 'number' ? item.price : 0;
            if (!byWeight[w]) byWeight[w] = [];
            byWeight[w].push({
              setting: item.name,
              duration: d,
              price: p,
            });
          }
          Object.entries(byWeight).forEach(([w, opts]) => {
            (dryServices as any).push({ weight: Number(w), options: opts });
          });
        } else if (cat.id.startsWith('iron') || /iron/i.test(cat.name)) {
          const catName = cat.name.replace(/^Ironing\s*-\s*/i, '');
          (ironingServices as any).push({
            category: catName,
            options: items.map((item) => ({
              type: item.name,
              price: typeof item.price === 'number' ? item.price : 0,
            })),
          });
        } else if (cat.id === 'fold' || /fold/i.test(cat.name)) {
          (foldingServices as any).push({
            options: items.map((item) => ({
              type: item.name,
              pricePerKg: typeof item.price === 'number' ? item.price : 0,
            })),
          });
        }
      }
    }

    // สำหรับร้าน full-service: otherServices ใช้เฉพาะจาก registration (ไม่มี template เริ่มต้น)
    otherServices = mergeOtherServicesFromCategories(reg, []);
  }

  const openingHours = buildOpeningHours(reg.business_hours);

  const shop: Partial<IShop> = {
    name: reg.shop_name || reg.registered_name || 'ร้านซักผ้า',
    rating: 4.8,
    reviewCount: 0,
    priceLevel: 4,
    type,
    deliveryFee,
    deliveryTime,
    balance: 0,
    status: true,
    openingHours,
    imageUrl,
    location,
    washServices,
    dryServices,
    ironingServices,
    foldingServices,
    otherServices,
  };

  return shop;
}

