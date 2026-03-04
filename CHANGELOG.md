# Changelog

All notable changes to the project are documented here.

## [Unreleased]

### User app
- Account screen: profile photo upload (camera or gallery) with storage on Supabase and URL saved to backend.
- Account screen: profile photo displayed on Home screen avatar.
- Account screen: editable Name and Mobile Number with modal; data persisted via `PUT /api/auth/update-profile/:userId` and local auth state updated.
- Mobile number validation: exactly 10 digits, must start with `0`; input restricted to digits and auto-prepends `0` when needed.
- AuthContext: added `updateUser(partial)` to update user in state and AsyncStorage after profile edits.

### Backend
- New endpoint `PUT /api/auth/update-profile/:userId` for updating `displayName` and/or `phone` (phone: 10 digits, must start with 0).
- Profile photo endpoint `PUT /api/auth/update-photo/:userId` accepts Supabase public URL and stores in `user.profilePhoto`.
- User model: `profilePhoto` field for storing profile image URL.

### Code quality & tooling
- Prettier added to user-app, rider-app, and backend for consistent formatting.
- Format scripts: `npm run format` in each project; configs in `.prettierrc.json`, ignore in `.prettierignore`.
- user-app: `.env.example` added with placeholders for Longdo Map and Supabase.

### Documentation
- user-app README: section "Account & profile" describing profile photo, edit name/phone, and phone rules.
- backend README: API section for auth/user profile endpoints.
- backend: `docs/API.md` with detailed auth and user profile endpoint descriptions.
- Project root: `CONTRIBUTING.md` (repo structure, getting started, code style, API/profile behaviour, what not to commit).
- `docs/ARCHITECTURE.md`: apps overview, auth and profile flows, backend and external services, configuration.
- `docs/ENV_SETUP.md`: env vars for backend, user app, rider app; security notes.
- `docs/FORMATTING.md`: Prettier usage and when to format.
- `docs/PROJECT_SUMMARY.md`: short reference for apps, key flows, config, code quality.
- `docs/REFERENCE.md`: env table, auth/profile endpoints table, other API areas, main file roles for user app, backend, rider app.
- `docs/TROUBLESHOOTING.md`: common issues for backend, user app, rider app, general (MongoDB, Google, rate limit, profile photo, name/phone save, map, .env, ngrok, Prettier).
- Backend: expanded `.env.example` with PORT, MONGODB_URI, GOOGLE_CLIENT_SECRET, NGROK_URL, JWT_SECRET, OTP_SECRET, SMTP_*, MAIL_FROM, NODE_ENV and comments.
- Rider app: `.env.example` with EXPO_PUBLIC_BASE_URL and Supabase placeholders.
- READMEs added: user-app (app, components, context, lib, services, hooks), backend (src, routes, models, controllers), rider-app (app, context).
- JSDoc/file comments added: AuthContext, User model, api.ts, server.ts, Home tab, authController, LocationContext, uploadProfilePhoto, config, create-account, auth routes.
