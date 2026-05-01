import { setRequestLocale } from 'next-intl/server'
import { NavBar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <>
      <NavBar />
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="mb-8 text-3xl font-bold">{isZh ? '服务条款' : 'Terms of Service'}</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            {isZh ? '最后更新：2026 年 5 月' : 'Last updated: May 2026'}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold">{isZh ? '1. 概述' : '1. Overview'}</h2>
              <p>
                {isZh
                  ? '本网站由深圳模境工作室运营。访问或使用 modelzone.cc 即表示您同意遵守以下条款。如果您不同意这些条款，请勿使用本网站。'
                  : 'This website is operated by Shenzhen ModelZone Studio. By accessing or using modelzone.cc, you agree to be bound by the following terms. If you do not agree to these terms, please do not use this website.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '2. 商品与定价' : '2. Products & Pricing'}
              </h2>
              <p>
                {isZh
                  ? '所有商品价格以美元（USD）标示。我们保留随时修改价格的权利，但已确认的订单不受价格变动影响。商品图片仅供参考，实际产品可能存在细微差异。'
                  : 'All product prices are listed in US Dollars (USD). We reserve the right to modify prices at any time, but confirmed orders will not be affected by price changes. Product images are for reference only; actual products may vary slightly.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '3. 订单与支付' : '3. Orders & Payment'}
              </h2>
              <p>
                {isZh
                  ? '下单即表示您同意购买所选商品。支付通过 PayPal 安全处理。订单确认后，我们将通过邮件发送订单详情。未在 30 分钟内完成支付的订单将自动取消。'
                  : 'Placing an order constitutes your agreement to purchase the selected product. Payment is securely processed through PayPal. After order confirmation, we will send order details via email. Orders not paid within 30 minutes will be automatically cancelled.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{isZh ? '4. 配送' : '4. Shipping'}</h2>
              <p>
                {isZh
                  ? '我们提供国际配送服务，覆盖美国、加拿大、英国、德国、法国、日本等主要市场。预计配送时间为 7-15 个工作日，具体取决于目的地国家。运费在结算时根据收货国家自动计算。'
                  : 'We offer international shipping to major markets including the US, Canada, UK, Germany, France, Japan, and more. Estimated delivery time is 7-15 business days, depending on the destination country. Shipping costs are automatically calculated at checkout based on the delivery country.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '5. 退换货政策' : '5. Return & Refund Policy'}
              </h2>
              <p>
                {isZh
                  ? '自收到商品之日起 7 天内，如商品存在质量问题，您可以申请退货退款。请通过 support@modelzone.cc 联系我们并提供订单号和问题描述。退款将通过原支付方式（PayPal）退回，预计 3-5 个工作日到账。'
                  : 'Within 7 days of receiving your product, if there is a quality issue, you may request a return and refund. Please contact us at support@modelzone.cc with your order number and a description of the issue. Refunds will be processed through the original payment method (PayPal) and typically arrive within 3-5 business days.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{isZh ? '6. 质保' : '6. Warranty'}</h2>
              <p>
                {isZh
                  ? 'Wind Chaser 64 享有 180 天质保服务。质保范围包括制造缺陷和非人为损坏的功能故障。人为损坏、改装或不当使用导致的问题不在质保范围内。'
                  : 'The Wind Chaser 64 comes with a 180-day warranty. The warranty covers manufacturing defects and functional failures not caused by human damage. Damage caused by misuse, modification, or improper handling is not covered.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '7. 知识产权' : '7. Intellectual Property'}
              </h2>
              <p>
                {isZh
                  ? '本网站上的所有内容（包括文字、图片、设计、商标）均为深圳模境工作室的财产，受知识产权法保护。未经书面许可，不得复制或使用。'
                  : 'All content on this website (including text, images, designs, and trademarks) is the property of Shenzhen ModelZone Studio and is protected by intellectual property laws. Reproduction or use without written permission is prohibited.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                {isZh ? '8. 免责声明' : '8. Limitation of Liability'}
              </h2>
              <p>
                {isZh
                  ? '在法律允许的最大范围内，深圳模境工作室对因使用本网站或购买商品而产生的任何间接、附带或后果性损害不承担责任。'
                  : 'To the maximum extent permitted by law, Shenzhen ModelZone Studio shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or the purchase of products.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{isZh ? '9. 联系方式' : '9. Contact Us'}</h2>
              <p>
                {isZh
                  ? '如果您对本服务条款有任何疑问，请联系：support@modelzone.cc'
                  : 'If you have any questions about these Terms of Service, please contact: support@modelzone.cc'}
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
