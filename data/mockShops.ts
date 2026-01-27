import { LaundryShop } from '../components/LaundryShopCard';

// Mock data สำหรับร้านซักรีด
export const mockShops: LaundryShop[] = [
  {
    id: '1',
    name: 'oi oi oi (หยอดเหรียญจร้า) - บ้านพิม',
    rating: 4.9,
    reviewCount: 2000,
    priceLevel: 3, // $$$
    type: 'coin',
    deliveryFee: 10,
    deliveryTime: 35,
  },
  {
    id: '2',
    name: 'Clean & Fresh Laundry',
    rating: 3.7,
    reviewCount: 850,
    priceLevel: 2, // $$
    type: 'full',
    deliveryFee: 20,
    deliveryTime: 45,
  },
  {
    id: '3',
    name: 'Quick Wash Coin Laundry',
    rating: 4.8,
    reviewCount: 1200,
    priceLevel: 1, // $
    type: 'coin',
    deliveryFee: 15,
    deliveryTime: 30,
  },
  {
    id: '4',
    name: 'Premium Laundry Service',
    rating: 4.6,
    reviewCount: 500,
    priceLevel: 4, // $$$$
    type: 'full',
    deliveryFee: 30,
    deliveryTime: 60,
  },
  {
    id: '5',
    name: '24/7 Coin Laundry',
    rating: 4.5,
    reviewCount: 650,
    priceLevel: 2, // $$
    type: 'coin',
    deliveryFee: 12,
    deliveryTime: 40,
  },
];
