# OpenChat (monorepo)

OpenChat is a pnpm monorepo that contains:

- `apps/frontend` — Next.js + React client
- `apps/backend` — Express + Socket.io API (with Prisma)
- `packages/lib` — shared utilities and schemas
- `packages/components` — shared UI components

## Requirements

- Node.js `>= 20.19` (Node 20 recommended)
- pnpm `>= 10`

## Quick start

```bash
nvm install 20
nvm use 20
pnpm install
pnpm dev
```

- Frontend runs on `http://localhost:3000`.
- Backend runs on `http://localhost:4000` by default.

## Useful scripts (from repo root)

```bash
pnpm dev            # frontend + backend
pnpm dev:all        # run dev scripts for all workspace packages
pnpm build          # build all packages/apps
pnpm lint           # run lint across workspace
pnpm test           # run tests where present
pnpm clean          # remove generated JS in package src folders (if configured)
```

## Environment variables

### Frontend (`apps/frontend/.env`)

- `NEXT_SOCKET_URL` (default: `http://localhost:4000`)
- `NEXT_PUBLIC_API_URL` (used by shared avatar/url helpers)

### Backend (`apps/backend/.env`)

- `PORT` or `SOCKET_PORT` (default: `4000`)
- Any variables required by Prisma/database and auth providers

## Prisma (backend)

```bash
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate
```

## Workspace development notes

- Prefer importing shared code via package names:

```ts
import { cn } from '@openchat/lib'
import { Button } from '@openchat/components'
```

- When changing shared packages, rebuild them (or run full workspace build):

```bash
pnpm --filter @openchat/lib build
pnpm --filter @openchat/components build
# or
pnpm build
```

## CI

GitHub Actions workflow is included at `.github/workflows/ci.yml` and runs install, lint, build, and tests on pushes/PRs.

## License

MIT License © 2025 OpenChat
