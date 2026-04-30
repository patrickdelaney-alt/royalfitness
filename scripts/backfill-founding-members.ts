import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { foundingMember: false },
    select: { id: true },
  })

  console.log(`Backfilling ${users.length} users as founding members...`)

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        foundingMember: true,
        foundingMemberSeen: true,
      },
    })

    const token = randomBytes(8).toString('hex')
    await prisma.foundingMemberInvite.upsert({
      where: { token },
      update: {},
      create: { inviterId: user.id, token },
    })
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
