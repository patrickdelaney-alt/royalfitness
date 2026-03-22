"use client";

import { useState } from "react";
import { HiClipboardCopy, HiExternalLink, HiLink, HiTrash, HiX } from "react-icons/hi";
import type { CatalogItem, CatalogType } from "@/lib/catalog";
import {
  CATEGORY_GRADIENTS,
  getCatalogAction,
  getCatalogCardSummary,
  getCatalogDetailBadges,
  getCatalogLongText,
  getCatalogMetrics,
  getCatalogPhotoUrl,
  getCatalogPrimaryDescriptor,
  getCatalogReferralCode,
  getCatalogTypeInfo,
} from "@/lib/catalog";

function ActionButtons({
  item,
  type,
  compact = false,
}: {
  item: CatalogItem;
  type: CatalogType;
  compact?: boolean;
}) {
  const action = getCatalogAction(item, type);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!action.code) return;
    try {
      await navigator.clipboard.writeText(action.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (action.kind === "none" || !action.primaryLabel) {
    return null;
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {action.helperText && (
        <p className={compact ? "text-[11px] leading-4 text-sub" : "text-sm leading-5 text-sub"}>
          {action.helperText}
        </p>
      )}
      <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-2.5"}>
        {action.href ? (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 rounded-xl font-semibold btn-gradient transition-all ${
              compact ? "px-3 py-2 text-xs" : "w-full py-3 text-sm"
            }`}
            style={{ color: "#ffffff" }}
          >
            <HiExternalLink className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {action.primaryLabel}
          </a>
        ) : (
          <button
            onClick={copyCode}
            className={`flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
              compact ? "px-3 py-2 text-xs" : "w-full py-3 text-sm"
            }`}
            style={{
              background: copied ? "rgba(34,197,94,0.18)" : "linear-gradient(135deg, #6360e8, #9b98ff)",
              color: "#ffffff",
            }}
          >
            <HiClipboardCopy className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {copied ? "Copied!" : action.primaryLabel}
          </button>
        )}

        {action.code && action.href && (
          <button
            onClick={copyCode}
            className={`flex items-center justify-center gap-2 rounded-xl border transition-all ${
              compact ? "px-3 py-2 text-xs" : "w-full py-2.5 text-sm"
            }`}
            style={{
              background: copied ? "rgba(34,197,94,0.12)" : "rgba(120,117,255,0.08)",
              borderColor: copied ? "rgba(34,197,94,0.25)" : "rgba(120,117,255,0.22)",
              color: copied ? "#22c55e" : "#a8a6ff",
            }}
          >
            <HiClipboardCopy className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {copied ? "Copied!" : action.secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function CatalogGridCard({
  item,
  type,
  onSelect,
}: {
  item: CatalogItem;
  type: CatalogType;
  onSelect: () => void;
}) {
  const photoUrl = getCatalogPhotoUrl(item);
  const descriptor = getCatalogPrimaryDescriptor(item, type);
  const summary = getCatalogCardSummary(item, type);
  const action = getCatalogAction(item, type);
  const typeInfo = getCatalogTypeInfo(type);

  return (
    <button
      onClick={onSelect}
      className="relative aspect-square overflow-hidden rounded-sm group text-left"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[type]} flex items-center justify-center`}
        >
          <span className="text-3xl opacity-80">{typeInfo.emoji}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      {action.badgeLabel && (
        <div
          className="absolute top-2 right-2 rounded-full px-2 py-1 text-[10px] font-semibold"
          style={{ background: "rgba(120,117,255,0.9)", color: "#ffffff" }}
        >
          {action.badgeLabel}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="truncate text-[11px] font-semibold text-white">{item.name}</p>
        {descriptor && (
          <p className="mt-0.5 truncate text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            {descriptor}
          </p>
        )}
        {summary && (
          <p className="mt-1 line-clamp-2 text-[10px] leading-4" style={{ color: "rgba(255,255,255,0.82)" }}>
            {summary}
          </p>
        )}
      </div>
    </button>
  );
}

export function CatalogListCard({
  item,
  type,
  onSelect,
}: {
  item: CatalogItem;
  type: CatalogType;
  onSelect: () => void;
}) {
  const photoUrl = getCatalogPhotoUrl(item);
  const descriptor = getCatalogPrimaryDescriptor(item, type);
  const summary = getCatalogCardSummary(item, type);
  const typeInfo = getCatalogTypeInfo(type);
  const referralCode = getCatalogReferralCode(item);

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all"
      style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={item.name}
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div
          className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${CATEGORY_GRADIENTS[type]}`}
        >
          <span className="text-xl">{typeInfo.emoji}</span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{item.name}</p>
            {descriptor && (
              <p className="mt-0.5 truncate text-xs text-sub">{descriptor}</p>
            )}
          </div>
          {referralCode && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(120,117,255,0.12)", color: "#a8a6ff" }}
            >
              {referralCode}
            </span>
          )}
        </div>

        {summary && (
          <p className="mt-2 line-clamp-2 text-xs leading-5" style={{ color: "rgba(255,255,255,0.72)" }}>
            {summary}
          </p>
        )}

        <div className="mt-3">
          <ActionButtons item={item} type={type} compact />
        </div>
      </div>
    </button>
  );
}

export function CatalogDetailModal({
  item,
  type,
  onClose,
  onDelete,
}: {
  item: CatalogItem;
  type: CatalogType;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const typeInfo = getCatalogTypeInfo(type);
  const photoUrl = getCatalogPhotoUrl(item);
  const badges = getCatalogDetailBadges(item, type);
  const metrics = getCatalogMetrics(item, type);
  const longText = getCatalogLongText(item, type);
  const notes = "notes" in item ? item.notes : null;
  const supplementItem = type === "supplements" ? (item as Extract<CatalogItem, { dose: string | null }>) : null;
  const wellnessItem =
    type === "wellness" ? (item as Extract<CatalogItem, { durationMinutes: number | null }>) : null;

  const handleDelete = () => {
    if (!onDelete) return;
    setDeleting(true);
    onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl sm:max-w-md sm:rounded-2xl"
        style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
        >
          <HiX className="h-5 w-5" />
        </button>

        {photoUrl ? (
          <div className="aspect-square w-full">
            <img src={photoUrl} alt={item.name} className="h-full w-full rounded-t-2xl object-cover" />
          </div>
        ) : (
          <div
            className={`flex w-full aspect-[4/3] items-center justify-center rounded-t-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[type]}`}
          >
            <span className="text-6xl">{typeInfo.emoji}</span>
          </div>
        )}

        <div className="space-y-5 p-5">
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-white">{item.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full px-2.5 py-0.5 text-xs"
                    style={{
                      background:
                        badge === typeInfo.label ? "rgba(120,117,255,0.12)" : "rgba(255,255,255,0.06)",
                      color: badge === typeInfo.label ? "#a8a6ff" : "rgba(255,255,255,0.62)",
                    }}
                  >
                    {badge === typeInfo.label ? `${typeInfo.emoji} ${badge}` : badge}
                  </span>
                ))}
              </div>
            </div>

            <ActionButtons item={item} type={type} />
          </div>

          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metrics.map((metric) => (
                <span
                  key={metric}
                  className="rounded-full px-2.5 py-1 text-xs"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.72)" }}
                >
                  {metric}
                </span>
              ))}
            </div>
          )}

          {longText && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-sub">
                {type === "meals" ? "Ingredients" : "Included"}
              </p>
              <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.78)" }}>
                {longText}
              </p>
            </div>
          )}

          {type === "supplements" && (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                { label: "Brand", value: getCatalogPrimaryDescriptor(item, type) },
                { label: "Dose", value: supplementItem?.dose ?? null },
                { label: "Schedule", value: supplementItem?.schedule ?? null },
              ]
                .filter((detail) => detail.value)
                .map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xs font-medium text-sub">{detail.label}</p>
                    <p className="mt-1 text-white">{detail.value}</p>
                  </div>
                ))}
            </div>
          )}

          {type === "accessories" && getCatalogPrimaryDescriptor(item, type) && (
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs font-medium text-sub">Type</p>
              <p className="mt-1 text-white">{getCatalogPrimaryDescriptor(item, type)}</p>
            </div>
          )}

          {type === "wellness" && (
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                { label: "Activity", value: getCatalogPrimaryDescriptor(item, type) },
                {
                  label: "Duration",
                  value:
                    wellnessItem?.durationMinutes != null ? `${wellnessItem.durationMinutes} minutes` : null,
                },
              ]
                .filter((detail) => detail.value)
                .map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xs font-medium text-sub">{detail.label}</p>
                    <p className="mt-1 text-white">{detail.value}</p>
                  </div>
                ))}
            </div>
          )}

          {notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-sub">
                Notes
              </p>
              <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.78)" }}>
                {notes}
              </p>
            </div>
          )}

          {"tags" in item && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all"
              style={{
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <HiTrash className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete item"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogSectionIntro({
  title,
  subtitle,
  countLabel,
}: {
  title: string;
  subtitle: string;
  countLabel?: string | null;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-sub">{subtitle}</p>
      </div>
      {countLabel && (
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
          style={{ background: "rgba(120,117,255,0.12)", color: "#a8a6ff" }}
        >
          {countLabel}
        </span>
      )}
    </div>
  );
}

export function CatalogEmptyState({
  type,
  title,
  description,
  action,
}: {
  type: CatalogType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const typeInfo = getCatalogTypeInfo(type);

  return (
    <div className="py-12 text-center">
      <p className="mb-2 text-3xl">{typeInfo.emoji}</p>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-sub">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function CatalogActionBadge({ item, type }: { item: CatalogItem; type: CatalogType }) {
  const action = getCatalogAction(item, type);

  if (!action.badgeLabel) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        background: action.kind === "combined" || action.kind === "copy" ? "rgba(120,117,255,0.12)" : "rgba(255,255,255,0.06)",
        color: action.kind === "combined" || action.kind === "copy" ? "#a8a6ff" : "rgba(255,255,255,0.55)",
      }}
    >
      <HiLink className="h-2.5 w-2.5" />
      {action.badgeLabel}
    </span>
  );
}
