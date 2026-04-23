'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * Taobao / Douyin 详情页式滚动展示。
 * 每张图都是完整一屏营销素材（文案已在图上），
 * 我们只做顺序铺陈 + 细腻入场动画。
 */
const IMAGES = [
  { src: '/brand/0.png', alt: 'Wind Chaser 64 · 1:64 风洞模型 · 专注车模热爱者' },
  { src: '/brand/1.png', alt: 'Wind Chaser 64 · 定义 气动美学' },
  { src: '/brand/2.png', alt: '微观气流的隐秘形态 · 保卫你的热爱' },
  { src: '/brand/7.png', alt: 'Wind Chaser 64 经过精心设计 · 220×99×59mm' },
  { src: '/brand/4.png', alt: '精准适配您的爱车 · 适配 1:64 车模' },
  { src: '/brand/5.png', alt: '腔内体积 134×54×33mm' },
  { src: '/brand/3.png', alt: '全透明烟雾仓 · 30ml 长续航' },
  { src: '/brand/6.png', alt: '您的下一件精品桌搭' },
  { src: '/brand/8.png', alt: 'Wind Chaser 64 · 车模爱好者的工作台' },
  { src: '/brand/11.png', alt: '产品参数' },
  { src: '/brand/10.png', alt: 'WindChaser 64 · 包装清单' },
  { src: '/brand/9.png', alt: '180 天质保 · 7 天无理由退货 · 人为损坏寄修' },
]

export function ListingScroll() {
  return (
    <section className="bg-background">
      {IMAGES.map((img, i) => (
        <motion.div
          key={img.src}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
        >
          <Image
            src={img.src}
            alt={img.alt}
            width={2048}
            height={1536}
            priority={i < 2}
            sizes="(max-width: 900px) 100vw, 900px"
            className="mx-auto block h-auto w-full max-w-[900px]"
          />
        </motion.div>
      ))}
    </section>
  )
}
