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

  const solutions = [
    {
      icon: Building2,
      iconColor: "text-primary",
      title: "Enterprise Zones",
      description: "Isolated communication environments for high-stakes professional teams. Audit logs, hardware keys, and 100% data lockdown.",
      features: ["Role-based Access Control", "Compliance-ready auditing", "On-premise deployment"],
      cta: "Deploy Zone",
      ctaStyle: "bg-primary text-white border-0",
    },
    {
      icon: Rocket,
      iconColor: "text-cyan-400",
      title: "Scalable Communities",
      description: "Host large-scale public or private communities without relying on central tech giants. You own the members, the content, and the network.",
      features: ["Unlimited member capacity", "Custom plugin system", "Decentralized moderation"],
      cta: "Start Community",
      ctaStyle: "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20",
    },
    {
      icon: Code2,
      iconColor: "text-purple-400",
      title: "Developer SDKs",
      description: "Build custom chat experiences using our low-latency protocol. Headless, API-first, and ready for any platform.",
      features: ["WebSocket-first architecture", "Open Source client SDKs", "Native mobile support"],
      cta: "View API Docs",
      ctaStyle: "bg-purple-400/10 text-purple-400 border border-purple-400/20 hover:bg-purple-400/20",
    },
  ]

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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">
              <Rocket size={12} className="animate-pulse" />
              Tailored for Every Need
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Identity-First Solutions for <br />
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">Open Communities.</span>
            </h1>

            <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
              From high-security enterprise zones to resilient public networks, 
              OpenChat empowers sovereign, decentralized digital interaction.
            </p>
          </motion.div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((sol, i) => (
              <motion.div
                key={sol.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] group hover:border-white/10 transition-all flex flex-col"
              >
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${sol.iconColor} mb-6 group-hover:scale-110 transition-transform`}>
                  <sol.icon size={24} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">{sol.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 flex-1">
                  {sol.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {sol.features.map(feature => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check size={16} className={sol.iconColor} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button asChild className={`h-12 w-full rounded-xl ${sol.ctaStyle} font-semibold`}>
                  <Link href="/auth" className="flex items-center justify-center gap-2">
                    {sol.cta}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
