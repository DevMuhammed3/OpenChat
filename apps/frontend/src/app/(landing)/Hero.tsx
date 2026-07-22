'use client'

import { motion } from 'framer-motion'
import {
    ArrowRight,
    Shield,
    Zap,
    Home,
    Plus,
    Hash,
    Volume2,
    Search,
    Settings,
    Mic,
    Headphones,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from 'packages/ui'
import { useUserStore } from '@/app/stores/user-store'

export default function Hero() {
    const user = useUserStore((s) => s.user)

    return (
        <section className="relative min-h-[100vh] flex items-center justify-center pt-36 pb-16 overflow-hidden bg-background">
            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
                <div className="absolute bottom-[10%] left-[40%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[140px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium mb-8 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Open-source &middot; self-hosted &middot; private
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-[50px] font-bold tracking-tight mb-6 leading-[1.05] text-white max-w-3xl mx-auto">
                            The chat app that{' '}
                            <span className="high-perf-gradient">respects you.</span>
                        </h1>

                        {/* Sub */}
                        <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
                            Open-source, self-hosted, and built for people who care
                            about privacy. Your conversations, your server, your rules.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Button
                                asChild
                                size="lg"
                                className="h-12 px-8 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 border-0"
                            >
                                <Link href={user ? '/zone' : '/auth'}>
                                    Get started
                                    <ArrowRight className="ml-2" size={18} />
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-12 px-8 text-sm font-semibold rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                            >
                                <Link
                                    href="https://github.com/DevMuhammed3/OpenChat"
                                    target="_blank"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    View on GitHub
                                </Link>
                            </Button>
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-400 mb-10">
                            {['Unlimited channels', 'Private by default', 'No lock-in'].map(
                                (pill) => (
                                    <span
                                        key={pill}
                                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-zinc-300"
                                    >
                                        {pill}
                                    </span>
                                )
                            )}
                        </div>

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-8 text-zinc-500 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-emerald-500" />
                                <span>Self-Hosted & Private</span>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-amber-400" />
                                <span>Voice & Video Calls</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Wireframe Mockup — matches real product layout */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
                        className="w-full max-w-5xl mt-16 group relative"
                    >
                        {/* Glow behind mockup */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 rounded-[32px] blur opacity-40 group-hover:opacity-60 transition duration-1000" />

                        {/* Mockup window */}
                        <div className="relative rounded-[28px] border border-white/10 bg-[#0b1220] overflow-hidden shadow-2xl shadow-primary/10 backdrop-blur-sm">
                            {/* App content — 3-column layout */}
                            <div className="flex min-h-[640px]">

                                {/* ── ZonesList column (72px) ── */}
                                <div className="w-[72px] border-r border-white/5 bg-[#090c14] flex flex-col items-center py-3 gap-2 shrink-0">
                                    {/* Home button — active */}
                                    <div className="relative flex items-center justify-center w-full">
                                        <div className="absolute left-0 w-1 h-10 bg-primary rounded-r-full" />
                                        <div className="w-12 h-12 rounded-[16px] bg-primary flex items-center justify-center text-white">
                                            <Home size={22} />
                                        </div>
                                    </div>

                                    <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

                                    {/* Zone 1 — active */}
                                    <div className="relative flex items-center justify-center w-full">
                                        <div className="absolute left-0 w-1 h-10 bg-primary rounded-r-full" />
                                        <div className="w-12 h-12 rounded-[16px] overflow-hidden bg-primary flex items-center justify-center">
                                            <img src="/icon.webp" alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    {/* Zone 2 — inactive */}
                                    <div className="relative flex items-center justify-center w-full">
                                        <div className="w-12 h-12 rounded-[24px] bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-bold uppercase">
                                            D
                                        </div>
                                    </div>

                                    <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

                                    {/* Add zone */}
                                    <div className="w-12 h-12 rounded-[24px] bg-zinc-800 flex items-center justify-center text-zinc-500">
                                        <Plus size={22} />
                                    </div>
                                </div>

                                {/* ── ZoneSidebar column (264px) ── */}
                                <div className="w-64 border-r border-white/5 bg-[#090c14] flex flex-col shrink-0">
                                    {/* Zone name */}
                                    <div className="px-4 py-3">
                                        <h2 className="font-bold text-white text-[15px] truncate leading-tight">
                                            OpenChat Team
                                        </h2>
                                    </div>

                                    {/* Channels */}
                                    <div className="flex-1 overflow-hidden px-2">
                                        {/* Text channels */}
                                        <div className="mb-4">
                                            <p className="px-2 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                                                Text Channels
                                            </p>
                                            <div className="space-y-[2px] mt-1">
                                                <div className="w-full justify-start gap-1.5 px-2 py-1.5 rounded-md text-[14px] font-medium flex items-center bg-white/10 text-white">
                                                    <Hash className="h-4 w-4 text-zinc-400" />
                                                    <span className="truncate">general</span>
                                                </div>
                                                <div className="w-full justify-start gap-1.5 px-2 py-1.5 rounded-md text-[14px] font-medium flex items-center text-zinc-400">
                                                    <Hash className="h-4 w-4 text-zinc-500" />
                                                    <span className="truncate">media</span>
                                                </div>
                                                <div className="w-full justify-start gap-1.5 px-2 py-1.5 rounded-md text-[14px] font-medium flex items-center text-zinc-400">
                                                    <Hash className="h-4 w-4 text-zinc-500" />
                                                    <span className="truncate">dev</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Voice channels */}
                                        <div className="mb-4">
                                            <p className="px-2 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                                                Voice Channels
                                            </p>
                                            <div className="space-y-[2px] mt-1">
                                                <div className="w-full justify-start gap-1.5 px-2 py-1.5 rounded-md text-[14px] font-medium flex items-center text-zinc-400">
                                                    <Volume2 className="h-4 w-4 text-zinc-500" />
                                                    <span className="truncate">lounge</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* UserBar */}
                                    <div className="border-t border-white/5 p-2">
                                        <div className="flex items-center gap-2 p-1.5 rounded-md">
                                            <div className="relative shrink-0">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src="/icon.webp" alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090c14]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-white truncate leading-tight">
                                                    You
                                                </p>
                                                <p className="text-[11px] text-zinc-500 truncate">Online</p>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                <div className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500">
                                                    <Mic className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500">
                                                    <Headphones className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500">
                                                    <Settings className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Main content — Chat view ── */}
                                <div className="flex-1 flex flex-col min-w-0 bg-[#0b1220]">
                                    {/* Channel header */}
                                    <div className="shrink-0 flex items-center justify-between border-b border-white/5 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-zinc-500" />
                                            <span className="text-sm font-semibold text-white">general</span>
                                            <div className="w-px h-4 bg-white/10 mx-1" />
                                            <span className="text-xs text-zinc-500">General discussion for the team</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-zinc-500 text-xs">
                                                <Search className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 p-4 space-y-5 overflow-hidden flex flex-col justify-end">
                                        {/* Message 1 */}
                                        <div className="flex gap-3 items-start">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                S
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-white">Sarah</span>
                                                    <span className="text-[11px] text-zinc-500">10:24 AM</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed">Hey team! Just pushed the new auth flow to staging. Can someone review?</p>
                                            </div>
                                        </div>

                                        {/* Message 2 */}
                                        <div className="flex gap-3 items-start">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                M
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-white">Marcus</span>
                                                    <span className="text-[11px] text-zinc-500">10:26 AM</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed">Nice! I&apos;ll take a look. Did you add the rate limiting we discussed?</p>
                                            </div>
                                        </div>

                                        {/* Message 3 */}
                                        <div className="flex gap-3 items-start">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                S
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-white">Sarah</span>
                                                    <span className="text-[11px] text-zinc-500">10:27 AM</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed">Yep, 100 req/min per user. Also fixed the cookie refresh bug 🐛</p>
                                            </div>
                                        </div>

                                        {/* Message 4 */}
                                        <div className="flex gap-3 items-start">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                A
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-white">Ava</span>
                                                    <span className="text-[11px] text-zinc-500">10:30 AM</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed">Voice channels are working great on mobile now too</p>
                                            </div>
                                        </div>

                                        {/* Message 5 */}
                                        <div className="flex gap-3 items-start">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                J
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-white">Jake</span>
                                                    <span className="text-[11px] text-zinc-500">10:32 AM</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed">Awesome work everyone. Let&apos;s ship v1.0 this week 🚀</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <div className="shrink-0 border-t border-white/5 p-3">
                                        <div className="flex items-center gap-3 h-11 rounded-xl border border-white/10 bg-white/5 px-4">
                                            <span className="text-zinc-500 text-sm flex-1">Message #general...</span>
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                                                    <ArrowRight size={14} className="text-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute -top-3 right-8 px-3 py-1.5 rounded-xl bg-[#111827]/90 border border-white/10 backdrop-blur-xl flex items-center gap-2 text-[10px] text-zinc-300 font-medium shadow-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            End-to-end encrypted
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom separator */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>
    )
}
