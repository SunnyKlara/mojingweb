import { setRequestLocale } from 'next-intl/server'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <>
      <NavBar />
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="mb-8 text-3xl font-bold">{isZh ? '隐私政策' : 'Privacy Policy'}</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            {isZh ? '最后更新：2026 年 5 月' : 'Last updated: May 2026'}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '1. 我们收集的信息' : '1. Information We Collect'}
              </h2>
              <p>
                {isZh
                  ? '当您在 ModelZone 下单时，我们会收集以下信息：姓名、邮箱地址、收货地址、电话号码（可选）。这些信息仅用于处理您的订单和配送商品。'
                  : 'When you place an order on ModelZone, we collect the following information: your name, email address, shipping address, and phone number (optional). This information is used solely to process your order and deliver your product.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '2. 支付信息' : '2. Payment Information'}
              </h2>
              <p>
                {isZh
                  ? '我们不直接处理或存储您的信用卡或银行卡信息。所有支付通过 PayPal 安全处理，我们的服务器不会接触您的支付卡数据。'
                  : 'We do not directly process or store your credit card or bank card information. All payments are securely processed through PayPal, and our servers never handle your payment card data.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '3. 信息使用目的' : '3. How We Use Your Information'}
              </h2>
              <p>
                {isZh
                  ? '我们使用您的个人信息用于：处理和履行订单、发送订单确认和发货通知邮件、回复您的客服咨询、改善我们的网站和服务。'
                  : 'We use your personal information to: process and fulfill orders, send order confirmation and shipping notification emails, respond to your customer service inquiries, and improve our website and services.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '4. 信息共享' : '4. Information Sharing'}
              </h2>
              <p>
                {isZh
                  ? '我们不会出售您的个人信息。我们仅在以下情况下与第三方共享您的信息：PayPal（支付处理）、物流服务商（商品配送）。'
                  : 'We do not sell your personal information. We only share your information with third parties in the following cases: PayPal (payment processing) and shipping carriers (product delivery).'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '5. 数据保留' : '5. Data Retention'}
              </h2>
              <p>
                {isZh
                  ? '我们会保留您的订单信息用于记录和合规目的。如果您希望删除您的个人数据，请通过 support@modelzone.cc 联系我们。'
                  : 'We retain your order information for record-keeping and compliance purposes. If you wish to have your personal data deleted, please contact us at support@modelzone.cc.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{isZh ? '6. Cookie 使用' : '6. Cookies'}</h2>
              <p>
                {isZh
                  ? '我们使用必要的 Cookie 来维护网站的正常功能（如安全令牌）。我们不使用第三方跟踪 Cookie 或广告 Cookie。'
                  : 'We use essential cookies to maintain the normal functionality of our website (such as security tokens). We do not use third-party tracking cookies or advertising cookies.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{isZh ? '7. 您的权利' : '7. Your Rights'}</h2>
              <p>
                {isZh
                  ? '根据适用的数据保护法律（包括 GDPR），您有权访问、更正或删除您的个人数据。如需行使这些权利，请联系 support@modelzone.cc。'
                  : 'Under applicable data protection laws (including GDPR), you have the right to access, correct, or delete your personal data. To exercise these rights, please contact support@modelzone.cc.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{isZh ? '8. 联系方式' : '8. Contact Us'}</h2>
              <p>
                {isZh
                  ? '如果您对本隐私政策有任何疑问，请通过以下方式联系我们：邮箱 support@modelzone.cc'
                  : 'If you have any questions about this Privacy Policy, please contact us at: support@modelzone.cc'}
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
