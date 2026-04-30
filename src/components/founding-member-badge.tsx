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
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: '#c8a951',
        background: 'rgba(200,169,81,0.08)',
        border: '1px solid rgba(200,169,81,0.5)',
        padding: size === 'sm' ? '1px 5px' : '2px 6px',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      Founding Member
    </span>
  )
}
