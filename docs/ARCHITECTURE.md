# Architecture overview

This document gives a high-level view of how the main apps and the backend fit together. It does not replace the README in each package.

---

## Apps

| App          | Stack           | Purpose                                      |
| ------------ | --------------- | -------------------------------------------- |
| user-app     | Expo, React Native | Customers: discover shops, orders, wallet, account (profile photo, name, phone) |
| rider-app    | Expo, React Native | Riders: jobs, earnings, documents, settings  |
| merchant-app | Expo, React Native | Merchants (if in use)                        |
| backend      | Node, Express, MongoDB | REST API for auth, orders, shops, redeem, chat, riders, profile |

---

## Auth and profile

- **User app**: Login via Google OAuth or email OTP. User document in MongoDB holds `displayName`, `phone`, `profilePhoto` (URL), `email`, etc.
- **Profile updates**: Name and phone are editable in the Account screen; data is sent to `PUT /api/auth/update-profile/:userId`. Phone must be 10 digits starting with `0`.
- **Profile photo**: Image is uploaded from the app to Supabase Storage. The returned public URL is sent to `PUT /api/auth/update-photo/:userId` and stored in `user.profilePhoto`. The same URL is shown on the Home screen avatar and Account screen.

---

## Backend

- **Auth routes** (`/api/auth/*`): OTP signup, Google check/register, get user by ID, update profile (name/phone), update profile photo URL.
- **Google OAuth**: Callback URL must be reachable (e.g. via ngrok in dev). `NGROK_URL` and `GOOGLE_CLIENT_SECRET` are set in backend `.env`.
- **Other routes**: Orders, shops, redeem, chat, riders – see `backend/docs/API.md` and the route files under `backend/src/routes/`.

---

## External services

- **MongoDB**: Main database for users, orders, shops, etc.
- **Supabase**: Used for profile photo storage (documents bucket) in the user-app. URL is stored in MongoDB.
- **Longdo Map**: Used in user-app for map and location (API key in user-app `.env`).
- **ngrok**: Used in development to expose the backend so mobile devices and OAuth callbacks can reach it.

---

## Configuration

- Each app has its own config (e.g. `config.ts`) for the API base URL. In dev this is often an ngrok URL.
- Environment variables: see `.env.example` in each app and in the backend. Never commit real `.env` files.
