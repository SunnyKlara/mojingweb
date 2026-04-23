import { setRequestLocale } from 'next-intl/server'
import { AnnouncementBar } from '@/components/site/announcement-bar'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import { Hero } from '@/components/site/hero'
import { CinematicScene } from '@/components/site/cinematic-scene'
import { PosterSlide } from '@/components/site/poster-slide'
import { MegaType } from '@/components/site/mega-type'
import { StatBand } from '@/components/site/stat-band'
import { SpecsTable } from '@/components/site/specs-table'
import { PackageContents } from '@/components/site/package-contents'
import { Warranty } from '@/components/site/warranty'
import { Buy } from '@/components/site/buy'
import { FAQ } from '@/components/site/faq'
import { CTA } from '@/components/site/cta'
import { BuySticky } from '@/components/site/buy-sticky'
import { JsonLd } from '@/components/seo/json-ld'

// ChatWidget is temporarily disabled — it requires the Socket.io backend which
// is not deployed yet. Re-enable by restoring the dynamic import + <ChatWidget /> below.
// const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false })

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <JsonLd locale={locale} />
      <AnnouncementBar />
      <NavBar />
      <main className="bg-black text-white">
        {/* 1. Cinematic hero — full-bleed product shot with bold copy overlay */}
        <Hero />

        {/* 2. Poetry breather — pure big Chinese type */}
        <MegaType
          eyebrow="Wind Chaser 64"
          zh="微观气流的隐秘形态，正突破固有认知的桎梏。"
          en="the shape of airflow, finally within reach."
        />

        {/* 3. Poster: 精准适配 1:64 车模 (image has Chinese copy baked in) */}
        <PosterSlide src="/brand/4.png" alt="精准适配您的爱车 · 适配 1:64 车模" />

        {/* 4. Big stat band */}
        <StatBand />

        {/* 5. Poster: 腔内体积 134×54×33mm */}
        <PosterSlide src="/brand/5.png" alt="腔内体积 134×54×33mm" />

        {/* 6. Poetry breather #2 */}
        <MegaType
          eyebrow="Aesthetic of Aerodynamics"
          zh="定义  气动美学。"
          en="Wind, visualized."
        />

        {/* 7. Poster: 全透明烟雾仓 30ml 长续航 */}
        <PosterSlide src="/brand/3.png" alt="全透明烟雾仓 · 30ml 长续航" />

        {/* 8. Cinematic: 您的下一件精品桌搭 (full-bleed, text baked) */}
        <CinematicScene src="/brand/6.png" alt="您的下一件精品桌搭" height="h-[60vh] md:h-[75vh]" />

        {/* 9. Poster: 外部尺寸 220×99×59mm */}
        <PosterSlide src="/brand/7.png" alt="Wind Chaser 64 经过精心设计 · 220×99×59mm" />

        {/* 10. Cinematic desk scene */}
        <CinematicScene src="/brand/8.png" alt="车模爱好者的工作台" height="h-[60vh] md:h-[75vh]" />

        {/* 11. Structured data sections */}
        <SpecsTable />
        <PackageContents />
        <Warranty />

        {/* 12. Poetry breather #3 + buy + FAQ + contact */}
        <MegaType
          eyebrow="保卫你的热爱"
          zh="科学的模样，从来不止一种。"
          en="Science has more than one shape."
        />

        <Buy />
        <FAQ />
        <CTA />
      </main>
      <BuySticky />
      <Footer />
      {/* <ChatWidget /> — disabled; see import comment above */}
    </>
  )
}
