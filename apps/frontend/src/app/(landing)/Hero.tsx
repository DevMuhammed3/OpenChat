'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from 'packages/ui'
import { useEffect, useState } from 'react'

/* ================= TEXT TYPING ================= */
const words = ['Private Chats', 'Secure Communities', 'Real-Time Conversations']

const TYPING_SPEED = 80
const DELETING_SPEED = 50
const HOLD_AFTER_TYPE = 1200

export default function Hero() {
    const [wordIndex, setWordIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

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
            min-h-screen
            pt-32 px-6
          "
        >
            <div
                className="
                flex flex-col lg:flex-row items-center
                max-w-6xl w-full
                gap-20
              "
            >
                {/* ================= TEXT ================= */}
                <div
                    className="
                    flex-1
                    text-center lg:text-left
                  "
                >
                    <h1
                        className="
                        mb-4
                        text-5xl font-bold leading-tight
                      "
                    >
                        OpenChat for{' '}
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
                        Create private zones, organize groups, and chat with
                        your community in real time — fully encrypted and built
                        for privacy.
                    </p>

                    <Button asChild size="lg">
                        <Link href="/auth">Get Started</Link>
                    </Button>
                </div>

                {/* ================= PHONE ================= */}
                <div
                    className="
                    flex-1 flex justify-center
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
                        rounded-[3rem] border border-white/20
                        shadow-[0_40px_120px_rgba(0,0,0,0.6)]
                      "
                    >
                        {/* ===== iPhone 14 Pro Dynamic Island ===== */}
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

                        {/* ===== SCREEN ===== */}

                        <div
                            className="
                            absolute inset-3 flex flex-col
                            p-4 pt-14
                            text-sm text-white
                            bg-white/5 bg-gradient-to-br from-background
                            rounded-[2rem] border border-white/10
                            backdrop-blur-xl
                          "
                        >
                            {/* Messages */}
                            <div
                                className="
                                flex-1 flex flex-col justify-end
                                gap-2
                              "
                            >
                                <div
                                    className="
                                    max-w-[80%]
                                    px-3 py-2
                                    bg-zinc-800
                                    rounded-xl
                                  "
                                >
                                    hey... are you available?
                                </div>

                                <div
                                    className="
                                    max-w-[80%]
                                    px-3 py-2
                                    bg-zinc-800
                                    rounded-xl
                                  "
                                >
                                    this is a private zone
                                </div>

                                <div
                                    className="
                                    max-w-[80%]
                                    ml-auto px-3 py-2
                                    text-black
                                    bg-cyan-400
                                    rounded-xl
                                  "
                                >
                                    yes 👍
                                </div>

                                <div
                                    className="
                                    max-w-[80%]
                                    ml-auto px-3 py-2
                                    text-black
                                    bg-cyan-400
                                    rounded-xl
                                    shadow
                                  "
                                >
                                    end-to-end & realtime
                                </div>
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
