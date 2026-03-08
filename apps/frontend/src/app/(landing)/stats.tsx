"use client"

import { motion } from "framer-motion"

const stats = [
  {
    value: "99.9%",
    label: "Guaranteed Uptime",
  },
  {
    value: "< 50ms",
    label: "Message Latency",
  },
  {
    value: "AES-256",
    label: "Encryption Standard",
  },
  {
    value: "100%",
    label: "Open Source",
  },
]

export default function Stats() {
  return (
    <section
      id="stats"
      className="relative py-24 px-6 overflow-hidden bg-background"
    >
      {/* subtle glow */}

      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="
                group
                rounded-xl
                backdrop-blur
                p-6
                transition-all
              "
            >
              {/* number */}
              <div
                className="
                  text-4xl lg:text-5xl font-bold
                  text-foreground
                  bg-clip-text
                  duration-300
                  group-hover:scale-105
                "
              >
                {stat.value}
              </div>

              {/* label */}
              <p className="mt-3 text-sm text-muted-foreground">
                {stat.label}
              </p>

              {/* bottom hover glow */}
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  )
}
