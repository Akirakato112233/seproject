# Project summary

A short reference for what each part of the repo does. For setup and API details, see CONTRIBUTING.md, docs/ARCHITECTURE.md, docs/ENV_SETUP.md, and backend/docs/API.md.

---

## Apps

- **user-app** – Customer-facing Expo app. Features: discover shops, place orders, wallet, activity, account. Account screen: profile photo (camera/gallery → Supabase, URL saved to backend), editable name and mobile number (10 digits, must start with 0), email read-only. Home screen shows profile avatar and balance.
- **rider-app** – Rider-facing Expo app. Features: jobs, earnings, wallet, documents (e.g. license, ID), emergency contacts, settings, signup/onboarding.
- **merchant-app** – Merchant app if used.
- **backend** – Node + Express + MongoDB. Serves REST API: auth (OTP, Google), user profile (get user, update name/phone, update profile photo URL), orders, shops, redeem, chat, riders. Uses ngrok in dev for callbacks and mobile access.

---

## Key flows

- **User signup / login** – Email OTP or Google OAuth. Backend stores user in MongoDB; profile fields include displayName, phone, profilePhoto (URL).
- **Profile edit** – User app Account screen: name and phone edited in a modal; sent to PUT /api/auth/update-profile/:userId; phone validated (10 digits, starts with 0). AuthContext updated after success.
- **Profile photo** – User app: image picked → uploaded to Supabase Storage (documents bucket) → public URL sent to PUT /api/auth/update-photo/:userId → stored in user.profilePhoto. Home and Account screens show this URL.
- **Location** – User app LocationContext loads/saves address and lat/lon via backend; map and search screens update it.

---

## Config and env

- Backend: .env from .env.example (PORT, MONGODB_URI, GOOGLE_CLIENT_SECRET, NGROK_URL, optional SMTP, JWT_SECRET, OTP_SECRET).
- User app: .env from .env.example (Longdo Map key, Supabase URL and anon key). Restart Expo after changing .env.
- Rider app: .env.example documents base URL and Supabase if used.
- All apps: config file (e.g. config.ts) sets BASE_URL; in dev this is usually the ngrok URL.

---

## Code quality

- Prettier is used in user-app, rider-app, and backend. Run `npm run format` before committing. See docs/FORMATTING.md.
- No logic was changed when adding docs or comments; only documentation and formatting were added for safety.
