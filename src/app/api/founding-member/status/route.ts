import { NextResponse } from 'next/server'
import { safeAuth } from '@/lib/safe-auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const FOUNDING_MEMBER_CAP = 100

export async function GET() {
  const session = await safeAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { foundingMember: true, foundingMemberSeen: true },
  })

  let inviteToken: string | null = null
  if (user?.foundingMember) {
    const invite = await prisma.foundingMemberInvite.findFirst({
      where: { inviterId: session.user.id },
      select: { token: true },
    })
    inviteToken = invite?.token ?? null
  }

  return NextResponse.json({
    isFoundingMember: user?.foundingMember ?? false,
    seen: user?.foundingMemberSeen ?? false,
    inviteToken,
  })
}

export async function POST() {
  const session = await safeAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { foundingMember: true },
  })

  if (user?.foundingMember) {
    return NextResponse.json({ claimed: false, reason: 'already_member' })
  }

  const count = await prisma.user.count({ where: { foundingMember: true } })

  if (count >= FOUNDING_MEMBER_CAP) {
    return NextResponse.json({ claimed: false, reason: 'cap_reached' })
  }

  const token = randomBytes(8).toString('hex')

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { foundingMember: true, foundingMemberSeen: false },
    }),
    prisma.foundingMemberInvite.create({
      data: { inviterId: session.user.id, token },
    }),
  ])

  return NextResponse.json({ claimed: true, token })
}
