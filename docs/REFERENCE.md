# Reference

Quick lookup for env vars, endpoints, and file roles. Not a substitute for the actual code or API docs.

---

## Environment variables

### Backend
| Variable | Purpose |
| -------- | ------- |
| PORT | Server port (default 3000) |
| MONGODB_URI | MongoDB connection string |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret |
| NGROK_URL | Ngrok URL in dev (OAuth callback, CORS) |
| JWT_SECRET | JWT signing secret (optional in dev) |
| OTP_SECRET | OTP hashing secret (optional in dev) |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS | Email (e.g. OTP) |
| MAIL_FROM | From address for emails |
| NODE_ENV | development \| production |

### User app
| Variable | Purpose |
| -------- | ------- |
| EXPO_PUBLIC_LONGDO_MAP_API_KEY | Longdo Map API key |
| EXPO_PUBLIC_SUPABASE_URL | Supabase project URL |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |

### Rider app
| Variable | Purpose |
| -------- | ------- |
| EXPO_PUBLIC_BASE_URL | Backend base URL (e.g. ngrok) |
| EXPO_PUBLIC_SUPABASE_* | Supabase if used |

---

## Auth & profile endpoints (backend)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | /api/auth/user/:userId | Get user by ID (includes profilePhoto) |
| PUT | /api/auth/update-profile/:userId | Update displayName and/or phone (phone: 10 digits, start with 0) |
| PUT | /api/auth/update-photo/:userId | Save profile photo URL (body: { profilePhoto }) |
| POST | /api/auth/request-otp | Request OTP (email) |
| POST | /api/auth/verify-otp | Verify OTP |
| POST | /api/auth/signup | Signup after OTP |
| POST | /api/auth/check-user | Check user by email (Google) |
| POST | /api/auth/register-google-user | Register Google user |
| GET | /api/auth/dev-user | Dev: get test user |

---

## Other API areas (see backend/src/routes and backend/docs/API.md)

- Orders: /api/orders, /api/orders/pending, active, history, etc.
- Shops: /api/shops
- Redeem: /api/redeem, /api/redeem/balance
- Chat: /api/chat
- Riders: /api/riders
- Google: /api/google/login, register, callback

---

## User app – main files

| Path | Role |
| ---- | ---- |
| app/(tabs)/index.tsx | Home tab: balance, actions, profile avatar |
| app/(tabs)/account.tsx | Account: profile photo, edit name/phone, logout, delete |
| app/create-account.tsx | Auth entry / Google sign-in |
| app/signup/* | Email OTP signup flow |
| app/shop/* | Shop detail, order, status, chat, rate |
| app/location/* | Map and search for address |
| app/wallet/* | Wallet and transfer |
| context/AuthContext.tsx | User, token, login, logout, updateUser |
| context/LocationContext.tsx | Address, lat/lon, load/save from API |
| lib/uploadProfilePhoto.ts | Upload image to Supabase, return URL |
| lib/supabaseClient.ts | Supabase client |
| config.ts | BASE_URL, API paths |
| services/api.ts | getShops, filters |
| services/apiClient.ts | authGet, fetch helpers |

---

## Backend – main files

| Path | Role |
| ---- | ---- |
| server.ts | Express app, CORS, rate limit, routes, static uploads |
| routes/auth.ts | Auth + profile (user, update-profile, update-photo) |
| routes/googleAuth.ts | Google OAuth |
| routes/orderRoutes.ts | Orders |
| routes/shops.ts | Shops |
| routes/redeem.ts | Redeem |
| routes/chat.ts | Chat |
| routes/riders.ts | Riders |
| models/User.ts | User schema (profilePhoto, phone, displayName, etc.) |
| models/Order.ts | Order schema |
| controllers/authController.ts | OTP, signup, check user, register Google |
| config/database.ts | MongoDB connect |

---

## Rider app – main areas

| Path | Role |
| ---- | ---- |
| app/(tabs)/* | Tabs: index, active, earning, wallet, account |
| app/signup/* | Onboarding: vehicle, documents, license, ID, selfie |
| app/job.tsx | Job detail |
| app/settings.tsx | Settings |
| context/AuthContext.tsx | Rider auth |
| context/SignupContext.tsx | Signup state |
| config.ts | BASE_URL, API paths |

---

This file is for quick lookup only. Always check the source and backend/docs/API.md for current behaviour.
