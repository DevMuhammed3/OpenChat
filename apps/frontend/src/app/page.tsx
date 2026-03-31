import dynamic from 'next/dynamic'
import Hero from './(landing)/Hero'
import Navbar from 'packages/ui/ui/Navbar'
import { getCurrentUser } from '@/lib/getCurrentUser'

const Features = dynamic(() => import('./(landing)/Features'), { ssr: true })
const TrustedBy = dynamic(() => import('./(landing)/TrustedBy'), { ssr: true })
const Stats = dynamic(() => import('./(landing)/stats'), { ssr: true })
const Testimonials = dynamic(() => import('./(landing)/Testimonials'), { ssr: true })
const HowItWorks = dynamic(() => import('./(landing)/HowItWorks'), { ssr: true })
const Architecture = dynamic(() => import('./(landing)/Architecture'), { ssr: true })
const FAQ = dynamic(() => import('./(landing)/faq'), { ssr: true })
const CTA = dynamic(() => import('./(landing)/CTA'), { ssr: true })
const Footer = dynamic(() => import('./(landing)/Footer'), { ssr: true })

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="dark min-h-screen bg-background selection:bg-primary/30">
      <Navbar user={user} />

      <main>
        <Hero />
        <TrustedBy />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        {/* <Architecture /> */}
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  )
}
