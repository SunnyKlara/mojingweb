import { env } from './config/env'
import { logger } from './config/logger'
import { connectMongo } from './db/mongoose'
import { createServer } from './server'
import { seedDefaultAdmin } from './services/auth.service'

async function main(): Promise<void> {
  await connectMongo()
  await seedDefaultAdmin()
  const { server } = createServer()
  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`)
  })

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal startup error')
  process.exit(1)
})
