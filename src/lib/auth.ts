import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export const COOKIE_NAME = 'vizez_session'
export const TOKEN_EXPIRY = '7d'
export const REMEMBER_ME_EXPIRY = '30d'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Set it in .env.local before starting the server.')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export interface JWTPayload {
  sub: string         // user id
  email: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
}

export async function signToken(payload: JWTPayload, rememberMe = false): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? REMEMBER_ME_EXPIRY : TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function generateToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Node.js fallback
    const { randomBytes } = require('crypto')
    const buf = randomBytes(32)
    for (let i = 0; i < 32; i++) array[i] = buf[i]
  }
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}
