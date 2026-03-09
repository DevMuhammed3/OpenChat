"use client";

import { motion, Variants } from "framer-motion";
import { UserPlus, MessageCircle, Podcast } from "lucide-react";

const steps = [
  {
    title: "Create Your Account",
    description: "No phone number needed. Sign up with email in seconds — free forever.",
    icon: UserPlus,
  },
  {
    title: "Start Chatting",
    description: "Message anyone privately, or jump into group conversations instantly.",
    icon: MessageCircle,
  },
  {
    title: "Build Your Community",
    description: "Create your own space with channels and groups — like Discord, but simpler.",
    icon: Podcast,
  },
]

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

export default function HowItWorks() {
  return (
    <motion.section
      id="how-it-works"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="py-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-12">
          How It Works
        </h2>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (

              <motion.div
                key={step.title}
                variants={item}
                className="
    relative rounded-2xl
    border border-white/10
    bg-background
    p-6
    text-center
  "
              >

                <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </span>

                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            );
          })}

        </div >
      </div >
    </motion.section >
  );
}

