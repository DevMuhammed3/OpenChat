"use client";

import { motion } from "framer-motion";
import { Zap, Globe, Lock } from "lucide-react";

export default function Screenshots() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Subtle Grid Pattern from Theme */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto px-6">
        <div className="text-center mb-20 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Designed for <span className="text-primary">seamless</span> workflows
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light leading-relaxed">
            OpenChat integrates perfectly into your daily routine with a clean 
            interface that stays out of your way.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Dashboard Preview - Consistent with Website Theme */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700">
              {/* Window Controls */}
              <div className="h-10 bg-muted/50 flex items-center px-6 gap-2 border-b">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              
              <div className="flex h-[400px]">
                {/* Clean Sidebar */}
                <div className="w-56 bg-muted/20 border-r p-6 space-y-8">
                  <div className="space-y-4">
                    <div className="h-2 w-16 bg-muted-foreground/20 rounded-full" />
                    <div className="space-y-2">
                       {[1, 2, 3].map(i => <div key={i} className={`h-8 w-full rounded-xl ${i === 1 ? 'bg-primary/10' : 'bg-transparent'}`} />)}
                    </div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <div className="h-2 w-12 bg-muted-foreground/10 rounded-full" />
                    <div className="flex flex-col gap-3">
                       {[1, 2].map(i => <div key={i} className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-muted" />
                         <div className="h-1.5 w-16 bg-muted rounded-full" />
                       </div>)}
                    </div>
                  </div>
                </div>

                {/* Main Area */}
                <div className="flex-1 bg-background p-8 space-y-6">
                  <div className="flex items-center justify-between mb-8">
                     <div className="h-4 w-32 bg-muted rounded-full" />
                     <div className="w-9 h-9 rounded-full bg-muted" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="h-32 bg-card border rounded-2xl p-4 flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10" />
                        <div className="w-1/2 h-2 bg-muted rounded" />
                     </div>
                     <div className="h-32 bg-card border rounded-2xl p-4 flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10" />
                        <div className="w-1/2 h-2 bg-muted rounded" />
                     </div>
                  </div>
                  <div className="h-32 bg-card border rounded-2xl p-4">
                     <div className="space-y-3">
                        <div className="h-2 w-1/3 bg-muted rounded" />
                        <div className="h-2 w-full bg-muted/50 rounded" />
                        <div className="h-2 w-2/3 bg-muted/50 rounded" />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature List */}
          <div className="space-y-12">
            {[
              { icon: Lock, color: "text-primary", title: "Secure by Default", desc: "Every message is encrypted with state-of-the-art P2P protocols before it leaves your machine." },
              { icon: Globe, color: "text-primary", title: "Always Online", desc: "Our decentralized edge network ensures that your messages are available whenever and wherever you need them." },
              { icon: Zap, color: "text-primary", title: "Zero Latency", desc: "Experience the fastest messaging ever built, with real-time sync that actually feels real-time." }
            ].map((f, i) => (
              <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center ${f.color} mb-6`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
