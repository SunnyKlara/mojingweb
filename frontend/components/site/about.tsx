import { Check } from 'lucide-react'
import { Section } from './section'

const bullets = [
  '专业的本地化团队',
  '覆盖 30+ 国家的合作网络',
  '全程跟踪服务与支持',
  '透明的合作机制',
  '丰富的跨境业务经验',
  '定制化的落地方案',
]

export function About() {
  return (
    <Section id="about" eyebrow="关于我们" title="深耕全球化服务 8 年">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-muted-foreground leading-relaxed">
            GlobalBridge 成立于 2016
            年，是一家专注于帮助中国企业开拓海外市场的专业服务机构。我们在欧洲、北美、东南亚等地区建立了广泛的合作网络。
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            团队核心成员均拥有 10
            年以上跨境业务经验，深刻理解不同市场的文化差异与商业规则，为客户提供真正落地的解决方案。
          </p>
        </div>
        <div className="bg-card rounded-2xl border p-6">
          <ul className="grid gap-3">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="bg-primary/15 text-primary mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
