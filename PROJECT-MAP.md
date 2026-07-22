# PROJECT-MAP.md

## Monorepo structure

```
openchat/
├── apps/
│   ├── backend/           # Express 5 + Socket.io + Prisma
│   └── frontend/          # Next.js 16 + React 19 + Zustand
├── packages/
│   ├── components/        # @openchat/components — shared shadcn/ui
│   ├── lib/               # @openchat/lib — shared utilities
│   └── types/             # @openchat/types — TypeScript types
├── desktop/               # Electron wrapper
├── .agent/skills/         # AI agent skills (project + general)
└── .opencode/             # OpenCode config + plans
```

## Package dependency graph

```
@openchat/types          (no deps — pure types)
       ↑
@openchat/lib            (depends on: socket.io-client, clsx, tailwind-merge)
       ↑
@openchat/components     (depends on: @openchat/lib)
       ↑
frontend                 (depends on: @openchat/components, @openchat/lib, @openchat/types)
desktop                  (wraps frontend, no direct package deps)

backend                  (standalone — uses @prisma/client, express, socket.io, livekit)
```

## apps/backend/ — Entry points

```
src/
  index.ts          ← SERVER ENTRY — creates HTTP server, Socket.io, registers handlers
  app.ts            ← Express app — CORS, routes, static files, error handler
  config/
    env.ts          ← env loading
    prisma.ts       ← Prisma client singleton
    origin.ts       ← CORS origin validation
  controllers/      ← REST handlers (static methods)
  routes/           ← Express Router definitions
  validations/      ← Zod input schemas
  middlewares/       ← auth.middleware.ts, requireVerified.ts, upload.middleware.ts
  services/         ← Business logic (auth, user, friendRealtime)
  socket/           ← Socket.io handlers
    auth.ts         ← JWT validation from cookie
    presence.ts     ← Heartbeat-based online tracking
    callHandler.ts  ← 1:1 call state machine (in-memory Maps)
    channelCallHandler.ts ← Group channel calls
    privateChat.ts  ← DM messages, typing, read receipts
  utils/            ← JWT, crypto, email, OTP, cookie, zod error formatting
  prisma/
    schema.prisma   ← DATABASE SCHEMA (single source of truth)
    migrations/     ← 5 existing migrations
```

### Backend data flow

```
Client HTTP request
  → Express middleware (auth.middleware.ts validates JWT)
  → Route (routes/*.routes.ts)
  → Controller (controllers/*.controller.ts)
  → Prisma query (config/prisma.ts)
  → Response

Client Socket.io event
  → socketAuth middleware (socket/auth.ts)
  → Handler (socket/*.ts)
  → In-memory Map update OR Prisma query
  → Broadcast via io.to(room).emit()
```

## apps/frontend/ — Entry points

```
src/
  middleware.ts           ← Route guard — protects /zone/*, /settings/*, /dashboard/*
  app/
    layout.tsx            ← ROOT LAYOUT — fetches user server-side, wraps in providers
    providers/
      ClientProviders.tsx ← CLIENT ROOT — all providers wrapped here
      realtime-provider.tsx ← Socket.io connection + event handlers
      global-call-provider.tsx ← LiveKit call context
      user-provider.tsx   ← User context
      theme-provider.tsx  ← Dark/light theme
    stores/               ← Zustand stores (persisted state)
      call-store.ts       ← Call state (idle/calling/incoming/connecting/connected)
      chat-store.ts       ← Chat list, active chat, unread counts
      friends-store.ts    ← Friends, blocked users, online status
      user-store.ts       ← Current user profile
  features/               ← Feature modules (queries + mutations + types)
    chat/                 ← Messages, chat CRUD
    channels/             ← Channel management
    user/                 ← User profile
    zones/                ← Zone (server) management
    prefetch/             ← Intersection Observer prefetch
  hooks/                  ← Custom React hooks
    useVoiceCall.ts       ← LiveKit 1:1 calls
    useChannelVoiceCall.ts ← LiveKit channel calls
    useKeyboardShortcuts.ts
    useAudioUnlock.ts
  lib/
    api/client.ts         ← API client (apiClient.get/post/patch/delete)
    query/client.ts       ← TanStack Query client
  components/             ← Shared UI components (Avatar, ChatHeader, etc.)
  app/zone/               ← MAIN APP AREA (Discord-like layout)
    _components/          ← Zone-specific components
    chat/                 ← DM chat pages
    friends/              ← Friends list/requests
    zones/                ← Zone pages with channels
    explore/              ← Discover zones
    invite/               ← Invite code handling
```

### Frontend data flow

```
Server Component (layout.tsx)
  → getCurrentUser() fetches /auth/me with cookies
  → Renders ClientProviders wrapping children

Client Components
  → TanStack Query hooks (features/*/queries.ts) fetch data
  → apiClient makes HTTP requests with credentials:include
  → Socket.io (from @openchat/lib) handles real-time events
  → Zustand stores manage client state (calls, chat list, friends)
  → React Query cache invalidated on Socket.io events
```

## packages/components/ — Shared UI

```
src/
  index.ts          ← Barrel exports (named exports per component)
  utils.ts          ← cn() utility (clsx + tailwind-merge)
  ui/               ← 21 shadcn/ui components (Radix-based)
    button.tsx, input.tsx, dialog.tsx, dropdown-menu.tsx, etc.
    Navbar.tsx      ← Landing page navbar (uses framer-motion — keep out of barrel)
```

## packages/lib/ — Shared utilities

```
src/
  index.ts          ← Barrel (cn, socket, api, sounds, audio/*)
  api.ts            ← fetch() wrapper with credentials:include
  config.ts         ← getApiBaseUrl() — env vars or default
  socket.ts         ← Socket.io client singleton (autoConnect:false)
  utils.ts          ← cn() (clsx + tailwind-merge)
  sounds.ts         ← Message notification sound
  getAvatarUrl.ts   ← Avatar URL resolver
  validations/      ← Shared Zod schemas
  webrtc/           ← WebRTC helpers (peer, signaling, constraints)
  audio/            ← Audio playback controls
```

## desktop/ — Electron

```
main.ts             ← Main process — creates BrowserWindow, loads https://0zone.site/auth
preload.ts          ← Context bridge (exposes openchatConfig, electron IPC)
electron-builder.json ← Build targets: macOS (dmg), Windows (nsis), Linux (AppImage+deb)
renderer/           ← Embedded frontend for offline fallback
scripts/dist.mjs    ← Distribution build script
```

## Key cross-references

| What | Where |
|------|-------|
| Backend entry | `apps/backend/src/index.ts:25` (HTTP server) + `:27` (Socket.io) |
| Express app | `apps/backend/src/app.ts:1` |
| Prisma schema | `apps/backend/prisma/schema.prisma` |
| Frontend root layout | `apps/frontend/src/app/layout.tsx` |
| Client providers | `apps/frontend/src/app/providers/ClientProviders.tsx` |
| Socket.io client | `packages/lib/src/socket.ts` |
| API client | `apps/frontend/src/lib/api/client.ts` |
| Call state machine | `apps/backend/src/socket/callHandler.ts:33` |
| Presence cleanup | `apps/backend/src/socket/presence.ts:164` |
| LiveKit 1:1 hook | `apps/frontend/src/hooks/useVoiceCall.ts` |
| Route guard | `apps/frontend/src/middleware.ts` |
