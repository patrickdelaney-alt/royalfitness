'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FoundingMemberModal } from '@/components/founding-member-modal'

export function FoundingMemberGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [modalState, setModalState] = useState<{
    show: boolean
    token: string | null
  }>({ show: false, token: null })

  useEffect(() => {
    if (status !== 'authenticated') return

    fetch('/api/founding-member/status')
      .then(r => r.json())
      .then(data => {
        if (data.isFoundingMember && !data.seen) {
          setModalState({ show: true, token: data.inviteToken })
        }
      })
      .catch(() => {})
  }, [status])

  return (
    <>
      {children}
      {modalState.show && modalState.token && (
        <FoundingMemberModal
          inviteToken={modalState.token}
          onDismiss={() => setModalState({ show: false, token: null })}
        />
      )}
    </>
  )
}
