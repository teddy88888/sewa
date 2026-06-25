# SEWA — Sewa Buku & Mainan Anak

Platform sewa peer-to-peer untuk buku dan mainan anak di Indonesia.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, port 8080, routes mounted at `/api`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React + Vite + Tailwind at `/`
- Mobile: Expo (React Native) at `/mobile/`

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec (edit this, then run codegen)
- `lib/db/src/schema/` — Drizzle DB schema (users, items, bookings, payments, favorites, wallet_transactions)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas (do NOT edit)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/sewa/src/` — React/Vite web app
- `artifacts/sewa-mobile/app/` — Expo mobile screens

## Architecture decisions

- Auth uses in-memory token Map (Map<token, userId>) + SHA256 hash with salt "sewa_salt_2024"
- All API routes mounted at `/api` prefix (the proxy routes `/api` → port 8080)
- Mobile app uses `@workspace/api-client-react` hooks via `setBaseUrl`/`setAuthTokenGetter`
- Auth token persisted on mobile via `@react-native-async-storage/async-storage`
- Mobile and web share the same design palette: teal primary (#1a9b87), orange secondary (#f56c20)

## Product

- **Browse & Search**: Filter items by category (buku/mainan), search by name, see featured/recommended
- **Item Detail**: View item info, owner profile, cost breakdown; choose rental duration (1/3/7/14/30 days)
- **Bookings**: Create and view rental bookings with status tracking
- **Wallet**: View deposit balance and transaction history
- **Auth**: Register/login with email & password; demo account: demo@sewa.id / demo123
- **Favorites**: Toggle favorite items (when authenticated)

## Demo Seed Data

4 demo users (demo@sewa.id, budi@sewa.id, siti@sewa.id, admin@sewa.id)
8 item listings (mix of buku and mainan)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- API server must be restarted after code changes (esbuild compiles to dist/)
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- Mobile EXPO_PUBLIC_DOMAIN env var is injected by the workflow (no hardcoding needed)
- The Expo workflow name is "artifacts/sewa-mobile: expo"

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
