import { describe, it, expect } from 'vitest'
import {
  CreateLeadRequestSchema,
  LoginRequestSchema,
  VisitorMessagePayloadSchema,
  TypingPayloadSchema,
  UuidSchema,
} from '../schemas'

describe('UuidSchema', () => {
  it('accepts a valid v4 uuid', () => {
    const r = UuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    expect(r.success).toBe(true)
  })
  it('rejects an empty string', () => {
    expect(UuidSchema.safeParse('').success).toBe(false)
  })
})

describe('LoginRequestSchema', () => {
  it('trims username and requires password', () => {
    const r = LoginRequestSchema.safeParse({ username: '  admin  ', password: 'abcdefgh' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.username).toBe('admin')
  })
  it('rejects empty password', () => {
    expect(LoginRequestSchema.safeParse({ username: 'admin', password: '' }).success).toBe(false)
  })
})

describe('VisitorMessagePayloadSchema', () => {
  it('requires a non-empty content', () => {
    const r = VisitorMessagePayloadSchema.safeParse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      content: '',
    })
    expect(r.success).toBe(false)
  })

  it('accepts a well-formed payload', () => {
    const r = VisitorMessagePayloadSchema.safeParse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'hello',
      visitorInfo: { name: 'Alice', email: 'a@b.com' },
    })
    expect(r.success).toBe(true)
  })
})

describe('TypingPayloadSchema', () => {
  it('requires boolean isTyping', () => {
    expect(
      TypingPayloadSchema.safeParse({
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        isTyping: 'yes',
      }).success,
    ).toBe(false)
  })
})

describe('CreateLeadRequestSchema', () => {
  const base = {
    name: 'Alice',
    email: 'a@b.com',
    message: 'hi',
  }

  it('accepts minimum required fields', () => {
    expect(CreateLeadRequestSchema.safeParse(base).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(CreateLeadRequestSchema.safeParse({ ...base, email: 'nope' }).success).toBe(false)
  })

  it('allows empty company/phone (string coercion)', () => {
    const r = CreateLeadRequestSchema.safeParse({ ...base, company: '', phone: '' })
    expect(r.success).toBe(true)
  })

  it('accepts honeypot field at schema level (route enforces)', () => {
    const r = CreateLeadRequestSchema.safeParse({ ...base, website: 'http://spam' })
    expect(r.success).toBe(true)
  })
})
