"use client";

import { motion } from "framer-motion";
import { UserPlus, MessageCircle, Podcast} from "lucide-react";

const steps = [
  {
    title: "Create Account",
    description: "Sign up in seconds and get instant access.",
    icon: UserPlus,
  },
  {
    title: "Start Chatting",
    description: "Join rooms or start private conversations.",
    icon: MessageCircle,
  },
  {
    title: "Create or Join Zones",
    description:
      "Join existing zones or create your own and start chatting in groups.",
    icon: Podcast,
  }
];

export default function HowItWorks() {
  return (
    <motion.section
      id="how-it-works"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative rounded-2xl border border-white/10 bg-background/60 backdrop-blur p-6 text-center"
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
        </div>
      </div>
    </motion.section>
  );
}

