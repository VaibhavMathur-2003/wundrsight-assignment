import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config() 

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPasswordRaw = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPasswordRaw) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.')
  }

  const adminPassword = await bcrypt.hash(adminPasswordRaw, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin User',
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  })

  const slots = []
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)

    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue

    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, minute, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotStart.getMinutes() + 30)

        slots.push({
          startAt: slotStart,
          endAt: slotEnd,
        })
      }
    }
  }

  for (const slot of slots) {
    await prisma.slot.create({ data: slot })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
