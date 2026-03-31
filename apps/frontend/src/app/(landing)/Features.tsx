'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Lock, CheckCircle2, MessageSquare, Video, Settings, Volume2, Mic, Headphones } from 'lucide-react'
import Image from 'next/image'

export default function Features() {
  return (
    <section id="features" className="py-24 bg-background overflow-hidden selection:bg-primary/30">
      <div className="container mx-auto px-6">
        
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight font-cabinet">
              Experience the Future of <br className="hidden md:block" /> Digital Socializing.
            </h2>
            <p className="text-zinc-500 text-base max-w-2xl mx-auto leading-relaxed">
              OpenChat combines the familiarity of modern social platforms with the power of true open-source freedom.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          
          {/* Card 1: Voice & Video - Interactive Sound Visualizer */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group overflow-hidden rounded-[32px] border border-white/5 bg-[#0b1121] p-10 min-h-[480px] flex flex-col justify-end"
          >
            {/* Animated Sound Visualizer Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-700">
               <div className="flex items-end gap-1.5 h-32">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-primary rounded-full"
                      animate={{ 
                        height: [20, Math.random() * 100 + 40, 20],
                      }}
                      transition={{ 
                        duration: 1 + Math.random(), 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
               </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Volume2 size={24} />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-zinc-400 border border-white/10 tracking-[0.2em]">LIVE VOICE</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Crystal Clear Calls</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-xs">
                Low-latency, high-fidelity voice calling. Pure connection with immersive noise suppression.
              </p>
              <div className="flex flex-wrap gap-2">
                 {["Low Latency", "Clear Audio", "Group Calls"].map(tag => (
                   <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{tag}</span>
                 ))}
              </div>
            </div>
          </motion.div>

          {/* Card 2: Communities - Realistic Mockup Backdrop */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group overflow-hidden rounded-[32px] border border-white/5 bg-[#0b1121] p-10 min-h-[480px] flex flex-col justify-end"
          >
             <div className="absolute top-0 right-0 w-full h-full p-8 opacity-10 group-hover:opacity-20 transition-all duration-700">
                <div className="w-full h-full border border-white/10 rounded-xl overflow-hidden shadow-2xl skew-y-3 scale-110 rotate-1 flex">
                   <div className="w-12 bg-white/5 border-r border-white/5" />
                   <div className="flex-1 bg-white/2 p-4 space-y-4">
                      <div className="h-4 w-1/3 bg-white/10 rounded" />
                      <div className="space-y-2">
                         <div className="h-2 w-full bg-white/5 rounded" />
                         <div className="h-2 w-full bg-white/5 rounded" />
                         <div className="h-2 w-2/3 bg-white/5 rounded" />
                      </div>
                      <div className="flex gap-2">
                         <div className="w-6 h-6 rounded-lg bg-primary/20" />
                         <div className="w-6 h-6 rounded-lg bg-cyan-400/20" />
                      </div>
                   </div>
                </div>
             </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-zinc-400 border border-white/10 tracking-[0.2em]">COMMUNITIES</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Unlimited Scale</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-xs">
                Build channels, categories, and roles. Host thousands of members with professional community tools.
              </p>
               <div className="flex flex-wrap gap-2">
                 {["Roles", "Permissions", "Global Search"].map(tag => (
                   <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{tag}</span>
                 ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Realistic Dashboard Mockup Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-[40px] border border-white/5 bg-slate-900/20 p-8 md:p-16 relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10 group-hover:bg-primary/10 transition-colors" />
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-8 shadow-lg shadow-emerald-500/10">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">Open Source. <br /> Built for Freedom.</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-md">
                  A familiar interface you already know, powered by an engine that puts you in control. No backdoors, no tracking, just you and your community.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Standard-based Voice & Video",
                    "High-performance Chat Engine",
                    "Total Auditability by Design"
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3 text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                      <CheckCircle2 size={16} className="text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Realistic App UI Mockup */}
              <div className="relative group/mockup">
                <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 opacity-20 group-hover/mockup:opacity-30 transition-opacity" />
                <div className="rounded-[24px] border border-white/10 bg-[#0f172a] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col pt-3">
                   {/* App bar style control */}
                   <div className="flex items-center gap-1.5 px-6 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/20" />
                   </div>
                   
                   <div className="flex h-[380px]">
                      {/* Sidebar - mimicking actual OpenChat sidebar */}
                      <div className="w-14 bg-[#020617] border-r border-white/5 flex flex-col items-center py-4 gap-2">
                        <div className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 cursor-pointer">
                           <Shield size={20} />
                        </div>
                        <div className="w-10 h-10 rounded-[14px] bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:bg-white/10 transition-all cursor-pointer">
                           <Mic size={18} />
                        </div>
                        <div className="w-10 h-10 rounded-[14px] bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:bg-white/10 transition-all cursor-pointer">
                           <Headphones size={18} />
                        </div>
                      </div>

                      {/* Channels & Chat Area */}
                      <div className="flex-1 flex bg-[#0f172a]">
                         {/* Channel List */}
                         <div className="w-40 border-r border-white/5 flex flex-col py-4 px-2">
                            <div className="h-3 w-16 bg-white/10 rounded mb-6 ml-2" />
                            <div className="space-y-1">
                               {['general', 'voice-hangout', 'media'].map(ch => (
                                 <div key={ch} className={`px-2 py-1.5 rounded-lg text-[10px] flex items-center gap-2 ${ch === 'general' ? 'bg-primary/10 text-primary' : 'text-zinc-500'}`}>
                                    <MessageSquare size={12} />
                                    {ch}
                                 </div>
                               ))}
                            </div>
                         </div>
                         
                         {/* Chat Messages */}
                         <div className="flex-1 flex flex-col p-4">
                            <div className="flex-1 space-y-4">
                               <div className="flex gap-3">
                                  <div className="w-6 h-6 rounded bg-primary/20 shrink-0" />
                                  <div className="space-y-1.5">
                                     <div className="h-1.5 w-12 bg-zinc-500 rounded" />
                                     <div className="h-2.5 w-32 bg-white/5 rounded" />
                                  </div>
                               </div>
                               <div className="flex gap-3 justify-end">
                                  <div className="space-y-1.5 items-end flex flex-col">
                                     <div className="h-1.5 w-10 bg-primary/40 rounded" />
                                     <div className="h-2.5 w-24 bg-primary/10 rounded" />
                                  </div>
                                  <div className="w-6 h-6 rounded bg-primary/40 shrink-0" />
                               </div>
                               <div className="flex gap-3">
                                  <div className="w-6 h-6 rounded bg-cyan-400/20 shrink-0" />
                                  <div className="space-y-1.5">
                                     <div className="h-1.5 w-16 bg-zinc-500 rounded" />
                                     <div className="h-2.5 w-40 bg-white/5 rounded" />
                                  </div>
                               </div>
                            </div>
                            
                            {/* Input box */}
                            <div className="mt-auto h-8 rounded-lg bg-white/5 border border-white/10 flex items-center px-3 text-[9px] text-zinc-600">
                               Send a message...
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   {/* UI Elements Badge */}
                   <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest shadow-2xl transition-transform group-hover/mockup:-translate-y-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Encrypted Tunnel
                   </div>
                </div>
              </div>
           </div>
        </motion.div>

      </div>
    </section>
  )
}
