# User app – app directory

This folder contains the main screens and navigation for the user (Expo) app. It uses file-based routing (Expo Router).

- **`(tabs)/`** – Tab navigation: Home (`index.tsx`), Discover, Activity, Account (`account.tsx`). Account handles profile photo, editable name and phone.
- **`create-account.tsx`**, **`sign-in.tsx`** – Auth entry and Google sign-in.
- **`signup/`** – Email OTP signup flow (email, OTP, name, phone, etc.).
- **`shop/`** – Shop detail, order flow, order status, chat, rate.
- **`location/`** – Map and search for location selection.
- **`wallet/`** – Wallet and transfer.
- **`_layout.tsx`**, **`index.tsx`** – Root layout and redirect.
