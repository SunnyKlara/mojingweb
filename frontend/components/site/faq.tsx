'use client'
import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Section } from './section'

const KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const

export function FAQ() {
  const t = useTranslations('faq')
  return (
    <Section id="faq" eyebrow={t('eyebrow')} title={t('title')} centered>
      <div className="mx-auto max-w-2xl">
        <Accordion type="single" collapsible className="w-full">
          {KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-left">{t(`items.${key}.q`)}</AccordionTrigger>
              <AccordionContent className="leading-relaxed">{t(`items.${key}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
