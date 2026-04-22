import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Section } from './section'

const faqs = [
  {
    q: '服务周期一般多长？',
    a: '根据目标市场和业务类型不同，一般从 3 个月的市场调研到 12 个月以上的深度落地，我们会在启动前给出明确的时间规划。',
  },
  {
    q: '服务费用如何计算？',
    a: '采用「基础服务费 + 成效分成」的混合模式，我们和客户目标绑定。具体方案基于项目复杂度和资源投入评估。',
  },
  {
    q: '你们主要服务哪些行业？',
    a: '工业制造、消费品、消费电子、跨境 SaaS 是我们的核心经验领域，也欢迎其他行业的企业沟通，我们会根据资源匹配度决定是否承接。',
  },
  {
    q: '如何保障客户资料安全？',
    a: '所有沟通记录、客户资料均加密存储，访问受 SSO 与审计日志管控。签署正式合作协议前可提供保密协议 (NDA)。',
  },
  {
    q: '能否只购买单项服务（如供应链）？',
    a: '可以。我们支持模块化采购，也可在合作过程中按需增补服务。',
  },
]

export function FAQ() {
  return (
    <Section id="faq" eyebrow="常见问题" title="你可能关心的" centered>
      <div className="mx-auto max-w-2xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
