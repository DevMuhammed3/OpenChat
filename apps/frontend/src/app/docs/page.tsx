"use client"

import { motion } from "framer-motion"
import { Search, Book, FileText, Code, Settings, ChevronRight, MessageSquare } from "lucide-react"
import Link from "next/link"
import Navbar from "packages/ui/ui/Navbar"
import Footer from "../(landing)/Footer"
import { useUserStore } from "../stores/user-store"

export default function DocsPage() {
  const user = useUserStore(s => s.user)

  const categories = [
    {
      title: "Getting Started",
      icon: <Book size={18} />,
      items: ["Overview", "Installation", "Quick Start", "Architecture"]
    },
    {
      title: "Core Protocol",
      icon: <FileText size={18} />,
      items: ["Encryption Spec", "Message Routing", "Zero-Knowledge", "Federation"]
    },
    {
      title: "API Reference",
      icon: <Code size={18} />,
      items: ["REST API", "WebSockets", "Plugin SDK", "Authentication"]
    },
    {
      title: "Infrastructure",
      icon: <Settings size={18} />,
      items: ["Self-Hosting", "CLI Tools", "Docker/K8s", "Performance Tuning"]
    }
  ]

  return (
    <div className="dark min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="pt-32 pb-24 container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search docs..." 
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-6">
                {categories.map((cat) => (
                  <div key={cat.title}>
                    <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                      {cat.icon}
                      {cat.title}
                    </h3>
                    <ul className="space-y-2 border-l border-white/5 ml-2 pl-4">
                      {cat.items.map((item) => (
                        <li key={item}>
                          <Link href="#" className="text-sm text-zinc-500 hover:text-white transition-colors block py-1">
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <article className="flex-1 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 font-medium">
                <span>Docs</span>
                <ChevronRight size={12} />
                <span className="text-zinc-300">Getting Started</span>
                <ChevronRight size={12} />
                <span className="text-white">Overview</span>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Project Documentation</h1>
              <p className="text-lg text-zinc-400 mb-12 leading-relaxed">
                Welcome to the OpenChat documentation. Our protocol is designed to provide 
                sovereign, high-performance communication infrastructure for everyone.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                 {[
                   { title: "Start Integration", desc: "Learn how to integrate OpenChat into your existing apps.", icon: <Code className="text-primary" /> },
                   { title: "Self-hosting Guide", desc: "A step-by-step guide to deploying your own nodes.", icon: <Settings className="text-cyan-400" /> }
                 ].map(card => (
                   <div key={card.title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       {card.icon}
                     </div>
                     <h4 className="text-white font-bold mb-2">{card.title}</h4>
                     <p className="text-xs text-zinc-500 leading-relaxed mb-4">{card.desc}</p>
                     <Link href="#" className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                       Learn More <ChevronRight size={14} />
                     </Link>
                   </div>
                 ))}
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-bold text-white mb-4">Why OpenChat?</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  In a world of centralized data silos, OpenChat provides a unique alternative. 
                  Our architecture is built on three core pillars:
                </p>
                <ul className="space-y-4 text-sm text-zinc-500">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">01.</span>
                    <span><strong>Absolute Sovereignty:</strong> You own the data, the network, and the member relationships.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cyan-400 font-bold">02.</span>
                    <span><strong>High Performance:</strong> Optimized C++ and Go backends for sub-millisecond message delivery.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-400 font-bold">03.</span>
                    <span><strong>Open Standards:</strong> No proprietary protocols. Everything is verifiable and open source.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </article>

        </div>
      </main>

      <Footer />
    </div>
  )
}
