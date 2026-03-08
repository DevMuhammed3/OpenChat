import Hero from "./(landing)/Hero"
import Features from "./(landing)/Features"
import HowItWorks from "./(landing)/HowItWorks"
import Navbar from "packages/ui/ui/Navbar"
// import CTA from "./(landing)/CTA"
import Footer from "./(landing)/Footer"
// import Stats from "./(landing)/stats"
import FAQ from "./(landing)/faq"
// import Contact from "./(landing)/contact"
// import PhoneDemo from "./(landing)/PhoneDemo"

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <Footer />
    </>
  )
  //<PhoneDemo />
}
