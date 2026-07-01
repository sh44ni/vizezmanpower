import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME, JWTPayload } from './auth'

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Forbidden')
  return session
}
