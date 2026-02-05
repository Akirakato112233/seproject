
// เราจะขยายข้อมูล Mock ให้มี field ครบตามที่หน้า [id].tsx ต้องการ
// (โดยปกติเราควรแก้ Interface LaundryShop หลักให้ครบด้วย แต่ใน Mock ใส่ไปเลยก็ใช้งานได้ครับ)

export const mockShops: any[] = [
  {
    id: '1',
    name: 'oi oi oi (หยอดเหรียญจร้า) - บ้านพิม',
    rating: 4.9,
    reviewCount: 2000,
    priceLevel: 1, 
    type: 'coin',
    deliveryFee: 10,
    deliveryTime: 35,
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?q=80&w=2071&auto=format&fit=crop',
    washServices: [
      {
        weight: 9,
        options: [
            { setting: 'Cold Wash', duration: 30, price: 30 },
            { setting: 'Warm Wash', duration: 40, price: 40 },
            { setting: 'Hot Wash', duration: 50, price: 50 },
        ]
      },
      {
        weight: 14,
        options: [
            { setting: 'Cold Wash', duration: 40, price: 50 },
            { setting: 'Warm Wash', duration: 50, price: 60 },
            { setting: 'Hot Wash', duration: 60, price: 70 },
        ]
      }
    ],
    dryServices: [
       {
        weight: 14,
        options: [
            { setting: 'Medium Heat', duration: 25, price: 40 },
            { setting: 'High Heat', duration: 25, price: 40 },
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Clean & Fresh Laundry',
    rating: 3.7,
    reviewCount: 850,
    priceLevel: 2, 
    type: 'full',
    deliveryFee: 20,
    deliveryTime: 45,
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6799a6c6f?q=80&w=2070&auto=format&fit=crop',
    washServices: [
      {
        weight: 10,
        options: [
            { setting: 'Standard Wash', duration: 60, price: 80 },
            { setting: 'Premium Wash', duration: 70, price: 120 },
        ]
      }
    ],
    dryServices: [
       {
        weight: 10,
        options: [
            { setting: 'Standard Dry', duration: 45, price: 60 },
        ]
      }
    ],
    ironingServices: [
        {
            category: 'เสื้อส่วนบน',
            options: [
                { type: 'เสื้อยืด', price: 15 },
                { type: 'เสื้อเชิ้ต', price: 25 },
                { type: 'เสื้อสูท', price: 50 }
            ]
        },
        {
            category: 'กางเกง/กระโปรง',
            options: [
                { type: 'กางเกงขาสั้น', price: 15 },
                { type: 'กางเกงขายาว', price: 25 },
                { type: 'กระโปรงจีบ', price: 30 }
            ]
        }
    ],
    foldingServices: [
        {
            options: [
                { type: 'พับทั่วไป', pricePerKg: 20 },
                { type: 'พับจัดระเบียบพิเศษ', pricePerKg: 35 }
            ]
        }
    ],
    otherServices: [
        {
            category: 'ซักแห้ง (Dry Clean)',
            options: [
                { name: 'ชุดราตรี', price: 250, unit: 'ชุด' },
                { name: 'ผ้านวม 6 ฟุต', price: 150, unit: 'ผืน' }
            ]
        }
    ]
  },
  {
    id: '3',
    name: 'Quick Wash Coin Laundry',
    rating: 4.8,
    reviewCount: 1200,
    priceLevel: 1, 
    type: 'coin',
    deliveryFee: 15,
    deliveryTime: 30,
    imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db236ea?q=80&w=2070&auto=format&fit=crop',
    washServices: [
        {
          weight: 7,
          options: [
              { setting: 'Quick Wash', duration: 25, price: 30 },
              { setting: 'Deep Wash', duration: 40, price: 50 },
          ]
        }
      ],
      dryServices: [
         {
          weight: 7,
          options: [
              { setting: 'Standard Dry', duration: 30, price: 30 },
          ]
        }
      ]
  },
  {
    id: '4',
    name: 'Premium Laundry Service',
    rating: 4.6,
    reviewCount: 500,
    priceLevel: 4, 
    type: 'full',
    deliveryFee: 30,
    deliveryTime: 60,
    imageUrl: 'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?q=80&w=2070&auto=format&fit=crop',
    washServices: [
        {
          weight: 15,
          options: [
              { setting: 'Luxury Care', duration: 90, price: 300 },
          ]
        }
      ],
      ironingServices: [
        {
            category: 'Premium Ironing',
            options: [
                { type: 'Silk Shirt', price: 100 },
                { type: 'Tuxedo', price: 150 }
            ]
        }
    ]
  },
  {
    id: '5',
    name: '24/7 Coin Laundry',
    rating: 4.5,
    reviewCount: 650,
    priceLevel: 2, 
    type: 'coin',
    deliveryFee: 12,
    deliveryTime: 40,
    imageUrl: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=2070&auto=format&fit=crop',
    washServices: [
        {
          weight: 12,
          options: [
              { setting: 'Normal Wash', duration: 45, price: 60 },
          ]
        }
      ],
      dryServices: [
         {
          weight: 12,
          options: [
              { setting: 'Hot Dry', duration: 40, price: 50 },
          ]
        }
      ]
  },
];