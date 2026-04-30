import { NextResponse } from 'next/server'
import { safeAuth } from '@/lib/safe-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await safeAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invite = await prisma.foundingMemberInvite.findFirst({
    where: { inviterId: session.user.id },
    select: { token: true, clickCount: true, signupCount: true },
  })

  return NextResponse.json(invite ?? { token: null, clickCount: 0, signupCount: 0 })
}
