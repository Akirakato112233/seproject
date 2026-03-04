# Backend source

- **server.ts** – Express app entry, CORS, routes, static files.
- **config/** – Database and default services config.
- **controllers/** – Request handlers (auth, order, shop, redeem, chat, rider, etc.).
- **models/** – Mongoose schemas (User, Order, Shop, Rider, etc.).
- **routes/** – Route definitions (auth, googleAuth, orderRoutes, shops, redeem, chat, riders).
- **middleware/** – Auth middleware if used.
- **services/** – Business logic helpers.
- **utils/** – Tokens, validation helpers.
- **scripts/** – Seed and one-off scripts.
