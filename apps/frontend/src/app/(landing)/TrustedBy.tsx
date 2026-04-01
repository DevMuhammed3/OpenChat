'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const techStack = [
  { name: 'Next.js', src: '/nextjs.svg' },
  { name: 'TypeScript', src: '/typescript.svg' },
  { name: 'Tailwind CSS', src: '/tailwind.svg' },
  { name: 'Socket.io', src: '/socketio.svg' },
  { name: 'Express', src: '/express.svg' },
  { name: 'Prisma', src: '/prisma.svg' },
  { name: 'PostgreSQL', src: '/postgresql.svg' },
]

export default function TrustedBy() {
  return (
    <section className="py-16 border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-10">
          Our Technology Stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {techStack.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.06] group-hover:border-white/10 transition-all p-2.5">
                <Image 
                  src={tech.src} 
                  alt={tech.name} 
                  width={32} 
                  height={32}
                  className="transition-all duration-300 group-hover:scale-110" 
                />
              </div>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors hidden lg:block">
                {tech.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
