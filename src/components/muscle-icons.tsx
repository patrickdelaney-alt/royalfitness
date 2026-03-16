import React from "react";

interface MuscleIconProps {
  active?: boolean;
  className?: string;
}

const gradientStops = (active: boolean) => ({
  top: active ? "#D8DAE4" : "#C6C8D3",
  mid: active ? "#B8BBC9" : "#AEB1C0",
  bottom: active ? "#8B8FA1" : "#7D8193",
  highlight: active ? "rgba(248,249,252,0.82)" : "rgba(238,240,246,0.62)",
  shadow: active ? "rgba(68,72,91,0.42)" : "rgba(53,57,74,0.38)",
  deepShadow: active ? "rgba(52,56,75,0.62)" : "rgba(44,48,65,0.52)",
});

export function ChestMuscleIcon({ active = false, className = "w-7 h-7" }: MuscleIconProps) {
  const id = active ? "chestActive" : "chestIdle";
  const c = gradientStops(active);

  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}Body`} x1="24" y1="18" x2="102" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.top} />
          <stop offset="0.55" stopColor={c.mid} />
          <stop offset="1" stopColor={c.bottom} />
        </linearGradient>
      </defs>

      <path d="M64 18C48 18 36 27 31 46L28 70C26 86 35 99 50 104L64 108L78 104C93 99 102 86 100 70L97 46C92 27 80 18 64 18Z" fill={`url(#${id}Body)`} />

      <path d="M34 49C44 35 55 31 64 31C73 31 84 35 94 49" stroke={c.deepShadow} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M64 40V107" stroke={c.deepShadow} strokeWidth="5" strokeLinecap="round" />
      <path d="M46 84C51 91 57 94 64 94C71 94 77 91 82 84" stroke={c.shadow} strokeWidth="5" strokeLinecap="round" fill="none" />

      <ellipse cx="49" cy="54" rx="13" ry="10" fill={c.highlight} transform="rotate(-17 49 54)" />
      <ellipse cx="79" cy="54" rx="13" ry="10" fill={c.highlight} transform="rotate(17 79 54)" />
      <ellipse cx="60" cy="21" rx="8" ry="4" fill="rgba(247,248,252,0.54)" />
    </svg>
  );
}

export function BackMuscleIcon({ active = false, className = "w-7 h-7" }: MuscleIconProps) {
  const id = active ? "backActive" : "backIdle";
  const c = gradientStops(active);

  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}Body`} x1="23" y1="16" x2="107" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.top} />
          <stop offset="0.55" stopColor={c.mid} />
          <stop offset="1" stopColor={c.bottom} />
        </linearGradient>
      </defs>

      <path d="M64 17C46 17 31 28 26 45L20 73C16 93 31 110 52 112H76C97 110 112 93 108 73L102 45C97 28 82 17 64 17Z" fill={`url(#${id}Body)`} />

      <path d="M38 44C46 33 55 29 64 29C73 29 82 33 90 44" stroke={c.deepShadow} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M64 36V111" stroke={c.deepShadow} strokeWidth="5" strokeLinecap="round" />
      <path d="M30 67C39 82 50 90 64 90C78 90 89 82 98 67" stroke={c.shadow} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M45 52C49 64 55 73 64 77" stroke={c.shadow} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M83 52C79 64 73 73 64 77" stroke={c.shadow} strokeWidth="5" strokeLinecap="round" fill="none" />

      <ellipse cx="44" cy="46" rx="11" ry="8" fill={c.highlight} transform="rotate(18 44 46)" />
      <ellipse cx="84" cy="46" rx="11" ry="8" fill={c.highlight} transform="rotate(-18 84 46)" />
    </svg>
  );
}

export function ArmsMuscleIcon({ active = false, className = "w-7 h-7" }: MuscleIconProps) {
  const id = active ? "armsActive" : "armsIdle";
  const c = gradientStops(active);

  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}Body`} x1="20" y1="22" x2="108" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c.top} />
          <stop offset="0.55" stopColor={c.mid} />
          <stop offset="1" stopColor={c.bottom} />
        </linearGradient>
      </defs>

      <path d="M33 96C24 88 22 75 28 64L42 47C50 37 63 32 74 36L84 40C94 44 101 54 100 65L98 79C96 91 87 102 75 105L49 111C42 113 35 107 36 100L38 92L33 96Z" fill={`url(#${id}Body)`} />

      <path d="M56 34C68 31 81 35 89 44" stroke={c.deepShadow} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M40 92C51 93 61 88 68 80" stroke={c.deepShadow} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M50 62C58 72 68 75 79 70" stroke={c.shadow} strokeWidth="5" strokeLinecap="round" fill="none" />

      <ellipse cx="66" cy="50" rx="13" ry="10" fill={c.highlight} transform="rotate(-24 66 50)" />
      <ellipse cx="49" cy="84" rx="10" ry="7" fill="rgba(245,246,251,0.55)" transform="rotate(-17 49 84)" />
    </svg>
  );
}
