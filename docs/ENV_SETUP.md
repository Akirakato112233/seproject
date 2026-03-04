# Environment variables setup

This file describes where environment variables are used and how to set them up safely. Always use `.env.example` as a template and never commit `.env`.

---

## Backend (Node/Express)

- **PORT** – Server port (default 3000).
- **MONGODB_URI** – MongoDB connection string (required for DB).
- **GOOGLE_CLIENT_SECRET** – For Google OAuth (required if using Google login).
- **NGROK_URL** – Full ngrok URL in development (e.g. `https://xxxx.ngrok-free.dev`) for OAuth callback and CORS.
- **JWT_SECRET** – Secret for JWT signing (optional in dev; set in production).
- **OTP_SECRET** – Secret for OTP generation (optional in dev).
- **SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM** – For sending email OTP (if using email signup).

Copy `backend/.env.example` to `backend/.env` and fill in the values for your environment.

---

## User app (Expo)

- **EXPO_PUBLIC_LONGDO_MAP_API_KEY** – Longdo Map API key for map and location features.
- **EXPO_PUBLIC_SUPABASE_URL** – Supabase project URL (for profile photo storage).
- **EXPO_PUBLIC_SUPABASE_ANON_KEY** – Supabase anon/public key.

Copy `user-app/.env.example` to `user-app/.env`. Restart Expo after changing `.env` (e.g. `npx expo start -c`).

---

## Rider app (Expo)

If the rider app uses a config file or env for the API base URL or Supabase, create a `.env.example` with placeholder keys and document them here. Do not commit real keys.

---

## Security notes

- Never commit `.env` or any file containing real API keys or secrets.
- Use different values for development and production.
- In production, use a proper secrets manager or platform env vars instead of a plain `.env` file when possible.
