// Simple in-memory rate limiter — works for single-process / dev/VPS deployments
// For multi-instance, swap with Redis-backed solution

interface AttemptRecord {
  count: number
  resetAt: number
}

const store = new Map<string, AttemptRecord>()
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS }
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count, resetAt: record.resetAt }
}

export function resetRateLimit(key: string) {
  store.delete(key)
}

// Clean up stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) store.delete(key)
    }
  }, 10 * 60 * 1000)
}
