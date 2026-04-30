'use client'

import { useState } from 'react'

interface Props {
  size?: 'sm' | 'md'
}

export function FoundingMemberBadge({ size = 'md' }: Props) {
  const [hovered, setHovered] = useState(false)

  const dim = size === 'sm' ? 18 : 22

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Founding Member"
        className="cursor-default"
        style={{ color: '#c8a951' }}
      >
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

      {hovered && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 text-xs pointer-events-none z-10"
          style={{
            background: '#2d5a27',
            color: '#f5f2ec',
            letterSpacing: '0.08em',
            fontSize: '10px',
          }}
        >
          Founding Member
        </span>
      )}
    </span>
  )
}
