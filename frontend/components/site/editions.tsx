'use client'
import { useTranslations } from 'next-intl'
import { Check, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

type Edition = 'one' | 'pro'

function EditionCard({ id, featured }: { id: Edition; featured?: boolean }) {
  const t = useTranslations(`editions.items.${id}`)
  const features = (t.raw('features') as string[]) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`relative flex flex-col overflow-hidden rounded-3xl border p-8 md:p-10 ${
        featured
          ? 'bg-foreground text-background ring-primary ring-2'
          : 'bg-card text-card-foreground'
      }`}
    >
      {featured && (
        <span className="bg-primary text-primary-foreground absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest">
          {t('badge')}
        </span>
      )}
      <h3 className="text-display text-4xl font-bold">{t('name')}</h3>
      <p className={`mt-1 text-sm ${featured ? 'text-background/60' : 'text-muted-foreground'}`}>
        {t('tagline')}
      </p>
      <p className="nums mt-8 text-5xl font-semibold tracking-tight">{t('price')}</p>

      <ul className="mt-8 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                featured ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
              }`}
            >
              <Check className="h-3 w-3" />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        className={`mt-10 w-full rounded-full ${
          featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
        }`}
        variant={featured ? 'default' : 'outline'}
      >
        <a href="#contact">
          {t('cta')}
          <ArrowRight />
        </a>
      </Button>
    </motion.div>
  )
}

export function Editions() {
  const t = useTranslations('editions')
  return (
    <section id="editions" className="bg-secondary/40 py-24 md:py-32">
      <div className="container-wide">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-primary mb-3 text-[11px] font-medium uppercase tracking-[0.2em]">
            {t('eyebrow')}
          </p>
          <h2 className="text-display text-4xl font-bold tracking-tight md:text-6xl">
            {t('title')}
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <EditionCard id="one" />
          <EditionCard id="pro" featured />
        </div>
      </div>
    </section>
  )
}
