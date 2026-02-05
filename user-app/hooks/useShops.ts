import { useState, useEffect } from 'react';
import { LaundryShop } from '../components/LaundryShopCard';
import { getShops, FilterParams } from '../services/api';
import { mockShops } from '../data/mockShops';

interface UseShopsOptions {
  filters?: FilterParams;
  useMockData?: boolean; // ใช้ mock data ถ้า backend ยังไม่พร้อม
}

export const useShops = (options: UseShopsOptions = {}) => {
  const { filters, useMockData = false } = options;
  const [shops, setShops] = useState<LaundryShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      setError(null);

      try {
        if (useMockData) {
          // ใช้ mock data สำหรับ development
          setShops(mockShops);
        } else {
          // เรียก API จาก backend
          const data = await getShops(filters);
          setShops(data);
        }
      } catch (err) {
        console.error('Error loading shops:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shops');
        // Fallback to mock data if API fails
        setShops(mockShops);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [filters, useMockData]);

  return { shops, loading, error, refetch: () => fetchShops() };
};
