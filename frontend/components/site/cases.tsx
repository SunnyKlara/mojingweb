'use client'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { Section } from './section'

const cases = [
  {
    name: '某制造企业',
    industry: '工业设备',
    result: '6 个月内成功进入欧洲市场，签约代理商 12 家，年销售额突破千万。',
  },
  {
    name: '某科技公司',
    industry: 'SaaS',
    result: '通过我们的资源对接，完成首轮海外融资，估值提升 3 倍。',
  },
  {
    name: '某消费品品牌',
    industry: '消费电子',
    result: '东南亚市场年销售额增长 300%，成为区域头部品牌之一。',
  },
]

export function Cases() {
  return (
    <Section
      id="cases"
      eyebrow="成功案例"
      title="他们选择了我们"
      description="真实的客户故事，真实的业务增长。"
      centered
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cases.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="bg-card hover:border-primary/40 group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-md"
          >
            <Quote className="text-primary/10 absolute right-6 top-6 h-10 w-10" />
            <div className="relative">
              <div className="text-primary mb-2 text-xs uppercase tracking-wider">{c.industry}</div>
              <div className="mb-4 text-lg font-semibold">{c.name}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">{c.result}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
