import React from "react";

interface MuscleIconProps {
  active?: boolean;
  className?: string;
}

export function ChestMuscleIcon({ active = false, className = "w-7 h-7" }: MuscleIconProps) {
  const id = active ? "chestActive" : "chestIdle";
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}Body`} x1="22" y1="24" x2="104" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9B8CFF" stopOpacity={active ? 1 : 0.68} />
          <stop offset="1" stopColor="#5A3DFF" stopOpacity={active ? 1 : 0.68} />
        </linearGradient>
      </defs>
      <path d="M64 18C48 18 36 26 32 44L29 66C27 82 37 97 52 100L64 102L76 100C91 97 101 82 99 66L96 44C92 26 80 18 64 18Z" fill={`url(#${id}Body)`} />
      <path d="M64 18C51 18 41 24 35 37" stroke="rgba(215,209,255,0.85)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M64 18C77 18 87 24 93 37" stroke="rgba(215,209,255,0.85)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M64 48V102" stroke="rgba(44,24,133,0.4)" strokeWidth="6" strokeLinecap="round" />
      <path d="M39 56C45 40 56 33 64 33C72 33 83 40 89 56" stroke="rgba(44,24,133,0.45)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M47 82C52 86 58 89 64 89C70 89 76 86 81 82" stroke="rgba(44,24,133,0.35)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="49" cy="52" rx="11" ry="8" fill="rgba(215,209,255,0.45)" transform="rotate(-16 49 52)" />
      <ellipse cx="79" cy="52" rx="11" ry="8" fill="rgba(215,209,255,0.45)" transform="rotate(16 79 52)" />
    </svg>
  );
}

export function BackMuscleIcon({ active = false, className = "w-7 h-7" }: MuscleIconProps) {
  const id = active ? "backActive" : "backIdle";
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}Body`} x1="20" y1="20" x2="108" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9B8CFF" stopOpacity={active ? 1 : 0.68} />
          <stop offset="1" stopColor="#5A3DFF" stopOpacity={active ? 1 : 0.68} />
        </linearGradient>
      </defs>
      <path d="M64 16C45 16 31 27 27 44L19 78C16 96 30 111 49 113L64 114L79 113C98 111 112 96 109 78L101 44C97 27 83 16 64 16Z" fill={`url(#${id}Body)`} />
      <path d="M34 43C41 32 51 27 64 27C77 27 87 32 94 43" stroke="rgba(215,209,255,0.8)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M64 34V110" stroke="rgba(44,24,133,0.38)" strokeWidth="6" strokeLinecap="round" />
      <path d="M31 67C40 80 50 87 64 87C78 87 88 80 97 67" stroke="rgba(44,24,133,0.4)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M44 49C48 63 53 73 64 76" stroke="rgba(44,24,133,0.33)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M84 49C80 63 75 73 64 76" stroke="rgba(44,24,133,0.33)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="43" cy="47" rx="10" ry="8" fill="rgba(215,209,255,0.45)" transform="rotate(18 43 47)" />
      <ellipse cx="85" cy="47" rx="10" ry="8" fill="rgba(215,209,255,0.45)" transform="rotate(-18 85 47)" />
    </svg>
  );
}

export function ArmsMuscleIcon({ active = false, className = "w-7 h-7" }: MuscleIconProps) {
  const id = active ? "armsActive" : "armsIdle";
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}Body`} x1="24" y1="18" x2="102" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9B8CFF" stopOpacity={active ? 1 : 0.68} />
          <stop offset="1" stopColor="#5A3DFF" stopOpacity={active ? 1 : 0.68} />
        </linearGradient>
      </defs>
      <path d="M34 95C25 87 23 73 29 63L44 44C52 34 65 30 75 35L83 39C93 44 99 55 97 66L95 78C93 89 85 99 74 102L48 110C42 111 37 106 38 100L40 92L34 95Z" fill={`url(#${id}Body)`} />
      <path d="M57 30C68 27 79 30 87 38" stroke="rgba(215,209,255,0.8)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M40 92C50 92 60 87 66 79" stroke="rgba(44,24,133,0.4)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M49 61C57 72 67 74 77 69" stroke="rgba(44,24,133,0.35)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="66" cy="48" rx="11" ry="9" fill="rgba(215,209,255,0.48)" transform="rotate(-24 66 48)" />
      <ellipse cx="48" cy="84" rx="9" ry="7" fill="rgba(215,209,255,0.38)" transform="rotate(-18 48 84)" />
    </svg>
  );
}
