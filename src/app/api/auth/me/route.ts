import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        agencyName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        planId: true,
        planAssignedAt: true,
        planExpiresAt: true,
        createdAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            features: true,
            maxSubmissionsPerMonth: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[auth/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
