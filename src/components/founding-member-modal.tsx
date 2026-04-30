'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'

interface Props {
  inviteToken: string
  onDismiss: () => void
}

const TRACK_BASE = 'https://royalfitness.app/api/founding-member/track'

export function FoundingMemberModal({ inviteToken, onDismiss }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrReady, setQrReady] = useState(false)

  const inviteUrl = `${TRACK_BASE}?ref=${inviteToken}`

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, inviteUrl, {
      width: 180,
      margin: 2,
      color: {
        dark: '#2d5a27',
        light: '#f5f2ec',
      },
    }).then(() => setQrReady(true)).catch(console.error)
  }, [inviteUrl])

  const handleDismiss = async () => {
    await fetch('/api/founding-member/seen', { method: 'POST' })
    onDismiss()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(45, 90, 39, 0.92)' }}
      onClick={handleDismiss}
    >
      <div
        className="relative flex flex-col items-center text-center px-10 py-14 mx-6"
        style={{
          background: '#f5f2ec',
          maxWidth: 380,
          width: '100%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ color: '#c8a951', marginBottom: 24 }}>
          <path
            d="M3 18h18M5 18l2-8 5 4 5-6 2 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="5" cy="10" r="1.5" fill="currentColor" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="19" cy="10" r="1.5" fill="currentColor" />
        </svg>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#c8a951',
            marginBottom: 12,
          }}
        >
          Royal
        </p>

        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.2,
            color: '#2d5a27',
            marginBottom: 16,
          }}
        >
          You&apos;re a Founding Member.
        </h2>

        <p
          style={{
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.7,
            color: '#2d5a27',
            opacity: 0.75,
            marginBottom: 36,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          You&apos;re among the first 100 members of Royal. Your crown stays with you permanently.
        </p>

        <div
          style={{
            padding: 12,
            background: '#f5f2ec',
            border: '1px solid rgba(200, 169, 81, 0.4)',
            marginBottom: 16,
            opacity: qrReady ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <canvas ref={canvasRef} />
        </div>

        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            color: '#c4a882',
            textTransform: 'uppercase',
            marginBottom: 36,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Share Royal with someone worth inviting
        </p>

        <button
          onClick={handleDismiss}
          style={{
            background: '#2d5a27',
            color: '#f5f2ec',
            border: 'none',
            padding: '12px 40px',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 300,
          }}
        >
          Enter Royal
        </button>
      </div>
    </div>
  )
}
