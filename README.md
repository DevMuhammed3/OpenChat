# OpenChat (monorepo)

This repository contains a small monorepo with a frontend (Vite + React), a backend (Express + Socket.io), and shared packages (`@openchat/lib`, `@openchat/components`).

This README explains how to get the project running locally and developer recommendations.

Requirements

# Node.js: >= 20.19 (recommended 20.x). A `.nvmrc` file is included for convenience.
# OpenChat (monorepo)

This repository contains a monorepo for OpenChat:

- `apps/frontend` — Vite + React client
- `apps/backend` — Express + Socket.io server (with Prisma schema)
- `packages/lib` — shared utilities (helpers, socket client)
- `packages/components` — shared UI components

This README covers how to set up the project locally, common workflows for developing across the workspace, and troubleshooting tips.

## Requirements

- Node.js: >= 20.19 (20.x recommended). Use `nvm` to manage Node versions — a `.nvmrc` is included.
- pnpm: v7+ (workspace-aware). Install with `npm i -g pnpm` if needed.

## Quick setup

1. Use the recommended Node version:

```bash
nvm install
nvm use
node -v # should be >= 20.19 (20.x recommended)
```

2. Install dependencies (from repo root):

```bash
pnpm install
```

3. Run development servers:

```bash
pnpm run dev:all    # runs frontend + backend concurrently (defined in root package.json)
# or run individually
pnpm --filter frontend dev
pnpm --filter backend dev
```

Open the frontend URL printed by Vite (typically http://localhost:5173). The backend listens on port 3001 by default.

## Environment variables

- `VITE_SOCKET_URL` — frontend socket URL (default: `http://localhost:3001`). Use this in `.env` at the frontend root if needed.
- `PORT` or `SOCKET_PORT` — backend port (default: `3001`).

Create an `.env` file in `apps/frontend` or `apps/backend` for local overrides when needed.

## Building

To build all packages and apps in the workspace:

```bash
pnpm -w -r build
```

To build a single package/app (example frontend):

```bash
pnpm --filter frontend build
```

## Prisma (backend)

If you change the Prisma schema (`apps/backend/prisma/schema.prisma`) apply migrations locally with:

```bash
cd apps/backend
pnpm prisma migrate dev
```

Or generate clients only:

```bash
pnpm prisma generate
```

## Working with shared packages (developer workflow)

- Import shared code using the workspace package names, e.g.:

```ts
import { cn, socket } from '@openchat/lib'
import { Button } from '@openchat/components'
```

- During development, the Vite config and TypeScript path mappings resolve those imports to the local `src/` folders so you can edit packages in place.

- When editing a package (`packages/lib` or `packages/components`), run that package's build (or run the workspace build) so consuming apps get the latest `dist/` outputs when necessary:

```bash
pnpm --filter @openchat/lib build
pnpm -w -r build
```

## Clean generated sources

- Avoid committing generated JS inside `src/` of packages. Only `dist/` should contain build artifacts.
- The repo includes clean scripts in packages to remove stray `.js` in `src` before building. To run all clean scripts:

```bash
pnpm -w -r run clean
```

## Common tasks & useful commands

- Install dependencies: `pnpm install`
- Start frontend dev: `pnpm --filter frontend dev`
- Start backend dev: `pnpm --filter backend dev`
- Start both: `pnpm run dev:all`
- Build everything: `pnpm -w -r build`
- Run workspace tests (if any): `pnpm -w -r test`

## Troubleshooting

-- If Vite fails with Node crypto errors, you're likely on an unsupported Node version. Switch to Node 20.x (>=20.19):

```bash
nvm install 20
nvm use 20
```

- If shared imports resolve incorrectly, verify `tsconfig.json` `paths` and `apps/frontend/vite.config.*` aliases are present. They map `@openchat/*` to the packages' `src` folders.

- If Tailwind styles don't appear in a consuming app, check PostCSS configuration and ensure `@tailwind` and `@import` ordering is correct in the app's `index.css`.

## Publishing packages

- If you plan to publish packages, add an `exports` field to each package's `package.json` and produce both ESM and CJS outputs in the build. For internal development the TypeScript path mappings and Vite aliases are sufficient.

## How to add a new package/app

1. Create a new folder under `apps/` or `packages/`.
2. Add a `package.json` with the workspace name (e.g. `@openchat/yourpkg`).
3. Add TypeScript sources under `src/` and update root `pnpm -w -r build` if needed.
4. Add path mappings in the root `tsconfig.json` if you want to import it by package name during dev.

## CI

This repository does not include any CI/workflow configuration by default. If you want CI, I can add a GitHub Actions workflow that uses Node 20 and runs builds, linting, and tests.

## Need help?

If you'd like, I can:

- Remove remaining generated JS files under `src/` across the repo and add `prebuild` scripts to enforce a clean source tree.
- Add `exports` fields to all `package.json` files and produce ESM+CJS builds.
- Integrate Tailwind + shadcn into `apps/frontend` (or add it to other apps) and wire workspace imports for UI components.

Tell me which of the above you'd like next and I will implement it.
