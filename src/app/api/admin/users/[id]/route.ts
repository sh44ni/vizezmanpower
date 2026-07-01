import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
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
        updatedAt: true,
        plan: {
          select: { id: true, name: true, description: true, features: true, maxSubmissionsPerMonth: true },
        },
        submissionUsage: {
          orderBy: { month: 'desc' },
          take: 12,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/users/:id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const user = await db.user.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.emailVerified !== undefined && { emailVerified: body.emailVerified }),
        ...(body.role !== undefined && { role: body.role }),
      },
      select: { id: true, isActive: true, emailVerified: true, role: true },
    })

    return NextResponse.json({ user })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/users/:id PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
