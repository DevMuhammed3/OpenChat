"use client"

import { motion } from "framer-motion"
import { Share2, Lock, Cpu, Globe, Check, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "packages/ui"
import Navbar from "packages/ui/ui/Navbar"
import Footer from "../(landing)/Footer"
import { useUserStore } from "../stores/user-store"

export default function InfrastructurePage() {
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
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">
              <Cpu size={12} className="animate-pulse" />
              Global Protocol Spec
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Resilient Infrastructure for <br />
              <span className="high-perf-gradient">a Sovereign Web.</span>
            </h1>

            <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto leading-loose font-medium">
              A peer-to-peer network designed for extreme privacy, 
              zero-metadata routing, and sub-millisecond delivery.
            </p>
          </motion.div>
        </section>

        {/* Global Network Visual Section */}
        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/20 group hover:border-white/10 transition-all flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                 <Globe size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Global Edge Network</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-10 flex-1">
                 Our geographically distributed nodes prioritize low-latency routing, bringing the data closer to the user 
                 while maintaining full encryption and sovereignty.
               </p>
               
               <ul className="space-y-4 mb-10">
                 {["12 Global Regions", "Auto-scaling infrastructure", "Regional data isolation"].map(i => (
                   <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                     <Check size={16} className="text-primary" />
                     {i}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/20 group hover:border-cyan-400/20 transition-all flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                 <Lock size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Zero-Log Certainty</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-10 flex-1">
                 Infrastructure that literally cannot log. Metadata is stripped at the entry node, and message payloads are 
                 encrypted from end-to-end using quantum-ready algorithms.
               </p>
               
               <ul className="space-y-4 mb-10">
                 {["Metadata stripping at edge", "Peer-to-peer verification", "Hardware security modules"].map(i => (
                   <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                     <Check size={16} className="text-cyan-400" />
                     {i}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="p-10 rounded-[2.5rem] border border-white/5 bg-slate-900/20 group hover:border-purple-400/20 transition-all flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform">
                 <Zap size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">Performance Benchmarks</h3>
               <p className="text-zinc-500 text-sm leading-relaxed mb-10 flex-1">
                 Engineered for high-frequency environments. Sub-millisecond latency within private zones, and real-time 
                 synchronization across global deployments.
               </p>
               
               <ul className="space-y-4 mb-10">
                 {["0.42ms average latency", "Optimized routing protocol", "High-frequency ready"].map(i => (
                   <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                     <Check size={16} className="text-purple-400" />
                     {i}
                   </li>
                 ))}
               </ul>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
