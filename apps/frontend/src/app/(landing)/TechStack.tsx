'use client'

import { motion } from 'framer-motion'

const tech = [
  { name: 'Next.js', file: 'nextjs.svg' },
  { name: 'TypeScript', file: 'typescript.svg' },
  { name: 'Tailwind', file: 'tailwind.svg' },
  { name: 'Socket.io', file: 'socketio.svg' },
  { name: 'Express', file: 'express.svg' },
  { name: 'Prisma', file: 'prisma.svg' },
  { name: 'PostgreSQL', file: 'postgresql.svg' },
]

export default function TechStack() {
  return (
    <section className="relative py-20 px-6 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_50%,hsla(263,70%,50%,0.04),transparent)]" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
            Built with
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
        >
          {tech.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-2.5 text-zinc-300 hover:text-white transition-colors group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${t.file}`}
                alt={t.name}
                className="w-6 h-6 opacity-40 group-hover:opacity-70 transition-opacity filter brightness-0 invert"
              />
              <span className="text-sm font-medium">{t.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
