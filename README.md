# 🚀 OpenChat

**The Ultimate Real-Time Chat & Voice Platform.**  
A high-performance monorepo featuring non-blocking voice calls, persistent sessions, and a premium messaging experience.

---

## ✨ Key Features

- **🛡️ Production-Ready Voice Calling**: 
  - Robust WebRTC & Socket.io signaling.
  - **Non-Blocking Floating UI**: Keep chatting while on a call.
  - **Server-Side Persistence**: Refresh the page? No problem. The call automatically reconnects.
  - **Graceful Disconnects**: 10-second grace period for network drops.
- **💬 Real-Time Messaging**: Instant delivery via Socket.io with typing indicators and read receipts.
- **📁 Zone-Based Communities**: Organize chats into Discord-style "Zones" with dedicated text and voice channels.
- **🔐 Secure Authentication**: 
  - JWT + HTTP-only Cookie authentication.
  - Google OAuth integration.
  - Email verification system.
- **🎨 Premium UI/UX**:
  - Dark-mode first, glassmorphic design.
  - Smooth micro-animations powered by Framer Motion.
  - Responsive, compact floating call overlays.
- **⚙️ Integrated Settings**: 
  - Profile management (Avatar upload/removal, bio, username).
  - Account security and notifications.

---

## 🛠️ Technology Stack

| **Component** | **Technologies** |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (Turbopack), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), [Framer Motion](https://www.framer.com/motion/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.io](https://socket.io/), [Prisma ORM](https://www.prisma.io/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **Real-Time** | WebRTC (PeerConnection API), Socket.io |
| **Monorepo** | [pnpm Workspaces](https://pnpm.io/workspaces) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **PostgreSQL** instance

### Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/openchat.git
   cd openchat
   pnpm install
   ```

2. **Environment Configuration**:
   Create `.env.local` files in both `apps/frontend` and `apps/backend` (or use the root `.env.local` for shared values).

   **Backend (`apps/backend/.env`):**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/openchat"
   JWT_SECRET="your_secret_key"
   CLIENT_URL="http://localhost:3000"
   BASE_URL="http://localhost:4000"
   ```

   **Frontend (`apps/frontend/.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_id"
   ```

3. **Database Migration**:
   ```bash
   cd apps/backend
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

4. **Run Development Mode**:
   From the project root:
   ```bash
   pnpm dev
   ```
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:4000`

---

## 🏗️ Project Structure

```text
├── apps/
│   ├── frontend/        # Next.js Application (Client)
│   └── backend/         # Express & Socket.io Server
├── packages/
│   ├── components/      # Shared shadcn/ui components
│   ├── lib/             # Shared utilities & API clients
│   └── types/           # Shared TypeScript interfaces
├── pnpm-workspace.yaml  # Workspace configuration
└── README.md            # You are here!
```

---

## 📡 Voice Call Architecture

OpenChat uses a custom-built WebRTC signaling state machine:

1.  **Initiation**: Client A emits `call:user` via Sockets.
2.  **Tracking**: Backend stores call metadata in an `activeCalls` Map for persistence.
3.  **Offer/Answer**: WebRTC `RTCPeerConnection` handshake occurs through Socket.io.
4.  **ICE Candidates**: Network candidates are queued and drained only after the remote description is set to ensure 100% connection success.
5.  **Reconnection**: If Client B refreshes, they emit `call:check`. The server provides the current call state, allowing Client B to re-mount the `GlobalCallProvider` and re-negotiate the stream.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

**Built with ❤️ by the OpenChat Team.**
