import dynamic from 'next/dynamic'
import Navbar from 'packages/ui/ui/Navbar'
import { getCurrentUser } from '@/lib/getCurrentUser'

const Hero = dynamic(() => import('./(landing)/Hero'))
const Features = dynamic(() => import('./(landing)/Features'))
const TechStack = dynamic(() => import('./(landing)/TechStack'))
const FAQ = dynamic(() => import('./(landing)/faq'))
const CTA = dynamic(() => import('./(landing)/CTA'))
const Footer = dynamic(() => import('./(landing)/Footer'))

export default async function LandingPage() {
    const user = await getCurrentUser()

    return (
        <div className="dark min-h-screen bg-background selection:bg-primary/30">
            <Navbar user={user} />

            <main>
                <Hero />
                <Features />
                <TechStack />
                <FAQ />
                <CTA />
            </main>
            <Footer />
        </div>
    )
}
