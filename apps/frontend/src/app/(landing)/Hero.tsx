'use client'

import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'packages/ui'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/app/stores/user-store'

/*  TEXT TYPING  */
const words = ['Powerful', 'Simple', 'Private']


type Message = {
  id: number
  from: 'me' | 'other'
  text?: string
  link?: {
    label: string
    href: string
  }
}

type ChatMessageProps = {
  from: 'me' | 'other'
  text?: string
  link?: {
    label: string
    href: string
  }
}

type TypingIndicatorProps = {
  from: 'me' | 'other'
}

const TYPING_SPEED = 80
const DELETING_SPEED = 50
const HOLD_AFTER_TYPE = 1200

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState<null | 'me' | 'other'>(null)

  const SCRIPT: Message[] = [
    { id: 1, from: 'me', text: 'I want Discord but simpler 😩' },
    { id: 2, from: 'other', text: "That's exactly what this is." },
    { id: 3, from: 'me', text: 'And private? No phone number?' },
    { id: 4, from: 'other', text: 'Open source. No ads. No tracking.' },
    { id: 5, from: 'me', text: 'Just sign up and go 🚀' },
    { id: 6, from: 'other', text: 'Join', link: { label: 'OpenChat', href: '/auth' } },
  ]


  useEffect(() => {
    let index = 0
    let cancelled = false

    const play = () => {
      if (cancelled || index >= SCRIPT.length) return

      const next = SCRIPT[index]
      setTyping(next.from)

      setTimeout(() => {
        if (cancelled) return

        setVisibleMessages((prev) => [...prev, next])
        setTyping(null)
        index++

        setTimeout(play, 900)
      }, 600)
    }

    play()
    return () => {
      cancelled = true
    }
  }, [])


  useEffect(() => {
    const currentWord = words[wordIndex]
    let timeout: NodeJS.Timeout

    if (!isDeleting) {
      if (charIndex < currentWord.length) {
        timeout = setTimeout(
          () => setCharIndex((c) => c + 1),
          TYPING_SPEED
        )
      } else {
        timeout = setTimeout(() => setIsDeleting(true), HOLD_AFTER_TYPE)
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(
          () => setCharIndex((c) => c - 1),
          DELETING_SPEED
        )
      } else {
        setIsDeleting(false)
        setWordIndex((i) => (i + 1) % words.length)
      }
    }

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, wordIndex])

  return (
    <section
      className="
            flex items-center justify-center
            min-h-[100vh]
            lg:min-h-screen
            pt-32 px-6
          "
    >
      {/* Glow Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="
    absolute 
    top-1/3 right-1/4
    w-[250px] h-[260px]
    md:w-[400px] md:h-[400px]
    bg-purple-600/20
    blur-[120px] md:blur-[150px]
    rounded-full
  " />

        <div className="
    hidden md:block
    absolute 
    bottom-1/4 left-1/4
    w-[500px] h-[500px]
bg-gradient-to-r from-cyan-500/30 to-transparent
    blur-[160px]
    rounded-full
  " />
      </div>
      <div
        className="
                flex flex-col lg:flex-row items-center
                max-w-6xl w-full
                gap-20
              "
      >
        {/*  TEXT  */}
        <div
          className="
                    flex-1
                    text-center lg:text-left
                  "
        >
          <h1
            className="
                        mb-4
                        text-2xl
                        lg:text-4xl font-bold leading-tight
                      "
          >
            Chat that's{' '}
            <span
              className="
                            text-purple-500
                          "
            >
              {words[wordIndex].slice(0, charIndex)}
              <span
                className="
                                animate-pulse
                              "
              >
                |
              </span>
            </span>
          </h1>

          <p
            className="
                        max-w-xl
                        mb-8
                        text-muted-foreground
                      "
          >
            Channels, groups, and private chats — all in one app. Open source, no ads, no phone number needed
          </p>

          <Button asChild size="lg" className="px-8 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 border-0">
            <Link href={useUserStore.getState().user ? "/dashboard" : "/auth"}>
              {useUserStore.getState().user ? "Go to Dashboard" : "Get Started"}
            </Link>
          </Button>
        </div>

        {/*  PHONE  */}
        <div
          className="
          hidden
          flex-1 lg:flex justify-center
                  "
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
                        relative
                        w-[320px] h-[640px]
                        p-2
                        bg-gradient
                        rounded-[3rem] 
                      bg-zinc-900/80
                        border border-white/10
                        shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]
            "
          >
            {/*  iPhone 14 Pro Dynamic Island  */}
            <div
              className="
                            absolute top-2 left-1/2 z-20
                            -translate-x-1/2
                          "
            >
              <div
                className="
                                relative flex items-center
                                h-7 w-[110px]
                                mt-4 p-2
                                bg-black
                                rounded-full
                                shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),inset_0_-4px_8px_rgba(0,0,0,0.9)]
                              "
              >
                {/* Camera (right circle) */}
                <div
                  className="
                                    absolute right-3
                                    h-2.5 w-2.5
                                    bg-zinc-900
                                    rounded-full ring-2 ring-zinc-700
                                  "
                />

                {/* Speaker / sensor bar */}
                <div
                  className="
                                    absolute left-6
                                    h-1.5 w-12
                                    bg-zinc-800
                                    rounded-full
                                  "
                />
              </div>
            </div>

            {/*  SCREEN  */}

            <div
              className="
                            absolute inset-3 flex flex-col
                            p-4 pt-14
                            text-sm text-white
                            rounded-[2rem] border border-white/10
                            backdrop-blur-xl
bg-gradient-to-br from-[#061326]/60 via-[#130626]/50 to-[#070430]/50
    shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]
                          "
            >

              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                      alt="Avatar"
                      className="w-8 h-8 rounded-full bg-purple-500/20 border border-white/10"
                    />
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">Alex Rivera</p>
                    <p className="text-[9px] text-emerald-500/80 font-medium mt-1">Online</p>
                  </div>
                </div>

                <button className="p-1 hover:bg-white/5 rounded-full transition-colors">
                  <Info className="text-white/30 hover:text-white/60" size={16} />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-end gap-2">
                {visibleMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ChatMessage
                      from={msg.from}
                      text={msg.text}
                      link={msg.link}
                    />
                  </motion.div>
                ))}

                {typing && <TypingIndicator from={typing} />}
              </div>

              {/* Input */}
              <div
                className="
                                mt-3 px-4 py-2
                                text-xs text-white/40
                                bg-white/10
                                rounded-full
                              "
              >
                Message…
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ChatMessage({ from, text, link }: ChatMessageProps) {
  const isMe = from === 'me'

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && (
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
          className="w-6 h-6 rounded-full bg-zinc-800 mb-1"
          alt="User"
        />
      )}

      <div
        className={`
          min-w-fit max-w-[80%] px-3 py-2 rounded-2xl text-[12px] leading-snug
          ${isMe
            ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20'
            : 'bg-zinc-800/80 text-zinc-100 rounded-bl-none'}
        `}
      >
        {text && <span>{text}</span>}
        {link && (
          <Link href={link.href} className="px-1 mt-1 font-bold text-purple-400 underline decoration-2">
            {link.label}
          </Link>
        )}
      </div>
    </div>
  )
}

function TypingIndicator({ from }: TypingIndicatorProps) {
  const isMe = from === 'me'

  return (
    <div
      className={`
        max-w-[20%] px-3 py-2 rounded-xl
        flex gap-1 items-center
        ${isMe
          ? 'ml-auto bg-purple-400'
          : 'bg-zinc-800'}
      `}
    >
      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-100" />
      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-200" />
    </div>
  )
}

