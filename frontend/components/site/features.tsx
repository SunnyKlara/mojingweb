'use client'
import { motion } from 'framer-motion'
import { Globe2, Handshake, PackageSearch, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Section } from './section'

const features = [
  {
    icon: Globe2,
    title: '海外市场拓展',
    desc: '协助企业进入欧美、东南亚等海外市场，提供本地化运营策略与资源对接。',
  },
  {
    icon: Handshake,
    title: '代理商合作',
    desc: '全球代理商招募与管理，构建稳定的分销网络，快速扩大市场覆盖。',
  },
  {
    icon: PackageSearch,
    title: '供应链整合',
    desc: '整合优质供应商资源，提供从采购到交付的一站式供应链解决方案。',
  },
  {
    icon: ShieldCheck,
    title: '合规与风控',
    desc: '熟悉目标市场法规，帮助企业规避出海风险，保障业务合规稳健。',
  },
  {
    icon: TrendingUp,
    title: '增长策略咨询',
    desc: '数据驱动的海外增长路径规划，从定位到落地的全链路服务。',
  },
  {
    icon: Users,
    title: '本地团队支持',
    desc: '覆盖 30+ 国家的本地顾问团队，随时响应您的业务需求。',
  },
]

export function Features() {
  return (
    <Section
      id="services"
      eyebrow="我们的服务"
      title="全方位出海解决方案"
      description="从市场调研到落地运营，覆盖企业全球化的每个关键环节。"
      centered
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
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
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription className="leading-relaxed">{f.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
