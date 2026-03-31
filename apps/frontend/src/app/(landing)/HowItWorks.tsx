"use client";

import { motion, Variants } from "framer-motion";
import { UserPlus, MessageSquare, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    title: "Quick Signup",
    description: "Create an account in less than 30 seconds. No phone number or credit card required.",
    icon: UserPlus,
    color: "from-purple-500 to-indigo-500"
  },
  {
    title: "Instant Connection",
    description: "Join channels or start private chats with lightning-fast real-time synchronization.",
    icon: MessageSquare,
    color: "from-cyan-500 to-blue-500"
  },
  {
    title: "Stay Secure",
    description: "Communicate with peace of mind. Your data is encrypted and you own your identity.",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-500"
  },
]

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 text-center"
          >
            Communication in <span className="text-gradient">3 simple steps</span>
          </motion.h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
        >
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                variants={item}
                className="relative z-10 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} p-0.5 mb-8 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-white/5`}>
                    <div className="w-full h-full bg-[#0b1220] rounded-[22px] flex items-center justify-center text-white">
                      <Icon size={32} />
                    </div>
                  </div>

                  <div className="absolute top-0 right-0 md:-right-6 text-6xl font-black text-white/5 select-none transition-colors group-hover:text-white/10">
                    0{index + 1}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all">
                    {step.title}
                  </h3>

                  <p className="text-zinc-400 leading-relaxed font-light px-4">
                    {step.description}
                  </p>
                  
                  {index < steps.length - 1 && (
                    <div className="md:hidden my-8">
                       <ArrowRight className="rotate-90 text-zinc-800" size={32} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

