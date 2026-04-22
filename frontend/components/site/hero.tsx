'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pt-32">
      <div className="grid-bg radial-fade absolute inset-0 opacity-70" aria-hidden />
      <div
        className="bg-primary/10 pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="container-prose relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="text-primary h-3.5 w-3.5" />
              <span>专注 B2B 全球化服务 · 已服务 500+ 企业</span>
            </div>
          </motion.div>

          <motion.h1
            className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl"
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            连接全球市场
            <br />
            <span className="from-primary bg-gradient-to-r via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              助力企业出海
            </span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            我们为中国企业提供专业的海外市场拓展、代理商合作与供应链整合服务，让您的业务快速走向世界。
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button asChild size="lg" className="group">
              <Link href="#contact">
                立即咨询
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#cases">查看案例</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
