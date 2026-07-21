'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'packages/ui'
import { useUserStore } from '@/app/stores/user-store'

export default function Hero() {
    const user = useUserStore((s) => s.user)

    return (
        <section className="relative min-h-[100vh] flex items-center justify-center pt-40 pb-12 overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.15),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_60%,rgba(0,200,255,0.08),transparent)]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_50%_40%,rgba(120,80,255,0.05),transparent_60%)]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-semibold mb-8 backdrop-blur-xl">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Open-source • self-hosted • voice-first</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-[1.08] text-white max-w-3xl mx-auto">
                            A calmer place to{' '}
                            <span className="high-perf-gradient">
                                chat, talk, and build together
                            </span>
                        </h1>

                        <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                            OpenChat makes real-time conversations feel simple,
                            private, and human — whether you are running a team,
                            a club, or a growing community.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Button
                                asChild
                                size="lg"
                                className="h-12 px-8 text-sm font-semibold rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-2xl shadow-primary/10 border-0"
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
                                className="h-12 px-8 text-sm font-semibold rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-sm"
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

                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm text-zinc-400 mb-10">
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                                Unlimited channels
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                                Private by default
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                                No lock-in
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-8 text-zinc-500 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-primary" />
                                <span>1K+ Active Users</span>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <Shield
                                    size={14}
                                    className="text-emerald-500"
                                />
                                <span>Self-Hosted & Private</span>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" />
                                <span>Crystal Clear Voice</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 1,
                            delay: 0.3,
                            ease: 'easeOut',
                        }}
                        className="w-full max-w-5xl mt-16 group relative"
                    >
                        <div className="absolute hidden md:block -inset-0.5 bg-gradient-to-r from-primary/30 to-cyan-500/30 rounded-[32px] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <div className="relative hidden md:block rounded-[32px] border border-white/10 bg-[#0b1121] overflow-hidden shadow-2xl">
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/40" />
                                </div>
                                <div className="flex-1 mx-4">
                                    <div className="h-6 rounded-lg bg-white/5 w-24 mx-auto flex items-center justify-center border border-white/5" />
                                </div>
                            </div>

                            <div className="grid gap-4 p-6 md:p-8 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_45%)]">
                                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#020617] shadow-[0_30px_80px_-25px_rgba(0,0,0,0.7)]">
                                    <div className="flex min-h-[360px]">
                                        <aside className="w-[96px] border-r border-white/10 bg-[#030712] p-3">
                                            <div className="mb-4 h-10 w-10 rounded-2xl bg-primary/20" />
                                            <div className="space-y-2">
                                                {[0, 1, 2].map((index) => (
                                                    <div
                                                        key={index}
                                                        className={`h-10 w-10 rounded-2xl ${index === 1 ? 'bg-primary/20' : 'bg-white/5'}`}
                                                    />
                                                ))}
                                            </div>
                                        </aside>

                                        <div className="flex flex-1">
                                            <div className="w-[170px] border-r border-white/10 bg-[#07111f] p-3">
                                                <div className="mb-3 h-2.5 w-12 rounded-full bg-white/10" />
                                                <div className="space-y-2">
                                                    {[0, 1, 2].map((index) => (
                                                        <div
                                                            key={index}
                                                            className={`h-7 rounded-xl ${index === 0 ? 'bg-primary/10' : 'bg-white/5'}`}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="mt-4 border-t border-white/10 pt-4">
                                                    <div className="mb-2 h-2.5 w-14 rounded-full bg-white/10" />
                                                    <div className="space-y-2">
                                                        {[0, 1, 2].map(
                                                            (index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`h-6 rounded-lg ${index === 0 ? 'bg-white/10' : 'bg-white/5'}`}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-1 flex-col bg-[#0b1220]">
                                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                                    <div className="space-y-2">
                                                        <div className="h-2.5 w-24 rounded-full bg-white/10" />
                                                        <div className="h-2.5 w-16 rounded-full bg-white/5" />
                                                    </div>
                                                    <div className="h-6 w-12 rounded-full bg-emerald-500/10" />
                                                </div>

                                                <div className="flex-1 space-y-3 p-4">
                                                    <div className="max-w-[82%] h-10 rounded-2xl rounded-bl-md bg-white/10" />
                                                    <div className="ml-auto max-w-[78%] h-10 rounded-2xl rounded-br-md bg-primary/20" />
                                                    <div className="max-w-[86%] h-10 rounded-2xl rounded-bl-md bg-white/10" />
                                                </div>

                                                <div className="border-t border-white/10 bg-[#0b1220] p-3">
                                                    <div className="h-10 rounded-2xl border border-white/10 bg-[#020617]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div> */}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>
    )
}
