import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createServer } from '../server'

let mongod: MongoMemoryServer
let app: ReturnType<typeof createServer>['app']

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createServer().app
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('POST /api/leads', () => {
  it('accepts a well-formed submission', async () => {
    const res = await request(app).post('/api/leads').send({
      name: 'Alice',
      email: 'alice@example.com',
      company: 'ACME',
      message: 'Hello from tests',
    })
    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
    expect(typeof res.body.id).toBe('string')
  })

  it('silently short-circuits honeypot (bots)', async () => {
    const res = await request(app).post('/api/leads').send({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'spam',
      website: 'http://spammer.example',
    })
    expect(res.status).toBe(202)
  })

  it('rejects invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ name: 'x', email: 'not-an-email', message: 'hi' })
    expect(res.status).toBe(400)
  })

  it('protects admin listing', async () => {
    const res = await request(app).get('/api/leads')
    expect(res.status).toBe(401)
  })
})
