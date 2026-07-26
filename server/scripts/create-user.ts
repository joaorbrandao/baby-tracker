import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { config } from 'dotenv'

config({ path: ['.env', '../.env'] })

const prisma = new PrismaClient()

async function main() {
  const [email, password, name] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: npm run create-user -- <email> <password> [name]')
    process.exit(1)
  }

  const passwordHash = await hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  console.log('Created user:', user)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
