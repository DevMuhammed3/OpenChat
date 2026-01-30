"use client";

import { motion, type Variants } from "framer-motion";
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Group,
} from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.35,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};


const features = [
  {
    title: "Real-time Chat",
    description:
      "Instant messaging powered by WebSockets for smooth conversations.",
    icon: MessageSquare,
  },
  {
    title: "Zones & Groups",
    description:
      "Create zones and organize conversations into groups with ease.",
    icon: Group,
  },
  {
    title: "Secure",
    description:
      "Authentication, authorization, and protected APIs by design.",
    icon: ShieldCheck,
  },
  {
    title: "Fast & Scalable",
    description:
      "Optimized architecture that scales with growing communities.",
    icon: Zap,
  },
];

export default function Features() {
  return (
    <motion.section
      id="features"
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="py-24 px-4 max-w-6xl mx-auto"
    >
      <h2 className="text-4xl font-bold text-center mb-12">
        Why OpenChat?
      </h2>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-background/80 p-6 hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-xl font-semibold mb-2">
                {feature.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

