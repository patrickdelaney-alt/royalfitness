import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const APP_STORE_URL = 'https://apps.apple.com/us/app/royal-fitness-wellness/id6759988491'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('ref')

  if (token) {
    prisma.foundingMemberInvite.updateMany({
      where: { token },
      data: { clickCount: { increment: 1 } },
    }).catch(() => {})
  }

  return NextResponse.redirect(APP_STORE_URL)
}
