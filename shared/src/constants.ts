/** Message content size limit (chars). */
export const MESSAGE_MAX_LENGTH = 2000

/** Chat history page size. */
export const CHAT_HISTORY_PAGE_SIZE = 50

/** Session id stored in visitor localStorage. */
export const VISITOR_SESSION_KEY = 'mojing:chat_session'

/** Admin JWT stored in admin localStorage. */
export const ADMIN_TOKEN_KEY = 'mojing:admin_token'

/** User roles. */
export const USER_ROLES = ['admin', 'agent'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Message sender kinds. */
export const MESSAGE_SENDERS = ['visitor', 'admin', 'system'] as const
export type MessageSender = (typeof MESSAGE_SENDERS)[number]

/** Session statuses. */
export const SESSION_STATUSES = ['open', 'closed'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]
