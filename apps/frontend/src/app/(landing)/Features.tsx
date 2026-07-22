'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Phone, Lock } from 'lucide-react'

const features = [
  {
    icon: MessageCircle,
    title: 'Real-Time Messaging',
    desc: 'Instant delivery, channels, groups, and file sharing — no ads, no tracking.',
    color: 'bg-primary/15 text-primary',
  },
  {
    icon: Phone,
    title: 'Voice & Video',
    desc: 'Crystal-clear calls powered by LiveKit. No third-party services, no leaks.',
    color: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    icon: Lock,
    title: 'Open Source',
    desc: 'Audit every line. Self-host on your own server. No black boxes.',
    color: 'bg-emerald-500/15 text-emerald-400',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative py-24 px-6 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsla(263,70%,50%,0.08),transparent)]" />

      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Everything you need.
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto">
            Not a bloated platform. A focused tool that does what matters.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:bg-white/[0.04] transition-colors"
            >
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                <f.icon size={20} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
