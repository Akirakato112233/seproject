# User app – lib

Shared utilities and clients used by the app.

- **supabaseClient** – Supabase client for Storage (e.g. profile photo uploads).
- **uploadProfilePhoto** – Reads image from URI, uploads to Supabase `documents` bucket, returns public URL. Used by Account screen before saving URL via backend.
