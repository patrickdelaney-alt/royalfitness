interface SubcategoryChipsProps {
  tags: string[];
  limit?: number;
  compact?: boolean;
  className?: string;
}

export function SubcategoryChips({
  tags,
  limit,
  compact = false,
  className = "",
}: SubcategoryChipsProps) {
  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;

  if (visibleTags.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className={compact ? "text-[9px] leading-none px-1.5 py-1" : "text-xs px-2 py-0.5"}
          style={{
            borderRadius: 9999,
            background: "rgba(36,63,22,0.08)",
            color: "var(--text-muted)",
          }}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
