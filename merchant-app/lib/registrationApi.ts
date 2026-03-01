import type { RegistrationFormData } from '../stores/registrationStore';
import { API, NGROK_HEADERS } from '../config';
import { uriToBase64 } from './imageUtils';
import { uploadImageToUrl } from './uploadImage';

export type SaveRegistrationOptions = {
  /** Upload images and store as URL (Supabase). If Supabase not configured, falls back to base64. */
  convertImages?: boolean;
  /** Use URL storage (Supabase) instead of base64. Default true. */
  useUrlStorage?: boolean;
  /** Override form fields (e.g. local state from step 7) */
  overrides?: Partial<Record<string, unknown>>;
};

/**
 * Save registration to backend (upsert by merchantUserId).
 * Call from every step when user clicks Next to persist progress.
 */
export async function saveRegistration(
  formData: RegistrationFormData,
  merchantUserId: string,
  options: SaveRegistrationOptions = {}
): Promise<{ success: boolean; registrationId?: string; message?: string }> {
  const { convertImages = true, useUrlStorage = true, overrides = {} } = options;

  let idFront: string | undefined;
  let idBack: string | undefined;
  let selfie: string | undefined;
  let bizDoc: string | undefined;
  let bankBook: string | undefined;
  let logo: string | undefined;
  let shopPhotos: string[] = [];

  if (convertImages) {
    const uploadOrBase64 = async (uri: string, prefix: string) => {
      if (useUrlStorage) {
        const url = await uploadImageToUrl(uri, { prefix });
        if (url) return url;
      }
      return uriToBase64(uri);
    };

    const [f, b, s, bd, bb, l, sp] = await Promise.all([
      formData.id_card_front ? uploadOrBase64(formData.id_card_front, 'id-front') : Promise.resolve(undefined),
      formData.id_card_back ? uploadOrBase64(formData.id_card_back, 'id-back') : Promise.resolve(undefined),
      formData.selfie_with_id ? uploadOrBase64(formData.selfie_with_id, 'selfie') : Promise.resolve(undefined),
      formData.business_document ? uploadOrBase64(formData.business_document, 'biz-doc') : Promise.resolve(undefined),
      formData.bank_book_image ? uploadOrBase64(formData.bank_book_image, 'bank-book') : Promise.resolve(undefined),
      formData.logo ? uploadOrBase64(formData.logo, 'logo') : Promise.resolve(undefined),
      formData.shop_photos?.length
        ? Promise.all((formData.shop_photos || []).map((u) => uploadOrBase64(u, 'shop-photo')))
        : Promise.resolve([]),
    ]);
    idFront = (f ?? undefined) as string | undefined;
    idBack = (b ?? undefined) as string | undefined;
    selfie = (s ?? undefined) as string | undefined;
    bizDoc = (bd ?? undefined) as string | undefined;
    bankBook = (bb ?? undefined) as string | undefined;
    logo = (l ?? undefined) as string | undefined;
    shopPhotos = (sp as (string | null)[]).filter(Boolean) as string[];
  }

  // Only include image fields when we have data (convertImages=true)
  const imageFields: Record<string, unknown> = convertImages
    ? {
        id_card_front: idFront,
        id_card_back: idBack,
        selfie_with_id: selfie,
        business_document: bizDoc,
        bank_book_image: bankBook,
        logo: logo,
        shop_photos: shopPhotos.length ? shopPhotos : formData.shop_photos || [],
      }
    : {};

  const body: Record<string, unknown> = {
    merchantUserId,
    businessType: overrides.businessType,
    shop_name: formData.shop_name,
    phone: formData.phone,
    email: formData.email,
    owner_first_name: formData.owner_first_name,
    owner_last_name: formData.owner_last_name,
    owner_phone: formData.owner_phone,
    ...imageFields,
    id_number: formData.id_number,
    first_name: formData.first_name,
    last_name: formData.last_name,
    date_of_birth: formData.date_of_birth,
    address_on_card: formData.address_on_card,
    business_type: formData.business_type,
    tax_id: formData.tax_id,
    registered_name: formData.registered_name,
    registered_address: formData.registered_address,
    bank_name: formData.bank_name,
    account_number: formData.account_number,
    account_name: formData.account_name,
    account_type: formData.account_type,
    address_line: formData.address_line,
    subdistrict: formData.subdistrict,
    district: formData.district,
    province: formData.province,
    postal_code: formData.postal_code,
    latitude: formData.latitude,
    longitude: formData.longitude,
    service_radius_km: formData.service_radius_km,
    capacity_per_day: formData.capacity_per_day,
    business_hours: formData.business_hours,
    cut_off_time: formData.cut_off_time,
    wash_dry_fold: formData.wash_dry_fold,
    dry_cleaning: formData.dry_cleaning,
    iron_only: formData.iron_only,
    service_categories: formData.service_categories,
    delivery_fee_type: formData.delivery_fee_type,
    delivery_fixed_price: formData.delivery_fixed_price,
    standard_duration_hours: formData.standard_duration_hours,
    ...overrides,
  };

  try {
    const res = await fetch(API.SHOPS_REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (json.success) {
      return { success: true, registrationId: json.registrationId };
    }
    return { success: false, message: json.message || `HTTP ${res.status}` };
  } catch (e) {
    const err = e as Error;
    const msg = err.message || 'Network error';
    const hint = msg.includes('Network') || msg.includes('failed')
      ? ' (ตรวจสอบ: backend รันอยู่หรือยัง? ngrok URL ถูกต้องหรือไม่?)'
      : '';
    return { success: false, message: msg + hint };
  }
}
