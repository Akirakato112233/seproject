import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Shop } from '../models/Shop';
import {
  defaultDryServices,
  defaultWashServices,
  defaultIroningServices,
  defaultFoldingServices,
  defaultOtherServices,
} from './defaultServices';

dotenv.config();

const sampleShops = [
  {
    name: 'oi oi oi (หยอดเหรียญจร้า) - บ้านพิม',
    rating: 4.9,
    reviewCount: 2000,
    priceLevel: 3, // $$$
    type: 'coin',
    deliveryFee: 10,
    deliveryTime: 35,
    imageUrl: '',
    washServices: [
      {
        weight: 9,
        options: [
          { setting: 'Cold', duration: 35, price: 40 },
          { setting: 'Warm water ≈ 40°', duration: 40, price: 50 },
          { setting: 'Hot water ≈ 60°', duration: 45, price: 60 },
        ],
      },
      {
        weight: 14,
        options: [
          { setting: 'Cold', duration: 40, price: 60 },
          { setting: 'Warm water ≈ 40°', duration: 45, price: 70 },
          { setting: 'Hot water ≈ 60°', duration: 50, price: 80 },
        ],
      },
      {
        weight: 18,
        options: [
          { setting: 'Cold', duration: 45, price: 70 },
          { setting: 'Warm water ≈ 40°', duration: 50, price: 80 },
          { setting: 'Hot water ≈ 60°', duration: 60, price: 90 },
        ],
      },
    ],
    dryServices: [
      {
        weight: 15,
        options: [
          { setting: 'Low Heat 30°-40° C', duration: 45, price: 50 },
          { setting: 'Medium Heat 50°-60° C', duration: 40, price: 50 },
          { setting: 'High Heat 60°-70° C', duration: 35, price: 50 },
        ],
      },
      {
        weight: 25,
        options: [
          { setting: 'Low Heat 30°-40° C', duration: 70, price: 70 },
          { setting: 'Medium Heat 50°-60° C', duration: 60, price: 70 },
          { setting: 'High Heat 60°-70° C', duration: 50, price: 70 },
        ],
      },
    ],
  },
  {
    name: 'Clean & Fresh Laundry',
    rating: 4.7,
    reviewCount: 850,
    priceLevel: 2, // $$
    type: 'full',
    deliveryFee: 20,
    deliveryTime: 45,
    imageUrl: '',
    washServices: [
      {
        weight: 9,
        options: [
          { setting: 'Cold', duration: 30, price: 45 },
          { setting: 'Warm water ≈ 40°', duration: 35, price: 55 },
          { setting: 'Hot water ≈ 60°', duration: 40, price: 65 },
        ],
      },
      {
        weight: 14,
        options: [
          { setting: 'Cold', duration: 35, price: 65 },
          { setting: 'Warm water ≈ 40°', duration: 40, price: 75 },
          { setting: 'Hot water ≈ 60°', duration: 45, price: 85 },
        ],
      },
      {
        weight: 18,
        options: [
          { setting: 'Cold', duration: 40, price: 75 },
          { setting: 'Warm water ≈ 40°', duration: 45, price: 85 },
          { setting: 'Hot water ≈ 60°', duration: 55, price: 95 },
        ],
      },
    ],
    dryServices: [
      {
        weight: 15,
        options: [
          { setting: 'Low Heat 30°-40° C', duration: 40, price: 55 },
          { setting: 'Medium Heat 50°-60° C', duration: 35, price: 55 },
          { setting: 'High Heat 60°-70° C', duration: 30, price: 55 },
        ],
      },
      {
        weight: 25,
        options: [
          { setting: 'Low Heat 30°-40° C', duration: 65, price: 75 },
          { setting: 'Medium Heat 50°-60° C', duration: 55, price: 75 },
          { setting: 'High Heat 60°-70° C', duration: 45, price: 75 },
        ],
      },
    ],
  },
  {
    name: 'Quick Wash Coin Laundry',
    rating: 4.8,
    reviewCount: 1200,
    priceLevel: 1, // $
    type: 'coin',
    deliveryFee: 15,
    deliveryTime: 30,
    imageUrl: '',
    washServices: [
      {
        weight: 9,
        options: [
          { setting: 'Cold', duration: 30, price: 35 },
          { setting: 'Warm water ≈ 40°', duration: 35, price: 45 },
          { setting: 'Hot water ≈ 60°', duration: 40, price: 55 },
        ],
      },
      {
        weight: 14,
        options: [
          { setting: 'Cold', duration: 35, price: 55 },
          { setting: 'Warm water ≈ 40°', duration: 40, price: 65 },
          { setting: 'Hot water ≈ 60°', duration: 45, price: 75 },
        ],
      },
      {
        weight: 18,
        options: [
          { setting: 'Cold', duration: 40, price: 65 },
          { setting: 'Warm water ≈ 40°', duration: 45, price: 75 },
          { setting: 'Hot water ≈ 60°', duration: 55, price: 85 },
        ],
      },
    ],
    dryServices: [
      {
        weight: 15,
        options: [
          { setting: 'Low Heat 30°-40° C', duration: 40, price: 45 },
          { setting: 'Medium Heat 50°-60° C', duration: 35, price: 45 },
          { setting: 'High Heat 60°-70° C', duration: 30, price: 45 },
        ],
      },
      {
        weight: 25,
        options: [
          { setting: 'Low Heat 30°-40° C', duration: 60, price: 65 },
          { setting: 'Medium Heat 50°-60° C', duration: 50, price: 65 },
          { setting: 'High Heat 60°-70° C', duration: 40, price: 65 },
        ],
      },
    ],
  },
  {
    name: 'Premium Laundry Service',
    rating: 4.6,
    reviewCount: 500,
    priceLevel: 4, // $$$$
    type: 'full',
    deliveryFee: 30,
    deliveryTime: 60,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
    ironingServices: defaultIroningServices,
    foldingServices: defaultFoldingServices,
    otherServices: defaultOtherServices,
  },
  {
    name: '24/7 Coin Laundry',
    rating: 4.5,
    reviewCount: 650,
    priceLevel: 2, // $$
    type: 'coin',
    deliveryFee: 12,
    deliveryTime: 40,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
  },
  {
    name: 'Express Wash & Dry',
    rating: 4.4,
    reviewCount: 320,
    priceLevel: 1, // $
    type: 'coin',
    deliveryFee: 8,
    deliveryTime: 25,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
  },
  {
    name: 'Luxury Laundry & Dry Cleaning',
    rating: 4.8,
    reviewCount: 1500,
    priceLevel: 4, // $$$$
    type: 'full',
    deliveryFee: 50,
    deliveryTime: 90,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
    ironingServices: defaultIroningServices,
    foldingServices: defaultFoldingServices,
    otherServices: defaultOtherServices,
  },
  {
    name: 'Coin Wash Express',
    rating: 4.3,
    reviewCount: 420,
    priceLevel: 1, // $
    type: 'coin',
    deliveryFee: 10,
    deliveryTime: 30,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
  },
  {
    name: 'Full Service Laundry Center',
    rating: 4.7,
    reviewCount: 980,
    priceLevel: 3, // $$$
    type: 'full',
    deliveryFee: 25,
    deliveryTime: 50,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
    ironingServices: defaultIroningServices,
    foldingServices: defaultFoldingServices,
    otherServices: defaultOtherServices,
  },
  {
    name: 'Budget Coin Laundry',
    rating: 4.2,
    reviewCount: 280,
    priceLevel: 1, // $
    type: 'coin',
    deliveryFee: 5,
    deliveryTime: 20,
    imageUrl: '',
    washServices: defaultWashServices,
    dryServices: defaultDryServices,
  },
];

const seedDatabase = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await connectDB();

    // ลบข้อมูลเก่าทั้งหมด (ถ้ามี)
    await Shop.deleteMany({});
    console.log('🗑️  ลบข้อมูลเก่าแล้ว');

    // เพิ่มข้อมูลใหม่
    const shops = await Shop.insertMany(sampleShops);
    console.log(`✅ เพิ่มข้อมูล ${shops.length} ร้านเรียบร้อยแล้ว!`);

    // แสดงข้อมูลที่เพิ่ม
    console.log('\n📋 รายการร้านที่เพิ่ม:');
    shops.forEach((shop: any, index: number) => {
      console.log(`${index + 1}. ${shop.name} - Rating: ${shop.rating} ⭐`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// รัน script
seedDatabase();
