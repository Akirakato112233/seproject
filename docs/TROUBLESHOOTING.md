# Troubleshooting

Common issues and fixes. No logic changes—this is documentation only.

---

## Backend

- **Cannot connect to MongoDB**  
  Check MONGODB_URI in .env. Ensure MongoDB is running (local or Atlas). See backend/MONGODB_SETUP.md if present.

- **Google login fails or redirects to wrong URL**  
  Set NGROK_URL in backend .env to your current ngrok URL. Ensure the Google OAuth redirect URI in Google Cloud Console matches your callback URL (e.g. https://your-ngrok.ngrok-free.dev/api/google/callback). Restart backend after changing .env.

- **Too many requests (rate limit)**  
  In development the limiter is relaxed (see server.ts). If you hit it, wait a few minutes or increase max in apiLimiter/authLimiter for local dev.

- **Profile photo / update-profile returns 400 or 404**  
  For update-photo: body must be { profilePhoto: string } (full URL). For update-profile: phone must be exactly 10 digits and start with 0. userId must be a valid MongoDB ObjectId.

---

## User app

- **Profile photo upload fails (e.g. RLS or network)**  
  Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env. Restart Expo with cache clear: npx expo start -c. Check Supabase Storage bucket name (documents) and RLS policies allow upload.

- **Name or phone save fails**  
  Check backend is reachable (BASE_URL in config.ts, ngrok if needed). Phone must be 10 digits starting with 0. Check network tab for 400/404/500 and response message.

- **Home screen does not show profile photo**  
  Home fetches user from GET /api/auth/user/:userId on focus. Ensure backend returns profilePhoto and the URL is valid (e.g. Supabase public URL). Try pulling to refresh or navigating away and back.

- **Map or location not loading**  
  Check EXPO_PUBLIC_LONGDO_MAP_API_KEY. LocationContext uses BASE_URL for API; ensure backend is up and BASE_URL is correct (ngrok URL in dev).

- **.env changes not applied**  
  Restart Expo (npx expo start -c). Hot reload does not pick up .env changes.

---

## Rider app

- **Backend requests timeout or fail**  
  Ensure config.ts (or .env) BASE_URL points to your backend (ngrok in dev). Add ngrok-skip-browser-warning: 1 header if you see ngrok interstitial.

- **Google or signup flow fails**  
  Same as backend: check NGROK_URL and Google OAuth redirect URIs. Ensure rider backend routes are mounted and env vars set.

---

## General

- **ngrok URL changed**  
  Update BASE_URL (or EXPO_PUBLIC_BASE_URL) in each app and NGROK_URL in backend .env. Restart backend and restart Expo with -c if needed.

- **Formatting / Prettier**  
  Run npm run format in the project you changed. See docs/FORMATTING.md. If something broke after format, it should only be style (quotes, spaces); if logic broke, the issue is elsewhere.

- **Where to find API details**  
  backend/docs/API.md and docs/REFERENCE.md. For exact request/response shapes see backend src/routes and controllers.
