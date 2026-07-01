import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
config({ path: '.env' })
config()

const pool = new Pool({
  connectionString: process.env.ACCOUNTS_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/vizez_accounts',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding vizez_accounts database...')

  // ── Standard Plan — 30 submissions/month ──
  const standardPlan = await prisma.plan.upsert({
    where: { id: 'plan_standard' },
    update: {
      name: 'Standard',
      description: 'Full access to VizEz Manpower — automated visa processing, passport photo enhancement, and WhatsApp support.',
      features: [
        '30 submissions per month',
        'Automated passport data extraction (GPT-4o)',
        'Passport photo enhancement & background removal',
        'Automated ROP portal submission',
        'Work permit / labour card OCR',
        'PDF export of all processed data',
        'WhatsApp support',
      ],
      maxSubmissionsPerMonth: 30,
      isActive: true,
    },
    create: {
      id: 'plan_standard',
      name: 'Standard',
      description: 'Full access to VizEz Manpower — automated visa processing, passport photo enhancement, and WhatsApp support.',
      features: [
        '30 submissions per month',
        'Automated passport data extraction (GPT-4o)',
        'Passport photo enhancement & background removal',
        'Automated ROP portal submission',
        'Work permit / labour card OCR',
        'PDF export of all processed data',
        'WhatsApp support',
      ],
      maxSubmissionsPerMonth: 30,
      isActive: true,
    },
  })

  console.log(`✅ Plan: ${standardPlan.name} — ${standardPlan.maxSubmissionsPerMonth} submissions/month`)

  // ── Admin User ──
  const adminHash = await bcrypt.hash('Admin@123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vizez.cloud' },
    update: {},
    create: {
      email: 'admin@vizez.cloud',
      passwordHash: adminHash,
      fullName: 'VizEz Admin',
      agencyName: 'VizEz',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  })
  console.log(`✅ Admin: ${admin.email} / Admin@123!`)

  // ── Test Agency User (active, on Standard plan) ──
  const testHash = await bcrypt.hash('Test@123!', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'demo@vizez.cloud' },
    update: {
      isActive: true,
      emailVerified: true,
      planId: standardPlan.id,
    },
    create: {
      email: 'demo@vizez.cloud',
      passwordHash: testHash,
      fullName: 'Demo Agency',
      agencyName: 'Demo Agency LLC',
      role: 'USER',
      isActive: true,
      emailVerified: true,
      planId: standardPlan.id,
    },
  })
  console.log(`✅ Demo user: ${testUser.email} / Test@123!`)
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('  Admin login  → http://localhost:3006/admin/login')
  console.log('  User login   → http://localhost:3006/login')
  console.log('  Tool access  → http://localhost:3006/')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
