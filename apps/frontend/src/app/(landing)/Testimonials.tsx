'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Product Manager',
    role: 'SaaS Team',
    avatar: 'PM',
    content: 'OpenChat delivers a clean and focused communication experience. The zone-based structure feels natural, and the overall performance is smooth even during active usage. It’s a strong foundation for modern teams.',
    rating: 5,
  },
  {
    name: 'Full Stack Developer',
    role: 'Tech Team',
    avatar: 'FS',
    content: 'The UI is well thought out and easy to navigate. Voice interactions feel responsive, and the product direction is clear. With continued development, this can easily compete with established tools.',
    rating: 5,
  },
  {
    name: 'Community Builder',
    role: 'Online Community',
    avatar: 'CB',
    content: 'What stands out is the simplicity and structure. OpenChat removes a lot of the noise you get in other platforms and replaces it with a more organized, scalable approach to communication.',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-xs font-bold uppercase tracking-widest mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              Loved by developers & communities
            </h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">
              Join thousands of teams who have made the switch to OpenChat.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm group hover:border-white/10 transition-colors"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-cyan-500/40 flex items-center justify-center text-xs font-bold text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-zinc-500 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
