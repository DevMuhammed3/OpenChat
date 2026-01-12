"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const messages = [
  { from: "other", text: "Welcome to OpenChat 👋" },
  { from: "other", text: "This is a zone demo" },
  { from: "me", text: "Looks clean 👀" },
  { from: "me", text: "Groups inside zones are 🔥" },
]

export default function PhoneDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0)
  const [typing, setTyping] = useState("")

  // show messages one by one
  useEffect(() => {
    if (visibleMessages < messages.length) {
      const t = setTimeout(() => {
        setVisibleMessages((v) => v + 1)
      }, 700)
      return () => clearTimeout(t)
    }
  }, [visibleMessages])

  // fake typing
  useEffect(() => {
    const text = "Typing in OpenChat..."
    let i = 0

    const interval = setInterval(() => {
      setTyping(text.slice(0, i))
      i++
      if (i > text.length) clearInterval(interval)
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-32 flex justify-center">
<motion.div
  initial={{ y: 100, opacity: 0, filter: "blur(10px)" }}
  whileInView={{ y: 0, opacity: 1, filter: "blur(0px)" }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  viewport={{ once: true }}
  className="
    relative
    w-[320px] h-[640px]
    rounded-[3rem]
    bg-zinc-950
    border-[6px] border-zinc-800
    shadow-[0_40px_120px_rgba(0,0,0,0.8)]
    overflow-hidden
  "
>
        {/* notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-zinc-900" />

        {/* header */}
        <div className="px-4 py-3 border-b border-white/10 text-sm font-medium">
          Zone: OpenChat Demo
        </div>

        {/* messages */}
        <div className="flex flex-col gap-2 p-3 h-[420px] overflow-hidden">
          {messages.slice(0, visibleMessages).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                max-w-[75%] px-3 py-2 rounded-xl text-sm
                ${
                  msg.from === "me"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground"
                }
              `}
            >
              {msg.text}
            </motion.div>
          ))}
        </div>

        {/* input */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
            <span className="opacity-80">
              {typing}
              <span className="animate-pulse">|</span>
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

