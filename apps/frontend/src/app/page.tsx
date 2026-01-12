// import { redirect } from "next/navigation"
import Hero from "./(landing)/Hero"
import Features from "./(landing)/Features"
import HowItWorks from "./(landing)/HowItWorks"
import Navbar from "packages/ui/ui/Navbar"
import CTA from "./(landing)/CTA"
// import PhoneDemo from "./(landing)/PhoneDemo"

export default function Home() {
  return(
  <>
  <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
     <CTA />
  </>
  )
  //<PhoneDemo />
  // redirect("/auth")
}
