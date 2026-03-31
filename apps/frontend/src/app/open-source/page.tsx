'use client'

import { motion } from 'framer-motion'
import { Shield, Server, Users, Check, Github, BookOpen, Star, GitBranch, Heart } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'packages/ui'
import Navbar from 'packages/ui/ui/Navbar'
import Footer from '../(landing)/Footer'
import { useUserStore } from '../stores/user-store'

export default function OpenSourcePage() {
  const user = useUserStore(s => s.user)
  const GITHUB_URL = "https://github.com/DevMuhammed3/OpenChat"

  return (
    <div className="dark min-h-screen bg-[#020617] selection:bg-primary/30">
      <Navbar user={user} />
      
      <main className="pt-32 pb-24">
        {/* Decorative background effects */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
           <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 blur-[160px] rounded-full" />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-24 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-500 text-[10px] font-bold mb-10 uppercase tracking-[0.2em] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% COMMUNITY DRIVEN
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
              Privacy as a <br />
              <span className="high-perf-gradient">Public Property.</span>
            </h1>

            <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto mb-12 leading-loose font-medium">
              OpenChat is built by contributors around the world who believe free speech and privacy should be the default, not an option.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild className="h-14 px-10 rounded-2xl bg-primary text-white border-0 shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-bold">
                <Link href={GITHUB_URL}>
                  <Github size={18} className="mr-2" />
                  Clone on GitHub
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-14 px-10 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all font-bold">
                <Link href={`${GITHUB_URL}/stargazers`}>
                  <Star size={18} className="mr-2 text-yellow-500" />
                  Star the Project
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Core Pillars */}
        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               {
                 icon: Shield,
                 label: "Total Transparency",
                 desc: "Our entire communication engine, from voice processing to encryption, is public property. No hidden analytics, ever."
               },
               {
                 icon: GitBranch,
                 label: "Freedom to Fork",
                 desc: "The project's AGPL-3.0 license ensures you're free to study, modify, and host your own customized chat environment."
               },
               {
                 icon: Heart,
                 label: "Independently Built",
                 desc: "No venture capital, no corporate control. We are funded by the people who use the protocol every single day."
               }
             ].map((pillar, i) => (
                <motion.div
                  key={pillar.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[32px] border border-white/5 bg-slate-900/40 hover:border-white/10 transition-all"
                >
                   <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-6">
                      <pillar.icon size={20} />
                   </div>
                   <h4 className="text-white font-bold mb-4">{pillar.label}</h4>
                   <p className="text-xs text-zinc-500 leading-relaxed font-medium">{pillar.desc}</p>
                </motion.div>
             ))}
          </div>
        </section>

        {/* Self-Hosting Benefits Card */}
        <section className="container mx-auto px-6 mb-32">
           <div className="max-w-4xl mx-auto rounded-[48px] border border-white/5 bg-gradient-to-br from-primary/10 via-slate-950 to-slate-950 p-8 md:p-16 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10 group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                 <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">
                       Sovereignty as a Standard
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">Your Server. <br /> Your Community.</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-sm">
                      Self-hosting OpenChat puts the power back where it belongs. Manage your own keys, database, and voice infrastructure without being tied to a centralized platform.
                    </p>
                    <div className="flex flex-wrap gap-4">
                       {[
                         "Zero-Knowledge Storage",
                         "Custom Instance URLs",
                         "Automatic Updates"
                       ].map(tag => (
                         <div key={tag} className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            <Check size={14} className="text-emerald-500" />
                            {tag}
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="w-full md:w-64 aspect-square rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 flex flex-col items-center justify-center shadow-2xl relative">
                    <Server size={64} className="text-primary mb-6 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Node ready</span>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/10 blur-[40px]" />
                 </div>
              </div>
           </div>
        </section>

        {/* Contribute Table (Simple) */}
        <section className="container mx-auto px-6 mb-32">
           <div className="max-w-4xl mx-auto">
              <h2 className="text-center text-xl font-bold text-white mb-12 uppercase tracking-widest">Ways to Contribute</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[
                   { label: "Star & Fork", desc: "Show your support and help others find the protocol.", icon: Star },
                   { label: "Report Bugs", desc: "Help us harden the encryption and fix corner cases.", icon: Shield },
                   { label: "Develop Features", desc: "Build new plugins or improve our voice engine.", icon: GitBranch },
                   { label: "Community Support", desc: "Help newcomers set up their sovereign nodes.", icon: Users }
                 ].map(item => (
                   <div key={item.label} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-start gap-4 hover:bg-white/[0.04] transition-colors group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                        <item.icon size={18} />
                      </div>
                      <div>
                        <h5 className="text-white text-sm font-bold mb-2">{item.label}</h5>
                        <p className="text-zinc-500 text-[11px] leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Connect Action */}
        <section className="container mx-auto px-6 text-center">
           <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6 leading-tight">Ready to build the future?</h2>
              <p className="text-zinc-500 text-sm mb-12 leading-loose">Join our community on GitHub and help us define the next generation of human communication.</p>
              <Button asChild className="h-14 px-12 rounded-2xl bg-white text-black border-0 shadow-xl shadow-white/5 hover:bg-zinc-200 transition-all font-bold">
                 <Link href={GITHUB_URL}>
                    Visit the Repository
                 </Link>
              </Button>
           </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
