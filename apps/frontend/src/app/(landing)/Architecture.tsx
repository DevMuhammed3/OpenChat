'use client'

import { motion } from 'framer-motion'
import { Share2, Lock, Cpu, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function Architecture() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none">
        <Image src="/node_map.png" fill className="object-cover" alt="" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Architecture of Trust</h2>
          <p className="text-zinc-500 text-base leading-relaxed">
            The OpenChat protocol is designed from the ground up to prioritize performance without sacrificing the user's right to privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Feature List */}
          <div className="space-y-12">
            
            <div className="flex gap-6 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Share2 size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Decentralized Nodes</h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                  Deploy nodes globally to ensure data residency and sovereignty. Scale horizontally as your team grows.
                </p>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Zero-Log Policy</h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                  Infrastructure that doesn't trace. Metadata is stripped at the edge node, leaving no digital footprint.
                </p>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Cpu size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Edge Optimization</h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                  Intelligent routing ensures your traffic takes the fastest path across the backbone for zero-perceived latency.
                </p>
              </div>
            </div>

          </div>

          {/* Right Side: Status Dashboard Mockup */}
          <div className="relative">
             <div className="absolute -inset-4 bg-cyan-400/10 blur-[100px] rounded-full -z-10" />
             
             <div className="bg-[#0b1121] rounded-[32px] border border-white/5 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
                    <h4 className="text-xl font-bold text-white">Encrypted Zone Active</h4>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">4D</div>
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">OK</div>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active nodes</span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">12 GLOBAL REGIONS</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trust Index</span>
                      <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-tighter">0.9999%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                       />
                    </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Message Latency</span>
                      <span className="text-[10px] font-bold text-purple-400 font-mono tracking-tighter">0.42MS</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '4%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                       />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 h-12 rounded-xl bg-primary text-xs font-bold text-white hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-lg shadow-primary/10">
                    Audit Pass
                  </button>
                  <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                    <Share2 size={16} />
                  </button>
                </div>
             </div>
          </div>

        </div>

      </div>
    </section>
  )
}
