"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "packages/ui"

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
    <section id="faq" className="relative py-24 px-6 overflow-hidden bg-[#020617]">
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
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-zinc-800/60 py-2"
              >
                <AccordionTrigger className="text-left text-lg font-medium text-zinc-100 md:hover:text-[#999BE4] transition-colors hover:no-underline">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="text-zinc-400 text-base leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
