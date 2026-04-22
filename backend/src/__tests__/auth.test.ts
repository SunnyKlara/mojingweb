import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createServer } from '../server'
import { seedDefaultAdmin } from '../services/auth.service'

let mongod: MongoMemoryServer
let app: ReturnType<typeof createServer>['app']

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  await seedDefaultAdmin()
  app = createServer().app
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('POST /api/auth/login', () => {
  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('accepts valid credentials and returns accessToken + sets refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'StrongTestPass!123' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTypeOf('string')
    expect(res.body.user.username).toBe('testadmin')
    const cookies = (res.headers['set-cookie'] ?? []) as string[]
    expect(cookies.some((c: string) => c.startsWith('mojing_rt='))).toBe(true)
  })

  it('rejects malformed body via Zod validation', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'x' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns profile with valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'StrongTestPass!123' })
    const token = login.body.accessToken as string
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('testadmin')
  })
})
