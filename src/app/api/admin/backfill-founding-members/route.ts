// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function isAdmin(email: string | null | undefined): boolean {
  return !!email && email === process.env.ADMIN_EMAIL
}

async function runBackfill() {
  const users = await prisma.user.findMany({
    where: { foundingMember: false },
    select: { id: true },
  })

  let updated = 0
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { foundingMember: true, foundingMemberSeen: true },
    })

    const existing = await prisma.foundingMemberInvite.findFirst({
      where: { inviterId: user.id },
    })
    if (!existing) {
      const token = randomBytes(8).toString('hex')
      await prisma.foundingMemberInvite.create({
        data: { inviterId: user.id, token },
      })
    }
    updated++
  }
  return updated
}

// GET — visit in browser while logged in as admin to trigger backfill
export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const updated = await runBackfill()
  return NextResponse.json({ ok: true, updated })
}

// POST /api/admin/backfill-founding-members
export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const session2 = await auth()
  if (!isAdmin(session2?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const updated = await runBackfill()
  return NextResponse.json({ ok: true, updated })
}
