# Lokal MVP

Lokal (Локаль) is a demo accommodation marketplace and owner workspace built with Nuxt 4, Vue, Pinia and grammY. Documentation and code comments are written in English; existing Russian product documents and user-facing strings remain in Russian.

- Start with [context](docs/CONTEXT.md) and the [documentation hub](docs/README.md). Project instructions take precedence over global agent rules.
- Product and acceptance: [README](README.md), [product](docs/PRODUCT.md), [QA](docs/QA.md).
- Architecture and stack: [architecture](docs/ARCHITECTURE.md), [stack](docs/STACK.md).
- Demo data and availability rules: [seed](demo/seed.json), [typed domain](shared/domain/booking.ts).
- UI: [MestoApp](app/components/MestoApp.vue); client state: [demo store](app/stores/demo.js); bot: [bot entry](bot/index.mjs).
- Use Node 22. Run `npm install`, `npm run dev`, `npm test`, `npm run typecheck`, `npm run build`. Run `npm run bot` with `BOT_TOKEN` and `MINI_APP_URL` set.
- Demo state is browser-local, not authentication or a shared database. Never place real Telegram credentials into demo state.
