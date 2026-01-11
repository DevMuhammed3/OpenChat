"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./button";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mt-4 flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-background/60 backdrop-blur">
          <Link href="/" className="pl-4 text-lg font-bold">
            OpenChat
          </Link>

          <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
          </nav>

<Button asChild size="sm">
  <Link href="/auth">Get Started</Link>
</Button>
        </div>
      </div>
    </motion.header>
  );
}

