"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Search,
    Book,
    FileText,
    Code,
    Settings,
    ChevronRight,
    MessageSquare,
    Shield,
    Users,
    Mic,
    Hash,
    Server,
    Key,
    Zap,
    Globe,
    Terminal,
    Lock,
    Eye,
    Copy,
    Check,
} from "lucide-react"
import Link from "next/link"
import Navbar from "packages/ui/ui/Navbar"
import Footer from "../(landing)/Footer"
import { useUserStore } from "../stores/user-store"

const categories = [
    {
        title: "Getting Started",
        icon: <Book size={16} />,
        items: [
            { name: "What is OpenChat", href: "#what-is-openchat" },
            { name: "Tech Stack", href: "#tech-stack" },
            { name: "Architecture", href: "#architecture" },
        ],
    },
    {
        title: "Features",
        icon: <Zap size={16} />,
        items: [
            { name: "Zones & Channels", href: "#zones-channels" },
            { name: "Direct Messages", href: "#direct-messages" },
            { name: "Voice & Video", href: "#voice-video" },
            { name: "Friends System", href: "#friends-system" },
        ],
    },
    {
        title: "API Reference",
        icon: <Code size={16} />,
        items: [
            { name: "Authentication", href: "#api-auth" },
            { name: "Zones API", href: "#api-zones" },
            { name: "Messages API", href: "#api-messages" },
            { name: "WebSocket Events", href: "#api-websocket" },
        ],
    },
    {
        title: "Self-Hosting",
        icon: <Server size={16} />,
        items: [
            { name: "Prerequisites", href: "#prerequisites" },
            { name: "Installation", href: "#installation" },
            { name: "Environment Variables", href: "#env-vars" },
            { name: "Deployment", href: "#deployment" },
        ],
    },
]

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false)

    const copy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative group my-4 rounded-xl border border-white/10 bg-[#0a0f1a] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {language}
                </span>
                <button
                    onClick={copy}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-zinc-300 font-mono leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    )
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
    const colors: Record<string, string> = {
        GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
    }

    return (
        <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${colors[method] || colors.GET}`}
            >
                {method}
            </span>
            <div className="flex-1 min-w-0">
                <code className="text-sm text-zinc-300 font-mono">{path}</code>
                <p className="text-xs text-zinc-500 mt-1">{desc}</p>
            </div>
        </div>
    )
}

export default function DocsPage() {
    const user = useUserStore((s) => s.user)
    const [activeSection, setActiveSection] = useState("what-is-openchat")
    const [search, setSearch] = useState("")
    const observerRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        const headings = document.querySelectorAll("[data-section]")
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
        )
        headings.forEach((h) => observerRef.current?.observe(h))
        return () => observerRef.current?.disconnect()
    }, [])

    const filtered = categories
        .map((cat) => ({
            ...cat,
            items: cat.items.filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((cat) => cat.items.length > 0)

    return (
        <div className="dark min-h-screen bg-background">
            <Navbar user={user} />

            <main className="pt-28 pb-24 container mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-28 space-y-8">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search docs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <nav className="space-y-6">
                                {filtered.map((cat) => (
                                    <div key={cat.title}>
                                        <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                                            {cat.icon}
                                            {cat.title}
                                        </h3>
                                        <ul className="space-y-1 border-l border-white/5 ml-2 pl-4">
                                            {cat.items.map((item) => (
                                                <li key={item.name}>
                                                    <a
                                                        href={item.href}
                                                        className={`text-sm block py-1 transition-colors ${
                                                            activeSection ===
                                                            item.href.slice(1)
                                                                ? "text-white font-medium"
                                                                : "text-zinc-500 hover:text-white"
                                                        }`}
                                                    >
                                                        {item.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Content */}
                    <article className="flex-1 max-w-3xl min-w-0">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 font-medium">
                                <Link href="/" className="hover:text-white transition-colors">
                                    Home
                                </Link>
                                <ChevronRight size={12} />
                                <span className="text-white">Documentation</span>
                            </nav>

                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                                Documentation
                            </h1>
                            <p className="text-lg text-zinc-400 mb-16 leading-relaxed">
                                Everything you need to build, deploy, and self-host OpenChat.
                            </p>

                            {/* ─── Getting Started ──────────────────────────── */}

                            <section id="what-is-openchat" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm">
                                        1
                                    </span>
                                    What is OpenChat
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    OpenChat is a self-hosted, open-source real-time communication platform.
                                    It combines text chat, voice/video calls, and community management
                                    into a single deployable unit. You own the server, the data, and the
                                    infrastructure.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        {
                                            icon: <MessageSquare size={16} className="text-primary" />,
                                            title: "Real-Time Messaging",
                                            desc: "Instant message delivery with typing indicators, reactions, pinning, and file sharing.",
                                        },
                                        {
                                            icon: <Mic size={16} className="text-cyan-400" />,
                                            title: "Voice & Video",
                                            desc: "1:1 calls and zone voice channels powered by LiveKit with speaking detection.",
                                        },
                                        {
                                            icon: <Users size={16} className="text-emerald-400" />,
                                            title: "Communities",
                                            desc: "Zones with text and voice channels, role-based access, and invite systems.",
                                        },
                                        {
                                            icon: <Shield size={16} className="text-amber-400" />,
                                            title: "Privacy First",
                                            desc: "Messages encrypted at rest, no ads, no tracking, fully self-hostable.",
                                        },
                                    ].map((f) => (
                                        <div
                                            key={f.title}
                                            className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                {f.icon}
                                                <span className="text-sm font-bold text-white">
                                                    {f.title}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 leading-relaxed">
                                                {f.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="tech-stack" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm">
                                        2
                                    </span>
                                    Tech Stack
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { name: "Next.js 16", role: "Frontend (App Router)" },
                                        { name: "React 19", role: "UI Library" },
                                        { name: "TypeScript", role: "Language" },
                                        { name: "Express 5", role: "Backend API" },
                                        { name: "Socket.io 4", role: "Real-Time Events" },
                                        { name: "Prisma", role: "ORM" },
                                        { name: "PostgreSQL", role: "Database" },
                                        { name: "LiveKit", role: "Voice & Video" },
                                        { name: "Tailwind CSS", role: "Styling" },
                                        { name: "Zustand", role: "Client State" },
                                        { name: "React Query", role: "Server State" },
                                        { name: "Zod", role: "Validation" },
                                    ].map((t) => (
                                        <div
                                            key={t.name}
                                            className="p-3 rounded-xl border border-white/5 bg-white/[0.02]"
                                        >
                                            <p className="text-sm font-bold text-white">{t.name}</p>
                                            <p className="text-[11px] text-zinc-500">{t.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="architecture" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm">
                                        3
                                    </span>
                                    Architecture
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    OpenChat follows a monorepo structure with four packages:
                                </p>
                                <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-6 mb-6">
                                    <pre className="text-sm text-zinc-300 font-mono leading-relaxed overflow-x-auto">
{`openchat/
├── apps/
│   ├── frontend/        # Next.js 16 (App Router)
│   └── backend/         # Express 5 + Socket.io + Prisma
├── packages/
│   ├── components/      # Shared shadcn/ui components
│   ├── lib/             # Shared utilities and types
│   └── types/           # TypeScript type definitions
└── desktop/             # Electron wrapper`}
                                    </pre>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    <strong className="text-white">Frontend</strong> communicates with the backend via REST API for CRUD operations and Socket.io for real-time events (messages, presence, typing, calls).
                                </p>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    <strong className="text-white">Authentication</strong> uses JWT tokens stored in HTTP-only cookies. The middleware protects all <code className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">/zone/*</code>, <code className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">/settings/*</code>, and <code className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">/dashboard/*</code> routes.
                                </p>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    <strong className="text-white">Voice/Video</strong> uses LiveKit for WebRTC infrastructure. 1:1 DM calls and zone voice channels both go through LiveKit rooms with tokens generated by the backend.
                                </p>
                            </section>

                            {/* ─── Features ──────────────────────────────────── */}

                            <section id="zones-channels" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-sm">
                                        4
                                    </span>
                                    Zones & Channels
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    Zones are communities (like servers). Each zone contains text and voice channels, members with roles, and an invite system.
                                </p>
                                <div className="space-y-3 mb-6">
                                    {[
                                        { icon: <Hash size={14} />, label: "Text Channels", desc: "Persistent message threads within a zone. Support file uploads, pinning, and emoji reactions." },
                                        { icon: <Mic size={14} />, label: "Voice Channels", desc: "LiveKit-powered voice rooms. Click to join, see who's speaking, mute/deafen controls." },
                                        { icon: <Users size={14} />, label: "Roles", desc: "OWNER, ADMIN, and MEMBER roles control who can manage channels, kick members, or edit zone settings." },
                                        { icon: <Key size={14} />, label: "Invites", desc: "Generate invite links with 7-day expiry. Members join via /zone/invite/[code]." },
                                    ].map((f) => (
                                        <div key={f.label} className="flex gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                                                {f.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white mb-1">{f.label}</p>
                                                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="direct-messages" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-sm">
                                        5
                                    </span>
                                    Direct Messages
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    1:1 conversations between friends. Messages are encrypted at rest and decrypted on retrieval.
                                </p>
                                <ul className="space-y-2 text-sm text-zinc-400">
                                    {[
                                        "Typing indicators with 3-second timeout",
                                        "Message editing and soft-deletion",
                                        "Pin important messages",
                                        "File/image attachments (2MB limit)",
                                        "Infinite scroll with cursor-based pagination (50 per page)",
                                        "Emoji, GIF, and sticker pickers",
                                        "Integrated voice calling via LiveKit",
                                    ].map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section id="voice-video" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-sm">
                                        6
                                    </span>
                                    Voice & Video
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    Two voice systems powered by LiveKit:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                        <h4 className="text-sm font-bold text-white mb-2">1:1 DM Calls</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Private voice/video calls between two friends. Floating call overlay with accept/reject/cancel. Reconnection support with 10-second grace period.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                        <h4 className="text-sm font-bold text-white mb-2">Zone Voice Channels</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Discord-style voice channels. Click to join, see participants in real-time, mute/deafen controls, speaking detection via Web Audio API.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section id="friends-system" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-sm">
                                        7
                                    </span>
                                    Friends System
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Friend relationships power DM access. The flow:
                                </p>
                                <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside mb-6">
                                    <li>Search for a user by username</li>
                                    <li>Send a friend request (requires verified email)</li>
                                    <li>Other user accepts or rejects</li>
                                    <li>Once friends, you can start DM chats and call each other</li>
                                </ol>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Users can also block others, which removes existing friendships and prevents future requests. Online status is tracked via Socket.io heartbeat.
                                </p>
                            </section>

                            {/* ─── API Reference ─────────────────────────────── */}

                            <section id="api-auth" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400 text-sm">
                                        8
                                    </span>
                                    Authentication API
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    All auth endpoints are under <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/auth</code>. JWT tokens are set as HTTP-only cookies.
                                </p>
                                <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4">
                                    <Endpoint method="POST" path="/auth/register" desc="Register a new user (name, username, email, password)" />
                                    <Endpoint method="POST" path="/auth/login" desc="Login with email and password, sets JWT cookie" />
                                    <Endpoint method="POST" path="/auth/google" desc="Login/register via Google OAuth authorization code" />
                                    <Endpoint method="GET" path="/auth/me" desc="Get current authenticated user profile" />
                                    <Endpoint method="POST" path="/auth/logout" desc="Clear JWT cookie" />
                                    <Endpoint method="POST" path="/auth/resend-email" desc="Resend email verification OTP" />
                                    <Endpoint method="POST" path="/auth/verify-email" desc="Verify email with 6-digit OTP code" />
                                </div>
                            </section>

                            <section id="api-zones" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400 text-sm">
                                        9
                                    </span>
                                    Zones API
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Zone management endpoints under <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/zones</code>.
                                </p>
                                <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4">
                                    <Endpoint method="GET" path="/zones/" desc="Get all zones the user belongs to" />
                                    <Endpoint method="POST" path="/zones/" desc="Create a new zone (auto-creates #general channel)" />
                                    <Endpoint method="GET" path="/zones/:id/channels" desc="Get all channels in a zone" />
                                    <Endpoint method="POST" path="/zones/:id/channels" desc="Create a new text or voice channel" />
                                    <Endpoint method="GET" path="/zones/:id/members" desc="Get all members with roles" />
                                    <Endpoint method="POST" path="/zones/:id/members" desc="Add users to the zone" />
                                    <Endpoint method="POST" path="/zones/:id/invites" desc="Generate an invite link (7-day expiry)" />
                                    <Endpoint method="POST" path="/zones/:id/leave" desc="Leave the zone (owners cannot leave)" />
                                    <Endpoint method="PATCH" path="/zones/:id" desc="Update zone name or avatar (owner/admin)" />
                                    <Endpoint method="DELETE" path="/zones/:id" desc="Delete zone entirely (owner only)" />
                                </div>
                            </section>

                            <section id="api-messages" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400 text-sm">
                                        10
                                    </span>
                                    Messages API
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Chat and message endpoints under <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/chats</code>.
                                </p>
                                <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4">
                                    <Endpoint method="GET" path="/chats/" desc="Get all DM chats with last message" />
                                    <Endpoint method="POST" path="/chats/start" desc="Start or resume a DM with a friend" />
                                    <Endpoint method="GET" path="/chats/:id/messages" desc="Get messages (cursor-based, 50 per page)" />
                                    <Endpoint method="POST" path="/chats/:id/upload" desc="Upload an image to a chat (2MB limit)" />
                                    <Endpoint method="PATCH" path="/chats/messages/:id" desc="Edit a message" />
                                    <Endpoint method="PATCH" path="/chats/messages/:id/pin" desc="Toggle pin on a message" />
                                    <Endpoint method="DELETE" path="/chats/messages/:id" desc="Soft-delete a message (sender only)" />
                                </div>
                            </section>

                            <section id="api-websocket" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400 text-sm">
                                        11
                                    </span>
                                    WebSocket Events
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Socket.io events for real-time communication. Connection authenticates via JWT from the <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">token</code> cookie.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Messaging</h4>
                                        <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-xs font-mono text-zinc-400 space-y-1">
                                            <p><span className="text-emerald-400">emit</span> private-message {"{ chatPublicId, text?, fileUrl? }"}</p>
                                            <p><span className="text-emerald-400">emit</span> chat:typing {"{ chatPublicId, isTyping }"}</p>
                                            <p><span className="text-blue-400">listen</span> private-message → incoming message</p>
                                            <p><span className="text-blue-400">listen</span> message:updated / message:deleted / message:pinned</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Friends & Presence</h4>
                                        <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-xs font-mono text-zinc-400 space-y-1">
                                            <p><span className="text-emerald-400">emit</span> presence:heartbeat</p>
                                            <p><span className="text-blue-400">listen</span> user:online / user:offline</p>
                                            <p><span className="text-blue-400">listen</span> friend:request / friend:accepted / friend:removed</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Voice Calls</h4>
                                        <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-xs font-mono text-zinc-400 space-y-1">
                                            <p><span className="text-emerald-400">emit</span> call:user {"{ toUserId, chatPublicId }"}</p>
                                            <p><span className="text-emerald-400">emit</span> call:accept / call:reject / call:end</p>
                                            <p><span className="text-blue-400">listen</span> incoming:call / call:accepted / call:ended</p>
                                            <p><span className="text-emerald-400">emit</span> channel:join-call {"{ channelPublicId }"}</p>
                                            <p><span className="text-blue-400">listen</span> zone:voice-presence → participant list</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Zones</h4>
                                        <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-xs font-mono text-zinc-400 space-y-1">
                                            <p><span className="text-emerald-400">emit</span> zone:join / zone:leave {"{ zonePublicId }"}</p>
                                            <p><span className="text-blue-400">listen</span> zone:presence / zone:members-updated / zone:channels-updated</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ─── Self-Hosting ──────────────────────────────── */}

                            <section id="prerequisites" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 text-sm">
                                        12
                                    </span>
                                    Prerequisites
                                </h2>
                                <ul className="space-y-2 text-sm text-zinc-400">
                                    {[
                                        "Node.js 20 or later",
                                        "pnpm 10.20.0 (or use corepack enable)",
                                        "PostgreSQL database",
                                        "LiveKit server (for voice/video)",
                                    ].map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section id="installation" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 text-sm">
                                        13
                                    </span>
                                    Installation
                                </h2>
                                <CodeBlock language="bash" code={`# Clone the repository
git clone https://github.com/DevMuhammed3/OpenChat.git
cd OpenChat

# Enable pnpm via corepack
corepack enable

# Install dependencies
pnpm install

# Set up environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# Run database migrations
cd apps/backend
pnpm prisma migrate dev

# Start development servers
pnpm dev`} />
                            </section>

                            <section id="env-vars" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 text-sm">
                                        14
                                    </span>
                                    Environment Variables
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Backend (<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">apps/backend/.env</code>):
                                </p>
                                <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 mb-6 text-xs font-mono text-zinc-400 space-y-1">
                                    <p><span className="text-primary">DATABASE_URL</span>=postgresql://...</p>
                                    <p><span className="text-primary">JWT_SECRET</span>=your-secret-key</p>
                                    <p><span className="text-primary">PORT</span>=4000</p>
                                    <p><span className="text-primary">BASE_URL</span>=http://localhost:4000</p>
                                    <p><span className="text-primary">OPENCHAT_ALLOWED_ORIGINS</span>=http://localhost:3000</p>
                                    <p><span className="text-primary">COOKIE_DOMAIN</span>=localhost</p>
                                    <p><span className="text-primary">LIVEKIT_URL</span>=wss://your-livekit-server</p>
                                    <p><span className="text-primary">LIVEKIT_API_KEY</span>=...</p>
                                    <p><span className="text-primary">LIVEKIT_API_SECRET</span>=...</p>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Frontend (<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">apps/frontend/.env.local</code>):
                                </p>
                                <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 text-xs font-mono text-zinc-400 space-y-1">
                                    <p><span className="text-primary">NEXT_PUBLIC_API_URL</span>=http://localhost:4000</p>
                                    <p><span className="text-primary">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span>=...</p>
                                </div>
                            </section>

                            <section id="deployment" data-section className="mb-20">
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 text-sm">
                                        15
                                    </span>
                                    Deployment
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                    Build all packages for production:
                                </p>
                                <CodeBlock language="bash" code={`# Build everything
pnpm build

# The frontend outputs to apps/frontend/.next (standalone mode)
# The backend compiles to apps/backend/dist/`} />
                                <p className="text-zinc-400 text-sm leading-relaxed mt-6 mb-4">
                                    The frontend is configured with <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">output: 'standalone'</code> for containerized deployments. The backend runs via <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">tsx watch</code> in development and compiles to JavaScript for production.
                                </p>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    For the Electron desktop app, see the <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">desktop/</code> directory. It wraps the frontend in an Electron shell.
                                </p>
                            </section>

                            {/* Footer link */}
                            <div className="pt-8 border-t border-white/5">
                                <p className="text-sm text-zinc-500">
                                    Questions?{" "}
                                    <Link
                                        href="https://github.com/DevMuhammed3/OpenChat"
                                        target="_blank"
                                        className="text-primary hover:underline"
                                    >
                                        Open an issue on GitHub
                                    </Link>
                                    .
                                </p>
                            </div>
                        </motion.div>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    )
}
