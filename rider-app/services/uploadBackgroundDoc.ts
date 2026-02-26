import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

type UploadOptions = {
  name?: string;
  mimeType?: string;
};

export async function uploadDocument(
  riderId: string,
  uri: string,
  options: UploadOptions = {},
): Promise<string> {
  // อ่านไฟล์จาก uri เป็น Base64 string (ใช้ 'base64' แทน EncodingType เพื่อหลีกเลี่ยง undefined ในบาง environment)
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });

  // แปลง Base64 → ArrayBuffer สำหรับ Supabase
  const fileData = decode(base64);

  const mimeType = options.mimeType ?? 'application/octet-stream';

  // สร้างชื่อไฟล์แบบ unique
  const ext =
    mimeType === 'application/pdf'
      ? 'pdf'
      : mimeType.startsWith('image/')
        ? 'jpg'
        : 'bin';

  const fileName = `${riderId}-background-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, fileData, {
      contentType: mimeType,
      upsert: false,
    });

  if (error || !data) {
    throw error ?? new Error('Upload to Supabase failed');
  }

  const { data: publicData, error: urlError } = supabase.storage
    .from('documents')
    .getPublicUrl(data.path);

  if (urlError || !publicData?.publicUrl) {
    throw urlError ?? new Error('Cannot get public URL from Supabase');
  }

  return publicData.publicUrl;
}

/** อัปโหลดรูปจาก local URI ขึ้น Supabase (ใช้กับ rider registration: บัตร, ใบขับขี่, เซลฟี่) */
export async function uploadFileFromUri(
  uri: string,
  options: { mimeType?: string; prefix?: string } = {},
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const fileData = decode(base64);
  const mimeType = options.mimeType ?? 'image/jpeg';
  const prefix = options.prefix ?? 'reg';
  const ext = mimeType.startsWith('image/') ? (mimeType.includes('png') ? 'png' : 'jpg') : 'bin';
  const fileName = `rider-registration/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage.from('documents').upload(fileName, fileData, {
    contentType: mimeType,
    upsert: false,
  });

  if (error || !data) throw error ?? new Error('Upload to Supabase failed');

  const { data: publicData, error: urlError } = supabase.storage.from('documents').getPublicUrl(data.path);
  if (urlError || !publicData?.publicUrl) throw urlError ?? new Error('Cannot get public URL');

  return publicData.publicUrl;
}

