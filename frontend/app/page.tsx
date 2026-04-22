import dynamic from 'next/dynamic'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { Hero } from '@/components/site/hero'
import { LogoCloud } from '@/components/site/logo-cloud'
import { About } from '@/components/site/about'
import { Features } from '@/components/site/features'
import { Stats } from '@/components/site/stats'
import { Cases } from '@/components/site/cases'
import { FAQ } from '@/components/site/faq'
import { CTA } from '@/components/site/cta'

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false })

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <LogoCloud />
        <About />
        <Features />
        <Stats />
        <Cases />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
