import {
  IDryService,
  IIroningService,
  IFoldingService,
  IOtherService,
  IWashService,
} from '../models/Shop';

/** พวกนี้คือ template เริ่มต้นสำหรับร้าน full-service */

export const defaultWashServices: IWashService[] = [
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
];

export const defaultDryServices: IDryService[] = [
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
];

export const defaultIroningServices: IIroningService[] = [
  {
    category: 'ชุดทำงาน',
    options: [
      { type: 'เสื้อเชิ้ต', price: 30 },
      { type: 'กางเกงทำงาน', price: 30 },
      { type: 'กระโปรง', price: 35 },
      { type: 'ชุดสูท (เสื้อ)', price: 50 },
      { type: 'ชุดสูท (กางเกง)', price: 40 },
    ],
  },
  {
    category: 'ชุดลำลอง',
    options: [
      { type: 'เสื้อยืด', price: 20 },
      { type: 'เสื้อโปโล', price: 25 },
      { type: 'กางเกงยีนส์', price: 30 },
      { type: 'ชุดเดรส', price: 50 },
    ],
  },
  {
    category: 'ชุดพิเศษ',
    options: [
      { type: 'ชุดราตรี', price: 100 },
      { type: 'ชุดไทย', price: 150 },
      { type: 'ชุดสูทครบชุด', price: 120 },
    ],
  },
];

export const defaultFoldingServices: IFoldingService[] = [
  {
    options: [
      { type: 'พับธรรมดา', pricePerKg: 10 },
      { type: 'พับพิเศษ (แยกประเภท)', pricePerKg: 15 },
      { type: 'พับพรีเมียม (ใส่ถุง)', pricePerKg: 20 },
    ],
  },
];

export const defaultOtherServices: IOtherService[] = [
  {
    category: 'ซักพิเศษ',
    defaultUnit: 'ชิ้น',
    options: [
      { name: 'ซักแห้ง', price: 80, unit: 'ชิ้น' },
      { name: 'ซักผ้าม่าน', price: 50, unit: 'ตร.ม.' },
      { name: 'ซักพรม', price: 100, unit: 'ตร.ม.' },
      { name: 'ซักผ้าห่ม', price: 100, unit: 'ผืน' },
      { name: 'ซักหมอน', price: 80, unit: 'ใบ' },
    ],
  },
  {
    category: 'บริการเสริม',
    defaultUnit: 'ชิ้น',
    options: [
      { name: 'ซ่อมซิป', price: 50, unit: 'ชิ้น' },
      { name: 'ซ่อมกระดุม', price: 20, unit: 'เม็ด' },
      { name: 'ขัดรองเท้า', price: 60, unit: 'คู่' },
      { name: 'ซักรองเท้าผ้าใบ', price: 100, unit: 'คู่' },
    ],
  },
];
