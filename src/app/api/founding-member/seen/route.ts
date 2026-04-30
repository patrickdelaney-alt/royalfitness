import { NextResponse } from 'next/server'
import { safeAuth } from '@/lib/safe-auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await safeAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { foundingMemberSeen: true },
  })

  return NextResponse.json({ ok: true })
}
