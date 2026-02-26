import { createClient } from '@supabase/supabase-js';

// อ่านค่า Supabase จาก env (Expo: EXPO_PUBLIC_*)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

