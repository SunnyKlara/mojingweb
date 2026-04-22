'use client'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import {
  Globe2,
  Handshake,
  PackageSearch,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Section } from './section'

const ITEMS: { key: string; icon: LucideIcon }[] = [
  { key: 'market', icon: Globe2 },
  { key: 'partners', icon: Handshake },
  { key: 'supply', icon: PackageSearch },
  { key: 'compliance', icon: ShieldCheck },
  { key: 'growth', icon: TrendingUp },
  { key: 'team', icon: Users },
]

export function Features() {
  const t = useTranslations('features')
  return (
    <Section
      id="services"
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      centered
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <Card className="hover:border-primary/40 h-full transition-all hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-3 grid h-10 w-10 place-items-center rounded-lg">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{t(`items.${f.key}.title`)}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(`items.${f.key}.desc`)}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
