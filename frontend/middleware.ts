import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match all pathnames except admin, api, static assets
  matcher: ['/((?!admin|api|_next|.*\\..*).*)'],
}
