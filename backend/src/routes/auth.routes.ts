import { Router, type Request } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { validateBody } from '../middleware/validate.middleware'
import { LoginRequestSchema, type LoginRequest, type LoginResponse } from '@mojing/shared'

/**
 * NOTE: Phase 0 keeps the existing ENV-based single-admin login for behavior
 * parity. Phase 1 will replace this with bcrypt + User collection + refresh tokens.
 */
export const authRouter = Router()

authRouter.post(
  '/login',
  validateBody(LoginRequestSchema),
  (req: Request<unknown, unknown, LoginRequest>, res) => {
    const { username, password } = req.body
    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const accessToken = jwt.sign({ sub: 'admin', username, role: 'admin' }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_TTL,
    } as jwt.SignOptions)
    const response: LoginResponse = {
      accessToken,
      user: {
        username,
        email: env.ADMIN_EMAIL,
        role: 'admin',
        disabled: false,
      },
    }
    res.json(response)
  },
)
