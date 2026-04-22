import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="container-prose">
        <div className="from-primary text-primary-foreground relative overflow-hidden rounded-3xl border bg-gradient-to-br to-blue-700 p-10 sm:p-16">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-xl">
            <p className="text-primary-foreground/75 mb-3 text-sm uppercase tracking-wider">
              联系我们
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              准备好开始出海了吗？
            </h2>
            <p className="text-primary-foreground/85 mt-4 text-base">
              点击右下角客服按钮与顾问实时沟通，或直接通过邮件 / 电话联系我们。
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link href="mailto:contact@globalbridge.com">
                  <Mail />
                  发送邮件
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-primary-foreground hover:text-primary-foreground border-white/30 bg-transparent hover:bg-white/10"
              >
                <Link href="tel:+864000000000">
                  <Phone />
                  +86 400-000-0000
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
