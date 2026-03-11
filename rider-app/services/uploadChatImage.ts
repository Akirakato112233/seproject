import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

/**
 * อัปโหลดรูปแชท (จากกล้องหรือเลือกจากไลบรารี) ขึ้น Supabase Storage (documents bucket)
 * และ return public URL สำหรับเก็บใน ChatMessage.imageUrl
 */
export async function uploadChatImage(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const fileData = decode(base64);

    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? (match[1].toLowerCase() === 'png' ? 'png' : 'jpg') : 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storagePath = `chat/chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage.from('documents').upload(storagePath, fileData, {
        contentType: mimeType,
        upsert: false,
    });

    if (error || !data) throw error ?? new Error('Upload to Supabase failed');

    const { data: publicData, error: urlError } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

    if (urlError || !publicData?.publicUrl) throw urlError ?? new Error('Cannot get public URL from Supabase');

    return publicData.publicUrl;
}
