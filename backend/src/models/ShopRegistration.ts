import mongoose, { Schema, Document } from 'mongoose';

export interface IShopRegistration extends Document {
  merchantUserId: string;
  status: 'pending' | 'approved' | 'rejected';
  // Step 1
  shop_name: string;
  phone: string;
  email: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_phone?: string;
  passwordHash?: string;
  // Step 2
  id_card_front?: string; // base64 or URL
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
  business_hours?: Array<{
    day: string;
    is_open: boolean;
    open_time: string;
    close_time: string;
  }>;
  cut_off_time?: string;
  // Step 7
  wash_dry_fold?: {
    enabled: boolean;
    standard_price_per_kg?: number;
    express_price_per_kg?: number;
    express_duration_hours?: number;
  };
  dry_cleaning?: {
    enabled: boolean;
    items: Array<{ name: string; price: number }>;
  };
  iron_only?: {
    enabled: boolean;
    items: Array<{ name: string; price: number }>;
  };
  delivery_fee_type?: 'free' | 'by_distance' | 'fixed';
  delivery_fixed_price?: number;
  standard_duration_hours?: number;
  service_categories?: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      name: string;
      price?: number;
      weight_kg?: string;
      duration_minutes?: string;
      description?: string;
    }>;
  }>;
  businessType?: 'full' | 'coin';
  coin_machines?: Array<{
    machineId: string;
    type: 'washer' | 'dryer';
    capacityKg: number;
    pricePerCycle?: number;
    durationMinutes?: number;
    options?: Array<{
      id: string;
      setting: string;
      duration: number;
      price: number;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ShopRegistrationSchema = new Schema<IShopRegistration>(
  {
    merchantUserId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    shop_name: { type: String },
    phone: { type: String },
    email: { type: String },
    owner_first_name: { type: String },
    owner_last_name: { type: String },
    owner_phone: { type: String },
    passwordHash: { type: String },
    id_card_front: { type: String },
    id_card_back: { type: String },
    selfie_with_id: { type: String },
    id_number: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    date_of_birth: { type: String },
    address_on_card: { type: String },
    business_type: { type: String, enum: ['individual', 'juristic'] },
    tax_id: { type: String },
    registered_name: { type: String },
    registered_address: { type: String },
    business_document: { type: String },
    bank_name: { type: String },
    account_number: { type: String },
    account_name: { type: String },
    account_type: { type: String, enum: ['savings', 'current'] },
    bank_book_image: { type: String },
    logo: { type: String },
    shop_photos: [String],
    address_line: { type: String },
    subdistrict: { type: String },
    district: { type: String },
    province: { type: String },
    postal_code: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    service_radius_km: { type: Number },
    capacity_per_day: { type: Number },
    business_hours: [
      {
        day: String,
        is_open: Boolean,
        open_time: String,
        close_time: String,
      },
    ],
    cut_off_time: { type: String },
    wash_dry_fold: {
      enabled: Boolean,
      standard_price_per_kg: Number,
      express_price_per_kg: Number,
      express_duration_hours: Number,
    },
    dry_cleaning: {
      enabled: Boolean,
      items: [{ name: String, price: Number }],
    },
    iron_only: {
      enabled: Boolean,
      items: [{ name: String, price: Number }],
    },
    delivery_fee_type: { type: String, enum: ['free', 'by_distance', 'fixed'] },
    delivery_fixed_price: { type: Number },
    standard_duration_hours: { type: Number },
    service_categories: [
      {
        id: String,
        name: String,
        items: [
          {
            id: String,
            name: String,
            price: Number,
            weight_kg: String,
            duration_minutes: String,
            description: String,
          },
        ],
      },
    ],
    businessType: { type: String, enum: ['full', 'coin'] },
    coin_machines: [
      {
        machineId: String,
        type: { type: String, enum: ['washer', 'dryer'] },
        capacityKg: Number,
        pricePerCycle: Number,
        durationMinutes: Number,
        options: [
          {
            id: String,
            setting: String,
            duration: Number,
            price: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const ShopRegistration = mongoose.model<IShopRegistration>(
  'ShopRegistration',
  ShopRegistrationSchema,
  'shop-registrations'
);
