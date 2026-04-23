import { cn } from '@/lib/utils'

/**
 * ModelZone wordmark — matte, monochrome, engraved feel.
 * Sits equally well on a white card or a black stage.
 */
export function Logo({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-[18px]',
  }
  return (
    <span
      className={cn(
        'text-display inline-flex items-baseline gap-1.5 font-bold tracking-tight',
        sizes[size],
        className,
      )}
    >
      <span>ModelZone</span>
      <span className="text-muted-foreground text-[0.7em] font-medium tracking-wider">模境</span>
    </span>
  )
}
