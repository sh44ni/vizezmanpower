import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { createPlanSchema } from '@/lib/validations'

export async function GET() {
  try {
    await requireAdmin()

    const plans = await db.plan.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { users: true } },
      },
    })

    return NextResponse.json({ plans })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/plans GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()

    const result = createPlanSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const plan = await db.plan.create({
      data: {
        name: result.data.name,
        description: result.data.description ?? '',
        features: result.data.features,
        maxSubmissionsPerMonth: result.data.maxSubmissionsPerMonth ?? null,
        isActive: result.data.isActive,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/plans POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
