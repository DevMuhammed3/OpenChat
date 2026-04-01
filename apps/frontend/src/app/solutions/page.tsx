"use client"

import { motion } from "framer-motion"
import { Building2, Rocket, Code2, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "packages/ui"
import Navbar from "packages/ui/ui/Navbar"
import Footer from "../(landing)/Footer"
import { useUserStore } from "../stores/user-store"

export default function SolutionsPage() {
  const user = useUserStore(s => s.user)

  return (
    <div className="dark min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">
              <Rocket size={12} className="animate-pulse" />
              Tailored for Every Need
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Identity-First Solutions for <br />
              <span className="high-perf-gradient">Open Communities.</span>
            </h1>

            <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto leading-loose font-medium">
              From high-security enterprise zones to resilient public networks, 
              OpenChat empowers sovereign, decentralized digital interaction.
            </p>
          </motion.div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Enterprise Solution */}
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/20 group hover:border-white/10 transition-all flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                 <Building2 size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Enterprise Zones</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-10 flex-1">
                 Isolated communication environments for high-stakes professional teams. Audit logs, hardware keys, and 100% data lockdown.
               </p>
               
               <ul className="space-y-4 mb-10">
                 {["Role-based Access Control", "Compliance-ready auditing", "On-premise deployment"].map(i => (
                   <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                     <Check size={16} className="text-primary" />
                     {i}
                   </li>
                 ))}
               </ul>

               <Button asChild className="h-12 w-full rounded-xl bg-primary text-white border-0">
                 <Link href="/auth">Deploy Zone</Link>
               </Button>
            </div>

            {/* Communities Solution */}
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/20 group hover:border-white/10 transition-all flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                 <Rocket size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Scalable Communities</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-10 flex-1">
                 Host large-scale public or private communities without relying on central tech giants. You own the members, the content, and the network.
               </p>
               
               <ul className="space-y-4 mb-10">
                 {["Unlimited member capacity", "Custom plugin system", "Decentralized moderation"].map(i => (
                   <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                     <Check size={16} className="text-cyan-400" />
                     {i}
                   </li>
                 ))}
               </ul>

               <Button asChild className="h-12 w-full rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20">
                 <Link href="/auth">Start Community</Link>
               </Button>
            </div>

            {/* Developers Solution */}
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/20 group hover:border-white/10 transition-all flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform">
                 <Code2 size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Developer SDKs</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-10 flex-1">
                 Build custom chat experiences using our low-latency protocol. Headless, API-first, and ready for any platform.
               </p>
               
               <ul className="space-y-4 mb-10">
                 {["WebSocket-first architecture", "Open Source client SDKs", "Native mobile support"].map(i => (
                   <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                     <Check size={16} className="text-purple-400" />
                     {i}
                   </li>
                 ))}
               </ul>

               <Button asChild className="h-12 w-full rounded-xl bg-purple-400/10 text-purple-400 border border-purple-400/20 hover:bg-purple-400/20">
                 <Link href="/api">View API Docs</Link>
               </Button>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
