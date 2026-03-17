"use client"

import Hero from "./(landing)/Hero"
import Features from "./(landing)/Features"
import HowItWorks from "./(landing)/HowItWorks"
import Navbar from "packages/ui/ui/Navbar"
import Footer from "./(landing)/Footer"
import FAQ from "./(landing)/faq"
import { useUserStore } from "./stores/user-store"

export default function Home() {
  const user = useUserStore(s => s.user)

  return (
    <>
      <Navbar user={user} />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <Footer />
    </>
  )
}
