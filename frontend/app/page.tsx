import ChatWidget from '@/components/ChatWidget'

const services = [
  {
    icon: '🌐',
    title: '海外市场拓展',
    desc: '协助企业进入欧美、东南亚等海外市场，提供本地化运营策略与资源对接。',
  },
  {
    icon: '🤝',
    title: '代理商合作',
    desc: '全球代理商招募与管理，构建稳定的分销网络，快速扩大市场覆盖。',
  },
  {
    icon: '📦',
    title: '供应链整合',
    desc: '整合优质供应商资源，提供从采购到交付的一站式供应链解决方案。',
  },
]

const stats = [
  { value: '500+', label: '合作企业' },
  { value: '30+', label: '覆盖国家' },
  { value: '8年', label: '行业经验' },
  { value: '98%', label: '客户满意度' },
]

const cases = [
  { name: '某制造企业', result: '6个月内成功进入欧洲市场，签约代理商12家' },
  { name: '某科技公司', result: '通过我们的资源对接，完成首轮海外融资' },
  { name: '某消费品品牌', result: '东南亚市场年销售额增长300%' },
]

export default function Home() {
  return (
    <main className="text-gray-800">
      {/* 导航 */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/90 px-8 py-4 backdrop-blur">
        <span className="text-xl font-bold text-blue-600">GlobalBridge</span>
        <div className="hidden gap-8 text-sm text-gray-600 md:flex">
          <a href="#about" className="transition-colors hover:text-blue-600">
            关于我们
          </a>
          <a href="#services" className="transition-colors hover:text-blue-600">
            服务
          </a>
          <a href="#cases" className="transition-colors hover:text-blue-600">
            案例
          </a>
          <a href="#contact" className="transition-colors hover:text-blue-600">
            联系我们
          </a>
        </div>
        <a
          href="#contact"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
        >
          免费咨询
        </a>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-white px-4 py-36 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#3b82f6_1px,_transparent_1px)] bg-[size:32px_32px] opacity-5" />
        <span className="relative mb-4 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600">
          专注 B2B 全球化服务
        </span>
        <h1 className="relative mb-6 max-w-2xl text-5xl font-bold leading-tight">
          连接全球市场
          <br />
          助力企业出海
        </h1>
        <p className="relative mb-10 max-w-lg text-lg text-gray-500">
          我们为中国企业提供专业的海外市场拓展、代理商合作与供应链整合服务，让您的业务快速走向世界。
        </p>
        <div className="relative flex gap-4">
          <a
            href="#contact"
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            立即咨询
          </a>
          <a
            href="#cases"
            className="rounded-xl border border-gray-200 px-6 py-3 transition-colors hover:bg-gray-50"
          >
            查看案例
          </a>
        </div>
      </section>

      {/* 数据 */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-8 text-center md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="mb-1 text-4xl font-bold">{s.value}</div>
              <div className="text-sm text-blue-200">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 关于我们 */}
      <section id="about" className="mx-auto max-w-4xl px-8 py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="text-sm text-blue-600">关于我们</span>
            <h2 className="mb-4 mt-2 text-3xl font-bold">深耕全球化服务 8 年</h2>
            <p className="mb-4 leading-relaxed text-gray-600">
              GlobalBridge 成立于 2016
              年，是一家专注于帮助中国企业开拓海外市场的专业服务机构。我们在欧洲、北美、东南亚等地区建立了广泛的合作网络。
            </p>
            <p className="leading-relaxed text-gray-600">
              团队核心成员均拥有 10
              年以上跨境业务经验，深刻理解不同市场的文化差异与商业规则，为客户提供真正落地的解决方案。
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-8">
            {[
              '专业的本地化团队',
              '覆盖 30+ 国家的合作网络',
              '全程跟踪服务与支持',
              '透明的合作机制',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
                  ✓
                </span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务 */}
      <section id="services" className="bg-gray-50 px-8 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="text-sm text-blue-600">我们的服务</span>
            <h2 className="mt-2 text-3xl font-bold">全方位出海解决方案</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 text-3xl">{s.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 案例 */}
      <section id="cases" className="mx-auto max-w-4xl px-8 py-24">
        <div className="mb-12 text-center">
          <span className="text-sm text-blue-600">成功案例</span>
          <h2 className="mt-2 text-3xl font-bold">他们选择了我们</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl border p-6 transition-colors hover:border-blue-200"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                {c.name[1]}
              </div>
              <p className="mb-2 font-medium">{c.name}</p>
              <p className="text-sm text-gray-500">{c.result}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 联系 */}
      <section id="contact" className="bg-blue-50 px-8 py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="text-sm text-blue-600">联系我们</span>
          <h2 className="mb-4 mt-2 text-3xl font-bold">准备好开始了吗？</h2>
          <p className="mb-8 text-gray-500">
            点击右下角的客服按钮，与我们的顾问实时沟通，或发送邮件至 contact@globalbridge.com
          </p>
          <div className="flex flex-col justify-center gap-4 text-sm text-gray-600 sm:flex-row">
            <span>📧 contact@globalbridge.com</span>
            <span>📞 +86 400-000-0000</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-8 text-center text-sm text-gray-400">
        © 2024 GlobalBridge. All rights reserved.
      </footer>

      {/* 客服悬浮组件 */}
      <ChatWidget />
    </main>
  )
}
