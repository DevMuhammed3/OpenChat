'use client'

import { motion } from 'framer-motion'
import { Github, ArrowRight, Zap, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'packages/ui'

export default function CTA() {
  return (
    <section className="py-32 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(120,80,255,0.15),transparent)]" />
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
            <Zap size={14} />
            <span>Get started in under 2 minutes</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Ready to build your <br />
            <span className="high-perf-gradient">community?</span>
          </h2>

          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Join thousands of developers and teams who have already made the switch to OpenChat. 
            Self-host or use our cloud — your choice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-2xl shadow-primary/10 border-0">
              <Link href="/auth">
                Start Building Free
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-sm">
              <Link href="https://github.com/DevMuhammed3/OpenChat" target="_blank">
                <Github size={18} className="mr-2" />
                Star on GitHub
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-zinc-500 text-xs">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              <span>Free forever for self-hosting</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
