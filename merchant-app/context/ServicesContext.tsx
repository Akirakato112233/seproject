import React, { createContext, useCallback, useContext, useState } from 'react';

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
}

interface ServicesContextType {
  categories: ServiceCategory[];
  addCategory: (name: string) => void;
  addItem: (
    categoryId: string,
    itemName: string,
    opts?: { description?: string; price?: number }
  ) => void;
  removeCategory: (id: string) => void;
  removeItem: (categoryId: string, itemId: string) => void;
}

const defaultCategories: ServiceCategory[] = [
  { id: '1', name: 'Ironing', items: [{ id: '1-1', name: 'Shirt' }] },
  { id: '2', name: 'Washing', items: [{ id: '2-1', name: 'Cold Wash' }] },
  { id: '3', name: 'Drying', items: [{ id: '3-1', name: 'Machine Dry' }] },
];

const ServicesContext = createContext<ServicesContextType | null>(null);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<ServiceCategory[]>(defaultCategories);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: trimmed,
        items: [],
      },
    ]);
  }, []);

  const addItem = useCallback(
    (
      categoryId: string,
      itemName: string,
      opts?: { description?: string; price?: number }
    ) => {
      const trimmed = itemName.trim();
      if (!trimmed) return;
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: [
                  ...cat.items,
                  {
                    id: `${categoryId}-${Date.now()}`,
                    name: trimmed,
                    description: opts?.description,
                    price: opts?.price,
                  },
                ],
              }
            : cat
        )
      );
    },
    []
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const removeItem = useCallback((categoryId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
          : cat
      )
    );
  }, []);

  return (
    <ServicesContext.Provider
      value={{
        categories,
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
