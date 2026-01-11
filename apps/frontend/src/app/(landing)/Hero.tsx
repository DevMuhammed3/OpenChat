"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "packages/ui";

export default function Hero() {
  return (
    <section className="min-h-screen pt-32 flex items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl"
      >
        <h1 className="text-5xl font-bold mb-4">
          OpenChat
        </h1>

        <p className="text-muted-foreground mb-8">
          Create zones, organize groups, and chat with your community in real time.
        </p>

<div className="flex justify-center gap-4">
  <Button asChild size="lg">
    <Link href="/auth">Get Started</Link>
  </Button>
</div>
      </motion.div>
    </section>
  );
}
