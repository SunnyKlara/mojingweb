import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { AccessTokenPayload } from '@mojing/shared'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AccessTokenPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    req.admin = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
    next()
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' })
  }
}
