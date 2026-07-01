import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
config({ path: '.env.local' })
config()

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.ACCOUNTS_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/vizez_accounts',
  },
  migrate: {
    adapter: async () => {
      const { Pool } = await import('pg')
      const pool = new Pool({
        connectionString: process.env.ACCOUNTS_DATABASE_URL,
      })
      return new PrismaPg(pool)
    },
  },
})
