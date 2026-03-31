"use client"

import { motion } from "framer-motion"
import { Home, ArrowLeft, Disc } from "lucide-react"
import Link from "next/link"
import { Button } from "packages/ui"
import Navbar from "packages/ui/ui/Navbar"
import Footer from "./(landing)/Footer"
import { useUserStore } from "./stores/user-store"

export default function NotFound() {
  const user = useUserStore(s => s.user)

  return (
    <div className="dark min-h-screen bg-[#020617] flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-32 pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Animated Icon */}
          <div className="mb-12 relative inline-block">
            <Disc size={120} className="text-white/5 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-bold high-perf-gradient drop-shadow-2xl">404</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Page Not Found.</h1>
          <p className="text-zinc-500 text-base max-w-md mx-auto mb-12 leading-relaxed">
            The resource you are looking for has been moved, deleted, or never existed in the OpenChat protocol.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="h-12 px-8 rounded-xl bg-primary text-white border-0 shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer">
              <Link href="/">
                <Home size={18} className="mr-2" />
                Return Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all cursor-pointer">
              <button onClick={() => window.history.back()}>
                <ArrowLeft size={18} className="mr-2" />
                Go Back
              </button>
            </Button>
          </div>
        </motion.div>

        {/* Floating tech bits */}
        <div className="absolute h-full w-full pointer-events-none -z-10">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full"
              initial={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity
              }}
            />
          ))}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  )
}
