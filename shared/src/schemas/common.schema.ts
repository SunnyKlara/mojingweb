import { z } from 'zod'

/** MongoDB ObjectId (24-char hex). */
export const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ObjectId')

/** UUID v4. */
export const UuidSchema = z.string().uuid()

/** ISO 8601 timestamp string or Date object. */
export const IsoDateSchema = z.union([z.string().datetime(), z.date()])

/** Email (optional-friendly, trims + lowercases). */
export const EmailSchema = z.string().trim().toLowerCase().email('Invalid email')

/** Optional email: empty string → undefined. */
export const OptionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))
  .pipe(z.string().email().optional())

/** Pagination query. */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})
export type Pagination = z.infer<typeof PaginationSchema>

/** Standard API error shape. */
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
})
export type ApiError = z.infer<typeof ApiErrorSchema>
