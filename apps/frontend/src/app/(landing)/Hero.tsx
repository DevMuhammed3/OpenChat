'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'packages/ui'
import { useUserStore } from '@/app/stores/user-store'

export default function Hero() {
  const user = useUserStore(s => s.user)

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-40 pb-12 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_60%,rgba(0,200,255,0.08),transparent)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_50%_40%,rgba(120,80,255,0.05),transparent_60%)]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-semibold mb-8 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Now in Public Beta — Free for everyone</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-8 leading-[1.1] text-white">
              Real-time chat & voice,{' '}
              <span className="high-perf-gradient">
                built for communities.
              </span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Crystal-clear voice calls, instant messaging, and powerful community tools.
              Open source, self-hostable, and designed for the modern web.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-2xl shadow-primary/10 border-0">
                <Link href={user ? "/zone" : "/auth"}>
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2" size={18} />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                <Link href="https://github.com/DevMuhammed3/OpenChat" target="_blank">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-zinc-500 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-primary" />
                <span>9,999+ Active Users</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-500" />
                <span>Self-Hosted & Private</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500" />
                <span>Crystal Clear Voice</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="w-full max-w-5xl mt-16 group relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-cyan-500/30 rounded-[32px] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-[32px] border border-white/10 bg-[#0b1121] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/40" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-lg bg-white/5 w-64 mx-auto flex items-center justify-center border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider">app.openchat.com/zone/general</span>
                  </div>
                </div>
              </div>
              <img
                src="/images/dashboard.png"
                alt="OpenChat Dashboard Preview"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  )
}