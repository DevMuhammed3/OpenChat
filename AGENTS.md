# AGENTS.md

## Monorepo layout

- `apps/frontend` — Next.js 16 (App Router, Turbopack), React 19, Zustand, Tailwind CSS
- `apps/backend` — Express 5, Socket.io 4, Prisma ORM, PostgreSQL, ESM
- `packages/components` — shared shadcn/ui component library (`@openchat/components`)
- `packages/lib` — shared utilities, types re-exported (`@openchat/lib`)
- `packages/types` — TypeScript type definitions (`@openchat/types`)
- `desktop` — Electron wrapper (built on top of frontend)

## Required versions

- Node >= 20 (`.nvmrc` pins `20`)
- pnpm 10.20.0 (`packageManager` field in root `package.json`)

## Dev commands

```bash
pnpm dev              # runs frontend (:3000) + backend (:4000) concurrently
pnpm dev:frontend     # frontend only
pnpm dev:backend      # backend only (tsx watch)
pnpm build            # builds all packages and apps
pnpm lint             # runs lint across all packages
```

## Database

```bash
# from apps/backend/
pnpm prisma migrate dev    # run migrations
pnpm prisma generate       # regenerate Prisma client (also runs on postinstall)
pnpm prisma format         # format schema
```

## Adding shadcn/ui components

```bash
pnpm shadcn <component-name>
# installs into packages/components via the workspace shadcn script
```

## Environment variables

Backend (`apps/backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `PORT`, `BASE_URL`, `OPENCHAT_ALLOWED_ORIGINS`, `COOKIE_DOMAIN`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

Frontend (`apps/frontend/.env.local`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Code style

- **Prettier**: 4-space indent, no semicolons, single quotes, ES5 trailing commas (root `.prettierrc`)
- **ESLint**: flat config, TypeScript + React Hooks + React Refresh (root `eslint.config.js`)
- Frontend lint: `eslint .` from `apps/frontend`

## Build gotchas

- `packages/lib` has a `prebuild` script that deletes `.js` files from `src/` — this is intentional (source is `.ts`, dist is compiled separately)
- `.npmrc` hoists `@prisma/client`, `jsonwebtoken`, and `bcryptjs` to root — don't add them to nested `node_modules`
- Frontend build uses `next build --webpack` (not Turbopack for production builds)
- Backend `postinstall` auto-runs `prisma generate`

## CI

Only one workflow: `.github/workflows/desktop-build.yml` — builds the Electron desktop app on push to `main` or `feature/electron-app`. No CI for frontend/backend tests or lint yet.

## Key architecture notes

- Backend uses in-memory Maps for call state (`activeCalls`, `userToCall`, `userConnections`) — single-server only
- WebRTC signaling goes through Socket.io, not STUN/TURN
- Call reconnection: 10-second grace period on disconnect before call termination
- Presence: heartbeat-based, 15s cleanup interval, 45s stale threshold
- Auth: JWT in HTTP-only cookies; Socket.io auth via `socketAuth` middleware

## Relevant skills

### Project-specific (in `.agent/skills/`)

- `prisma-schema-migrations` — add/modify DB models, run migrations safely
- `socketio-event-pattern` — add new real-time Socket.io events
- `livekit-integration` — voice call features via LiveKit
- `api-endpoint-pattern` — add REST endpoints (controller → route → validation)
- `frontend-feature-pattern` — add frontend features (queries, mutations, stores)

### General (already installed in `.agent/skills/`)

- `react-best-practices` — React/Next.js performance optimization (Vercel)
- `systematic-debugging` — root cause analysis before fixes
- `webapp-testing` — Playwright-based webapp testing
- `frontend-design` — UI/UX design patterns
