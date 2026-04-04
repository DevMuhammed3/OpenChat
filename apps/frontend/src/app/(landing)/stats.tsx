"use client"

import { motion } from "framer-motion"
import { Shield, Zap, Lock, Globe } from "lucide-react"

const stats = [
  {
    value: "100%",
    label: "Private & Secure",
    icon: Shield,
    color: "from-emerald-500 to-teal-500",
  },
  {
    value: "< 50ms",
    label: "Voice Latency",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
  },
  {
    value: "∞",
    label: "Unlimited Users",
    icon: Globe,
    color: "from-purple-500 to-indigo-500",
  },
  {
    value: "100%",
    label: "Open Source",
    icon: Lock,
    color: "from-cyan-500 to-blue-500",
  },
]

export default function Stats() {
  return (
    <section id="stats" className="relative py-24 px-6 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(120,80,255,0.06),transparent)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm text-center group hover:border-white/10 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-0.5 mx-auto mb-4`}>
                  <div className="w-full h-full bg-[#0b1220] rounded-[10px] flex items-center justify-center">
                    <Icon size={20} className="text-white" />
                  </div>
                </div>

                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>

                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
