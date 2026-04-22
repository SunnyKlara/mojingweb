import 'dotenv/config'
import { z } from 'zod'

/**
 * Validates and parses environment variables at startup.
 * Fails fast with a clear message if anything is missing / invalid.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    REDIS_URL: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >= 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be >= 32 chars'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),

    ADMIN_USERNAME: z.string().min(3).default('admin'),
    ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be >= 8 chars'),
    ADMIN_EMAIL: z.string().email().default('admin@example.com'),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    NOTIFY_EMAIL: z.string().email().optional(),

    SENTRY_DSN: z.string().optional(),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  })
  .refine((v) => !v.SMTP_HOST || (v.SMTP_USER && v.SMTP_PASS), {
    message: 'SMTP_USER and SMTP_PASS are required when SMTP_HOST is set',
  })

export type Env = z.infer<typeof EnvSchema>

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:')
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}

export const env = loadEnv()
export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
