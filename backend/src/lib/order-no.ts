import { randomBytes } from 'node:crypto'

/**
 * Generate a human-readable order number.
 * Format: MZ-YYYYMMDD-XXXX (4 hex chars = 65 536 combos per day).
 */
export function generateOrderNo(): string {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const rand = randomBytes(2).toString('hex').toUpperCase()
  return `MZ-${date}-${rand}`
}
