"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "packages/ui";

export default function CTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="py-32 px-4 relative overflow-hidden"
    >
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">
          Create zones, organize groups, and chat instantly
        </h2>

        <p className="text-muted-foreground mb-8">
          Build your own zones, invite friends, and start real-time conversations.
        </p>

<Button asChild size="lg">
  <Link href="/auth">
    Get Started
  </Link>
</Button>
      </div>
    </motion.section>
  );
}
