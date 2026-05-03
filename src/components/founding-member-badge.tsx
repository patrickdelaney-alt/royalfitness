'use client'

interface Props {
  size?: 'sm' | 'md'
}

export function FoundingMemberBadge({ size = 'md' }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: size === 'sm' ? 9 : 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 300,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#c8a951',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      Founding Member
    </span>
  )
}
