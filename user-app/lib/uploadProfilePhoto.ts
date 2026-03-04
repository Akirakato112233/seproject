import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

/**
 * Uploads a profile photo to Supabase Storage (documents bucket) and returns the public URL.
 * The caller should then persist this URL via the backend PUT /api/auth/update-photo/:userId.
 *
 * @param userId - User ID used in the stored filename (e.g. MongoDB _id).
 * @param uri - Local file URI from ImagePicker (e.g. file://...).
 * @returns The public URL of the uploaded image.
 * @throws If read, upload, or getPublicUrl fails.
 */
export async function uploadProfilePhoto(userId: string, uri: string): Promise<string> {
    console.log('📸 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('📸 Supabase Key loaded:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
    });

    const fileData = decode(base64);

    const fileName = `${userId}-profile-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage.from('documents').upload(fileName, fileData, {
        contentType: 'image/jpeg',
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
