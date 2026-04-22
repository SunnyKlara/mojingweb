import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title?: string
  description?: string
  centered?: boolean
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  centered,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section id={id} className={cn('py-20 sm:py-28', className)} {...props}>
      <div className="container-prose">
        {(eyebrow || title || description) && (
          <div className={cn('mb-12 max-w-2xl', centered && 'mx-auto text-center')}>
            {eyebrow && (
              <p className="text-primary mb-3 text-sm font-medium uppercase tracking-wider">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground mt-4 text-base leading-relaxed">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
