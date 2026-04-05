# OpenChat

A production-grade real-time chat and voice communication platform designed to demonstrate scalable, enterprise-level real-time system architecture. OpenChat implements a complete messaging infrastructure with peer-to-peer voice calls, persistent session management, and a community-based communication model.

## Overview

OpenChat is not a basic chat demo. It models a Discord-like communication platform with:

- **Real-time messaging** with instant delivery, typing indicators, and read receipts over WebSocket connections
- **Voice communication** using WebRTC with custom Socket.io-based signaling, supporting both direct calls and group channels
- **Call persistence and recovery** ensuring users can refresh their page mid-call and automatically reconnect
- **Community organization** via Zones (servers), which contain private channels (text/voice) and participants
- **Complete authentication** with secure JWT cookies, Google OAuth integration, and email verification
- **Responsive, production-ready UI** built with Next.js, React, and Tailwind CSS

The project is structured as a monorepo using pnpm workspaces, cleanly separating frontend, backend, and shared packages.

## Why This Project Exists

This project demonstrates how to build real-time systems that handle the common challenges of production environments:

1. **Managing concurrent connections at scale** - Socket.io connections are pooled, presence tracked with heartbeats, and stale connections cleaned automatically
2. **Voice call state persistence** - Calls are tracked server-side in memory, enabling reconnection after page refreshes or temporary disconnections
3. **Graceful degradation** - Network drops trigger a 10-second grace period before call termination, allowing temporary connectivity issues to self-recover
4. **Synchronization without conflicts** - Real-time updates are coordinated via a single source of truth on the backend, preventing inconsistent state
5. **User presence and status** - Online/offline states are propagated to friends only, reducing unnecessary broadcasts

This is valuable for teams building chat applications, collaboration tools, or any system requiring reliable real-time communication.

## Technical Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                    │
│  - React components with Zustand state management          │
│  - Socket.io client for real-time subscriptions            │
│  - WebRTC peer connections (signaling via Socket.io)       │
└──────────────┬──────────────────────────────────────────────┘
               │
         (HTTP + WebSocket)
               │
┌──────────────▼──────────────────────────────────────────────┐
│              Backend (Express + Socket.io)                  │
│  - RESTful API for stateless operations (auth, CRUD)       │
│  - Socket.io namespace handlers for real-time events       │
│  - In-memory structures for calls, presence, connections   │
│  - Prisma ORM for data persistence                         │
└──────────────┬──────────────────────────────────────────────┘
               │
         (SQL Protocol)
               │
┌──────────────▼──────────────────────────────────────────────┐
│           PostgreSQL Database                               │
│  - Users, messages, channels, zones, relationships          │
│  - Indexed message queries by chat and timestamp            │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

The database uses Prisma ORM with the following key entities:

- **User**: Core identity with authentication tokens, OAuth integrations, online status
- **Chat**: Containers for messages (can be DM or ZONE type)
- **Channel**: Text or voice channels within a Chat (zone)
- **Message**: Individual messages with optional file attachments, reactions, and replies
- **ChatParticipant**: Membership relationship with role-based access (OWNER, ADMIN, MEMBER)
- **ChatInvite**: Reusable invite codes for zones with expiration and usage limits
- **Friend**: Bidirectional friend relationships
- **FriendRequest**: Pending friend connections
- **MessageReaction**: Emoji reactions to messages

## Real-Time System

### Messaging Flow

1. **Connection Establishment**
    - Client connects to Socket.io server with JWT token
    - Backend validates token via middleware (`socketAuth`)
    - User joins personal room (`user:${userId}`) and all chat rooms for their conversations
    - Backend registers connection and broadcasts online status to friends

2. **Sending a Message**
    - Client emits `message:send` with text/file content and target chat ID
    - Backend validates sender membership in the chat
    - Message is persisted to PostgreSQL
    - Backend broadcasts via Socket.io to all participants in the chat room
    - Frontend receives update and appends to message list

3. **Typing Indicators**
    - Client emits `typing:start` when user begins typing
    - Backend broadcasts to other participants in the chat
    - Frontend displays visual indicator
    - Timeout clears indicator after inactivity

4. **Read Status**
    - (Implied by presence tracking) Presence updates inform others when a user is viewing a chat

### WebRTC Signaling with Socket.io

Instead of relying on external STUN/TURN servers for all signaling, OpenChat implements a custom WebRTC handshake over Socket.io:

1. **Call Initiation**
    - Caller (A) emits `call:user` to target user (B)
    - Backend creates `ActiveCall` entry in `activeCalls` Map with status="ringing"
    - Backend emits `call:incoming` to B's socket room

2. **Call Acceptance**
    - Receiver (B) emits `call:accept`
    - Backend updates call status to "active"
    - Both clients now have each other's user IDs

3. **ICE Candidate Queuing**
    - Caller creates `RTCPeerConnection` and generates an offer
    - Before sending candidates, both sides exchange:
        - Offer (SDP)
        - Answer (SDP)
    - Only after remote description is set are ICE candidates flushed from the queue
    - This ensures 100% connection success by preventing candidate loss

4. **Connection Validation**
    - Both sides exchange candidates and establish connection
    - Connection state transitions: new → checking → connected → completed
    - One side declares successful connection; both update UI

5. **Call Termination**
    - Either side emits `call:end`
    - Backend removes call from `activeCalls` Map, emits termination event to other side
    - Clients close peer connections cleanly

### Reconnection and Persistence

The most critical feature: **calls survive page refreshes**.

**Server-Side State:**

- `activeCalls` Map maintains all ongoing calls with participant metadata
- `userToCall` Map tracks which call each user is currently in
- `userConnections` Map tracks active socket IDs per user with heartbeat timestamps

**Client-Side Reconnection:**

1. User is in a call and refreshes the page
2. New socket connects and authenticates
3. Frontend immediately emits `call:check`
4. Backend looks up user in `userToCall` and returns the current call state
5. Frontend re-mounts the call component with the call data
6. Frontend re-establishes WebRTC connection using new socket ID

**Graceful Disconnection Handling:**

- When a participant disconnects, backend starts a 10-second timer (`DISCONNECT_TIMEOUT`)
- If the user reconnects within 10 seconds, the call resumes
- After 10 seconds, the call is terminated and the other party is notified
- This allows temporary network blips to self-recover without interrupting calls

### Presence and Online Status

**Presence Tracking:**

- Each socket connection is registered in `userConnections` with a timestamp
- A presence cleanup interval (every 15 seconds) checks for stale connections (>45 seconds old)
- When a user's last socket disconnects, their `isOnline` status is set to `false` in the database

**Heartbeat Mechanism:**

- Clients emit `presence:heartbeat` periodically to keep their connection timestamp fresh
- Backend updates the timestamp without broadcasting (lower overhead than on-every-event)
- Any socket event also refreshes the connection timestamp via `socket.onAny()`

**Friend State Propagation:**

- When a user goes online/offline, backend queries their friend list
- Updates are broadcast only to friends' sockets, reducing message volume
- Prevents broadcasting online status to non-friends

## Frontend Architecture

### Technology Stack

- **Next.js 16** with App Router and Turbopack for fast builds
- **React 19** with modern hooks and concurrent rendering
- **Zustand** for global state management (calls, user data, UI state)
- **Tailwind CSS** with custom configuration for consistent styling
- **Framer Motion** for smooth animations on modals, overlays, and transitions
- **Socket.io Client** for real-time subscriptions
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for forms

### Key Features

- **Responsive Design**: Adapts from mobile to desktop
- **Floating Call Overlay**: Users can continue chatting while in a call
- **Real-Time Updates**: Messages, typing indicators, and user status update instantly
- **OAuth Integration**: Sign in with Google (via AuthProvider wrapper)
- **Dark Mode**: Thread-safe with next-themes

## Backend Architecture

### Technology Stack

- **Express 5** for HTTP routing and middleware
- **Socket.io 4** for real-time WebSocket communication
- **Prisma ORM** for database abstraction and type safety
- **PostgreSQL** as the primary data store
- **JWT + HTTP-Only Cookies** for authentication
- **bcrypt/bcryptjs** for password hashing
- **google-auth-library** for OAuth token validation

### Core Modules

**Socket Handlers** (`src/socket/`):

- `auth.ts` - Middleware that validates JWT from cookies on socket connection
- `presence.ts` - Tracks online users, manages heartbeat cleanup, broadcasts online/offline events
- `callHandler.ts` - Manages direct peer-to-peer calls with reconnection logic
- `channelCallHandler.ts` - Manages group calls within channels
- `privateChat.ts` - Handles DM messages, typing indicators, read receipts

**Controllers** (`src/controllers/`):

- Auth, User, Chat, WebRTC, Friend, Zones - REST endpoints for CRUD operations
- Each validates permissions and delegates to Prisma queries

**Validation** (`src/validations/`):

- Zod schemas for input validation on REST endpoints
- Prevents invalid data from entering the database

**Middleware** (`src/middlewares/`):

- `auth.middleware.ts` - Validates JWT in HTTP requests
- `requireVerified.ts` - Ensures user has verified their email
- `upload.middleware.ts` - Handles file uploads (avatars, message attachments)

## Deployment Considerations

### Production Checklist

1. **Environment Variables**
    - Set `DATABASE_URL` to production PostgreSQL instance
    - Use strong `JWT_SECRET` (>32 characters)
    - Configure `OPENCHAT_ALLOWED_ORIGINS` for your domain(s)
    - Enable SSL/TLS on database connection

2. **Socket.io Scaling**
    - The current setup uses in-memory maps for `activeCalls`, `userConnections`, `userToCall`
    - For single-server deployments, this is fine
    - For multi-server deployments, migrate to:
        - Redis adapter for Socket.io (broadcasts across servers)
        - Shared cache (Redis) for `activeCalls` instead of in-memory
        - Session affinity or server-side session store for WebRTC peer connections

3. **Database Optimization**
    - Most queries are indexed by `chatId` and `createdAt` for message retrieval
    - Consider query result caching for zones and channels

4. **Security Hardening**
    - Rate limit authentication endpoints
    - Validate file uploads (MIME type, size)
    - Sanitize message content before storage (if needed)
    - Implement CORS correctly for your domain
    - Use HTTPS/WSS only in production

### Call Capacity Estimation

- Each active WebRTC connection uses ~1-2 MB in browser memory
- Server-side call state is minimal (~1 KB per active call)
- Presence tracking is O(n) where n is active users
- For 10,000 concurrent users, expect ~20-40 MB memory for presence + calls

## Project Structure

```
openchat/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── socket/           # Socket.io event handlers
│   │   │   ├── controllers/      # REST endpoint handlers
│   │   │   ├── middlewares/      # Express middleware
│   │   │   ├── routes/           # Route definitions
│   │   │   ├── validations/      # Zod schemas
│   │   │   ├── utils/            # Utilities (JWT, crypto, etc)
│   │   │   ├── services/         # Business logic
│   │   │   ├── config/           # Configuration (env, prisma, CORS)
│   │   │   ├── app.ts            # Express app setup
│   │   │   └── index.ts          # Server entry, Socket.io setup
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── migrations/       # Prisma migrations
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router pages
│   │   │   ├── components/       # React components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── lib/              # Utilities and API clients
│   │   │   ├── features/         # Feature-specific logic
│   │   │   └── globals.css       # Global styles
│   │   └── package.json
│   └── desktop/                  # Electron app (optional)
├── packages/
│   ├── components/               # Shared shadcn/ui components
│   ├── lib/                      # Shared utilities and types
│   ├── types/                    # TypeScript type definitions
│   └── package.json
├── pnpm-workspace.yaml
└── package.json
```

## Key Implementation Details

### Call State Machine

Calls transition through the following states:

```
idle
  ↓
ringing (A initiates, B receives notification)
  ↓
active (both sides connected)
  ↓
ended (one side hung up or timeout)
```

On disconnect with ongoing call:

- Start 10-second grace period
- If reconnect within 10s → resume call state
- If no reconnect after 10s → end call, notify other side

### ICE Candidate Handling

WebRTC requires careful coordination of candidates:

```
Caller                          Receiver
   │                               │
   ├─ createOffer() ───────────>  │
   │                               ├─ createAnswer()
   │  <────── setRemoteDescription │
   │                               │
   ├─ queue candidates until ─────>│
   │  remoteDescription set        │
   │                               ├─ setRemoteDescription
   │  <───── flush candidates ─────┤
   │  addIceCandidate() for each   │
   │                               │
   └─ connection established ──────>
```

### Session-to-App State Synchronization

On page refresh while in call:

1. Socket connects with JWT → `call:check` emitted
2. Backend responds with current call state (chat ID, other participants, call duration)
3. Frontend Zustand store hydrated with call data
4. Call component re-mounts and re-establishes peer connection
5. Call continues seamlessly

## Getting Started

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x
- PostgreSQL instance

### Quick Start

1. **Clone and Install**

    ```bash
    git clone https://github.com/DevMuhammed3/OpenChat
    cd openchat
    pnpm install
    ```

2. **Configure Environment**

    Create `apps/backend/.env`:

    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/openchat
    JWT_SECRET=your-secret-key-at-least-32-characters
    PORT=4000
    BASE_URL=http://localhost:4000
    OPENCHAT_ALLOWED_ORIGINS=http://localhost:3000
    ```

    Create `apps/frontend/.env.local`:

    ```env
    NEXT_PUBLIC_API_URL=http://localhost:4000
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-id
    ```

3. **Initialize Database**

    ```bash
    cd apps/backend
    pnpm prisma migrate dev
    pnpm prisma generate
    ```

4. **Start Development Servers**

    ```bash
    pnpm dev
    ```

    - Frontend: http://localhost:3000
    - Backend: http://localhost:4000

### Building for Production

```bash
# Build all apps and packages
pnpm build

# Front-end production build
cd apps/frontend
pnpm build
pnpm start

# Backend production build
cd apps/backend
pnpm build
NODE_ENV=production pnpm start
```

## Common Challenges Solved

### Challenge 1: Reconnection During Active Calls

**Problem**: Users refresh the page while in a call and lose connection.

**Solution**: Server maintains call state in memory with participant tracking. On reconnection, client queries call status and re-establishes peer connection without losing audio/video stream context.

### Challenge 2: Network Drops

**Problem**: Temporary connection loss drops calls immediately.

**Solution**: 10-second grace period on disconnect. If socket reconnects within window, call continues. Only terminates after grace period expires.

### Challenge 3: Stale Presence Updates

**Problem**: Users show as online when they're not (browser crash, no clean disconnect).

**Solution**: Heartbeat-based cleanup. Connections must send heartbeats every 45 seconds. Stale connections are pruned automatically, and user goes offline if no active sockets remain.

### Challenge 4: ICE Candidate Loss

**Problem**: Candidates sent before remote description set are discarded, causing connection failures.

**Solution**: Queue candidates until remote description is set, then flush all at once. Guarantees 100% candidate delivery.

### Challenge 5: Friend Privacy

**Problem**: Broadcasting online status to all users wastes bandwidth and violates privacy.

**Solution**: Online/offline events sent only to mutual friends. Non-friends don't receive presence updates.

## Contributing

OpenChat accepts contributions via pull requests. See the repository for guidelines.

## License

MIT License. See LICENSE file for details.
