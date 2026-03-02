'use client'

import Link from 'next/link'
import { Github, Linkedin, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full mt-32 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-20">

        {/* Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-white/60">

          <div className="flex gap-6">
            <Link href="#features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-white transition">
              How It Works
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
          </div>

          <div className="flex gap-5">
            <Link
              href="https://github.com/DevMuhammed3/OpenChat"
              target="_blank"
              className="hover:text-white transition">
              <Github size={18} />
            </Link>

            {/*
            <Link href="#" className="hover:text-white transition">
              <Linkedin size={18} />
            </Link>
            <Link href="#" className="hover:text-white transition">
              <Twitter size={18} />
            </Link>
              */}

          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 text-xs text-white/40 text-center">
          © {new Date().getFullYear()} OpenChat — Built for privacy.
        </div>
      </div>
    </footer>
  )
}
