import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

/**
 * อัปโหลดรูปจาก local URI ขึ้น Supabase Storage แล้วคืน URL
 * ใช้กับ merchant registration: บัตรประชาชน, สมุดบัญชี, รูปร้าน ฯลฯ
 */
export async function uploadImageToUrl(
  uri: string,
  options: { mimeType?: string; prefix?: string } = {}
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured (EXPO_PUBLIC_SUPABASE_URL/KEY missing)');
    return null;
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    const fileData = decode(base64);
    const mimeType = options.mimeType ?? 'image/jpeg';
    const prefix = options.prefix ?? 'merchant-reg';
    const ext = mimeType.startsWith('image/')
      ? mimeType.includes('png')
        ? 'png'
        : 'jpg'
      : 'bin';
    const fileName = `merchant-registration/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, fileData, {
        contentType: mimeType,
        upsert: false,
      });

    if (error || !data) {
      console.error('Supabase upload error:', error);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicData?.publicUrl ?? null;
  } catch (e) {
    console.error('uploadImageToUrl error:', e);
    return null;
  }
}
