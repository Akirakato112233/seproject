# API Reference

This document describes the main API endpoints used by the apps. Base URL is your backend (e.g. ngrok or production).

---

## Auth & user profile

### Get user by ID

- **Method:** `GET`
- **Path:** `/api/auth/user/:userId`
- **Description:** Returns the user document including `profilePhoto`, `displayName`, `phone`, `email`, `address`, `balance`, `isOnboarded`, location fields, etc.
- **Response:** `{ success: true, user: { _id, displayName, email, phone, profilePhoto, ... } }`

### Update profile (name, phone)

- **Method:** `PUT`
- **Path:** `/api/auth/update-profile/:userId`
- **Body:** `{ displayName?: string, phone?: string }`
- **Rules:**
  - `phone` must be exactly 10 digits and start with `0` (e.g. `0812345678`). Non-digits are stripped; validation returns 400 if invalid.
  - `displayName` is trimmed.
- **Response:** `{ success: true, user: { _id, displayName, phone, email } }`
- **Errors:** 400 if nothing to update or invalid phone; 404 if user not found.

### Update profile photo URL

- **Method:** `PUT`
- **Path:** `/api/auth/update-photo/:userId`
- **Body:** `{ profilePhoto: string }` — must be a full URL (e.g. Supabase Storage public URL).
- **Description:** Stores the URL in the user's `profilePhoto` field. The image file itself is uploaded from the client to Supabase; this endpoint only saves the URL.
- **Response:** `{ success: true, profilePhoto: string }`
- **Errors:** 400 if `profilePhoto` missing or not a string; 404 if user not found.

---

## Google Auth (see googleAuth routes)

- Login and register flows use `/api/google/login` and `/api/google/register` (or equivalent). See backend routes for details.

---

## Orders

- **Base path:** `/api/orders`
- **Relevant files:** `src/routes/orderRoutes.ts`, `src/controllers/orderController.ts`
- **Typical operations:** Create order, get order by ID, list active/history, update status, start coin wash/dry (if applicable).
- **Request/response shapes:** See the route and controller files for exact body and query parameters.

---

## Shops

- **Base path:** `/api/shops`
- **Relevant files:** `src/routes/shops.ts`, `src/controllers/shopController.ts`
- **Typical operations:** List shops, get shop by ID, filter by type or rating.
- **Query examples:** `GET /api/shops?type=coin&rating=4`

---

## Redeem / balance

- **Paths:** `/api/redeem`, `/api/redeem/balance`
- **Relevant files:** `src/routes/redeem.ts`, `src/controllers/redeemController.ts`
- **Typical operations:** Redeem action, get user balance. Used by the user app wallet flow.

---

## Chat

- **Base path:** `/api/chat`
- **Relevant files:** `src/routes/chat.ts`, `src/controllers/chatController.ts`
- **Typical operations:** Send message, get messages for an order or conversation. Used by user and rider apps.

---

## Riders

- **Base path:** `/api/riders`
- **Relevant files:** `src/routes/riders.ts`, `src/controllers/riderController.ts`
- **Typical operations:** Rider registration, status, availability, or job assignment depending on implementation. See route files for details.

---

## Summary

For exact request bodies, status codes, and error shapes, always refer to the source files under `src/routes/` and `src/controllers/`.
