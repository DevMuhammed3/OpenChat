"use client"

import { motion } from "framer-motion"

const faqs = [
  {
    question: "Is OpenChat really free? What's the catch?",
    answer:
      "No catch. OpenChat is 100% free and open-source. We don't sell your data, show ads, or charge hidden fees. The code is public — you can verify everything yourself.",
  },
  {
    question: "Do I need a phone number to sign up?",
    answer:
      "Nope. Just an email address. We don't ask for your phone number, real name, or any personal info you're not comfortable sharing.",
  },
  {
    question: "Can I create a community like a Discord server?",
    answer:
      "Yes. You can create your own space with multiple channels and groups, invite people, and manage everything — all from your phone.",
  },
  {
    question: "Who can read my messages?",
    answer:
      "Only you and the people you're talking to. Not us, not advertisers, not anyone. Your conversations are encrypted and private by default.",
  },
  {
    question: "Can I use OpenChat on my phone?",
    answer:
      "Yes. OpenChat is designed mobile-first — fast, simple, and works great on any device.",
  },
  {
    question: "How is OpenChat different from WhatsApp or Telegram?",
    answer:
      "WhatsApp is owned by Meta and collects your data. Telegram stores messages on their servers. OpenChat is open-source, has no ads, requires no phone number, and gives you full control over your privacy.",
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="relative py-32 px-6 overflow-hidden h-[100vh]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="max-w-3xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Everything you need to know about OpenChat, privacy, and how it works under the hood.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-left text-lg font-medium text-zinc-100 transition-colors group-open:text-[#999BE4]">
                {faq.question}
              </summary>
              <p className="pt-3 text-base leading-relaxed text-zinc-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center text-sm text-zinc-500"
        >
        </motion.div>
      </div>
    </section >
  )
}
