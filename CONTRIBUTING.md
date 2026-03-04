# Contributing to the project

Thanks for your interest in contributing. This document covers how to set up the repo, run the apps, and keep the codebase consistent.

---

## Repository structure

- **user-app** – Expo (React Native) app for end users: browse shops, place orders, wallet, account (profile photo, edit name/phone).
- **rider-app** – Expo app for riders: jobs, earnings, documents, emergency contacts.
- **merchant-app** – Merchant-facing app (if used).
- **backend** – Node.js + Express + MongoDB API: auth, orders, shops, redeem, chat, riders, Google OAuth, profile (name, phone, profile photo URL).

---

## Getting started

### Backend

1. `cd backend`
2. `cp .env.example .env` and fill in `MONGODB_URI`, `GOOGLE_CLIENT_SECRET`, etc. (see backend docs).
3. `npm install` then `npm run dev`.

For local testing from mobile devices, expose the backend with ngrok and set `NGROK_URL` in `.env`. Update the base URL in each app's config to the ngrok URL.

### User app

1. `cd user-app`
2. `cp .env.example .env` and set `EXPO_PUBLIC_LONGDO_MAP_API_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. `npm install` then `npx expo start`.

### Rider app

1. `cd rider-app`
2. Copy `.env.example` to `.env` if present and set any required keys (e.g. API base URL, Supabase if used).
3. `npm install` then `npx expo start`.

---

## Code style and formatting

- The project uses **Prettier** in user-app, rider-app, and backend. Configs are in `.prettierrc.json`; ignore lists in `.prettierignore`.
- Before committing, run `npm run format` in the project you changed. Formatting does not change behaviour; it only affects whitespace, quotes, and line breaks.
- See `docs/FORMATTING.md` for details.

---

## API and profile behaviour

- User profile: name and mobile number are editable from the user-app Account screen. Phone must be exactly 10 digits and start with `0`. Profile photo is uploaded to Supabase Storage; the public URL is saved via `PUT /api/auth/update-photo/:userId`.
- Backend auth routes: see `backend/docs/API.md` for auth and user profile endpoints.

---

## What not to commit

- `.env` files (use `.env.example` as a template).
- `node_modules/`, build outputs, lock files are ignored by Prettier and usually by Git.
- Secrets and API keys belong in environment variables, not in code.

---

## Questions

If something is unclear, check the README in each app and `backend/README.md`, or the docs in `docs/` and `backend/docs/`.
