# Backend controllers

Request handlers for API routes. They use models and return JSON.

- **authController** – requestOtp, verifyOtp, signup, checkUserByEmail, registerGoogleUser. Profile updates (name, phone, photo URL) are in routes/auth.ts.
- **orderController** – Order CRUD, status updates, pending/active/history.
- **shopController** – Shop list and detail.
- **redeemController** – Redeem and balance.
- **chatController** – Chat messages.
- **riderController** – Rider registration and related.
- **shopRegistrationController**, **shopMapping** – Merchant/shop registration if used.
