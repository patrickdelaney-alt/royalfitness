"use client";

// Deliberately mirrors ShareCatalogModal's shell so the two share surfaces are
// visibly the same component family: gold 2px outer bezel at 32px, #FDFAF5 inner
// card at 30px, 36×4 grabber, italic Cormorant title, BottomCtaBar footer with
// the brand gradient CTA.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiShare, HiX, HiDownload, HiClipboardCopy } from "react-icons/hi";
import toast from "react-hot-toast";
import { BottomCtaBar } from "@/components/layout/bottom-cta";
import {
  generateShareCard,
  type ShareCardData,
  type ShareRatio,
} from "@/lib/generate-share-card";
import { copyLink, shareCardImage, type ShareOutcome } from "@/lib/share";
import { isCapacitorNative } from "@/lib/link-handler";
import { lightImpact, successNotification } from "@/lib/haptics";

interface Props {
  data: ShareCardData;
  /** Public share URL — carries the referral code so the loop closes. */
  url?: string;
  onClose: () => void;
}

const RATIO_OPTIONS: { value: ShareRatio; label: string; hint: string }[] = [
  { value: "story", label: "Story", hint: "9:16" },
  { value: "feed", label: "Feed", hint: "4:5" },
  { value: "cover", label: "Cover", hint: "1:1" },
];

const PREVIEW_H = 206;
const PREVIEW_ASPECT: Record<ShareRatio, number> = {
  story: 1080 / 1920,
  feed: 1080 / 1350,
  cover: 1,
  link: 1200 / 628,
};

/** Stable identity for the card contents, so a parent re-render that rebuilds the
 *  `data` object doesn't restart generation. */
function cardKey(data: ShareCardData): string {
  if (data.type === "catalog_item") {
    return ["catalog", data.productName, data.brand, data.mediaUrl, data.authorHandle].join(
      "|",
    );
  }
  return [
    "post",
    data.mediaUrl,
    data.caption,
    data.eyebrow,
    data.authorHandle,
    data.badge?.name,
    data.badge?.subtitle,
    (data.metrics ?? []).map((m) => `${m.value}${m.unit ?? ""}${m.label}`).join(","),
  ].join("|");
}

export default function SharePostSheet({ data, url, onClose }: Props) {
  const [ratio, setRatio] = useState<ShareRatio>("story");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const objectUrl = useRef<string | null>(null);
  // The PNG behind the preview, kept so the Share tap can reach navigator.share
  // without awaiting generation and losing the user gesture.
  const previewBlob = useRef<Blob | null>(null);
  const native = isCapacitorNative();

  const key = useMemo(() => cardKey(data), [data]);
  // Read the latest data inside the effect without making it a dependency — a
  // parent re-render rebuilds the object, and only its contents matter.
  const latestData = useRef(data);
  useEffect(() => {
    latestData.current = data;
  }, [data]);

  // ── Live preview — regenerate whenever the ratio or the contents change ─────
  useEffect(() => {
    let cancelled = false;
    previewBlob.current = null;
    generateShareCard(latestData.current, ratio)
      .then((blob) => {
        if (cancelled) return;
        previewBlob.current = blob;
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl.current);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key, ratio]);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busy, onClose]);

  // Whether the referral link made it onto the clipboard this attempt — the
  // toast has to be honest about it, since that link is the only way a Story
  // viewer can find their way back.
  const linkCopied = useRef(false);

  const report = useCallback(
    (outcome: ShareOutcome) => {
      setBusy(false);
      switch (outcome) {
        case "shared":
          void successNotification();
          if (linkCopied.current) toast.success("Shared — link copied for your caption");
          onClose();
          return;
        case "cancelled":
          return;
        case "copied":
          toast.success("Link copied — paste it wherever you're sharing");
          onClose();
          return;
        case "downloaded":
          toast.success(
            linkCopied.current ? "Card saved — link copied too" : "Card saved",
          );
          onClose();
          return;
        default:
          // The tap already copied the link before handing off, so even a
          // failed share leaves the user something to paste.
          if (linkCopied.current) {
            toast.success("Link copied — paste it wherever you're sharing");
            onClose();
            return;
          }
          toast.error("Couldn't share your card. Try “Copy link”.");
      }
    },
    [onClose],
  );

  // Not async: navigator.share has to be reached in the same tick as the tap or
  // Safari and the iOS webview refuse it for want of a user gesture.
  const handleShare = useCallback(() => {
    if (busy) return;
    void lightImpact();
    setBusy(true);
    linkCopied.current = false;
    // Copy first, inside the gesture — Instagram and TikTok strip the link from
    // a shared image, so it has to be pasteable into the caption.
    if (url) {
      void copyLink(url).then((ok) => {
        linkCopied.current = ok;
      });
    }

    const blob = previewBlob.current;
    if (blob) {
      shareCardImage({ blob, url })
        .then(report)
        .catch(() => report("failed"));
      return;
    }

    // Preview still rendering — generate first, then share. This path can lose
    // the gesture on Safari, which is why the blob is cached at all.
    generateShareCard(latestData.current, ratio)
      .then((generated) => {
        previewBlob.current = generated;
        return shareCardImage({ blob: generated, url });
      })
      .then(report)
      .catch(() => report("failed"));
  }, [busy, url, ratio, report]);

  const handleCopy = useCallback(() => {
    if (!url) return;
    void lightImpact();
    void copyLink(url).then((ok) => {
      if (ok) toast.success("Link copied");
      else toast.error("Couldn't copy the link");
    });
  }, [url]);

  const handleSave = useCallback(() => {
    if (busy || !previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "royal.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Card saved");
  }, [busy, previewUrl]);

  const previewW = Math.round(PREVIEW_H * PREVIEW_ASPECT[ratio]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(24,25,15,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="relative w-full max-w-sm flex flex-col" style={{ maxHeight: "92dvh" }}>
        {/* Outer bezel */}
        <div
          className="rounded-t-[32px] sm:rounded-[32px] p-[2px] flex flex-col overflow-hidden"
          style={{
            background: "rgba(154,123,46,0.18)",
            boxShadow:
              "0 24px 80px rgba(24,25,15,0.32), 0 1px 0 rgba(255,255,255,0.06) inset",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Inner card */}
          <div
            className="rounded-t-[30px] sm:rounded-[30px] flex flex-col overflow-hidden"
            style={{
              background: "#FDFAF5",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: "rgba(36,63,22,0.15)" }}
              />
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 px-6 pt-4 pb-4 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    className="font-bold text-lg leading-tight"
                    style={{
                      color: "#18190F",
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                    }}
                  >
                    Share this post
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "#7A7560" }}>
                    A card sized for wherever it&rsquo;s going.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={busy}
                  className="p-2 rounded-full transition-colors disabled:opacity-50"
                  style={{ background: "rgba(36,63,22,0.06)", color: "#7A7560" }}
                  aria-label="Close"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>

              {/* Live preview */}
              <div
                className="rounded-2xl p-4 flex justify-center"
                style={{
                  background: "rgba(154,123,46,0.06)",
                  border: "1px solid rgba(154,123,46,0.20)",
                }}
              >
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    width: previewW,
                    height: PREVIEW_H,
                    background: "rgba(36,63,22,0.08)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "width 0.3s var(--spring)",
                  }}
                >
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Your share card"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Ratio segment */}
              <div className="space-y-2">
                <label
                  className="block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#7A7560" }}
                >
                  Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RATIO_OPTIONS.map((opt) => {
                    const selected = ratio === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          void lightImpact();
                          setRatio(opt.value);
                        }}
                        className="min-h-[58px] px-2 py-2.5 rounded-xl text-center transition-all duration-200"
                        style={
                          selected
                            ? {
                                background: "#243F16",
                                color: "#FDFAF5",
                                boxShadow: "0 2px 8px rgba(36,63,22,0.28)",
                              }
                            : { background: "rgba(36,63,22,0.06)", color: "#7A7560" }
                        }
                      >
                        <span className="block text-xs font-semibold leading-tight">
                          {opt.label}
                        </span>
                        <span className="block text-[10px] leading-tight mt-0.5 opacity-80">
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <BottomCtaBar className="px-6 space-y-3" style={{ background: "#FDFAF5" }}>
              <button
                onClick={handleShare}
                disabled={busy}
                className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #243F16 0%, #3A6122 100%)",
                  color: "#FDFAF5",
                  boxShadow: busy ? "none" : "0 4px 16px rgba(36,63,22,0.30)",
                }}
              >
                <HiShare className="w-4 h-4" />
                <span>{busy ? "Preparing…" : "Share"}</span>
              </button>
              {url && (
                <button
                  onClick={handleCopy}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
                  style={{ background: "rgba(36,63,22,0.08)", color: "#243F16" }}
                >
                  <HiClipboardCopy className="w-4 h-4" />
                  <span>Copy link</span>
                </button>
              )}
              {/* The iOS share sheet already offers Save Image, and an anchor
                  download does nothing inside the native webview. */}
              {!native && (
                <button
                  onClick={handleSave}
                  disabled={busy || !previewUrl}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                  style={{ background: "rgba(36,63,22,0.08)", color: "#243F16" }}
                >
                  <HiDownload className="w-4 h-4" />
                  <span>Save image</span>
                </button>
              )}
              {url && (
                <p
                  className="text-[11px] leading-relaxed text-center"
                  style={{ color: "#7A7560" }}
                >
                  Your referral link is copied when you share. You earn royalties if
                  someone joins from it.
                </p>
              )}
            </BottomCtaBar>
          </div>
        </div>
      </div>
    </div>
  );
}
