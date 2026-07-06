"use client";

import React from "react";
import {
  isCapacitorNative,
  normalizeExternalUrl,
  openExternalLink,
} from "@/lib/link-handler";

// Matches URL-like tokens: an explicit http(s):// URL, or a scheme-less token
// that begins with `www.`. The capturing group keeps the delimiters so the
// surrounding text is preserved when splitting.
const URL_TOKEN = /((?:https?:\/\/|www\.)[^\s]+)/gi;

// Trailing characters that are almost always sentence punctuation rather than
// part of the link (e.g. "check www.example.com." or "(www.example.com)").
const TRAILING_PUNCTUATION = /[.,!?;:'")\]}>]+$/;

/**
 * Renders plain text with any embedded URLs turned into clickable, externally
 * opening links. Non-URL text is rendered verbatim (React escapes it), and
 * tokens that aren't valid http(s) URLs fall back to plain text.
 *
 * Mirrors the external-link handling used by `EmbedMedia` / `AffiliateSection`:
 * opens in a new tab on the web, and routes through the system browser when
 * running inside the Capacitor native wrapper.
 */
export default function Linkify({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // Splitting on a regex with a capturing group interleaves the results:
  // plain-text segments land on even indices, captured URL tokens on odd ones.
  const parts = text.split(URL_TOKEN);

  return (
    <>
      {parts.map((part, index) => {
        const isUrlToken = index % 2 === 1;
        if (!isUrlToken || !part) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
        const core = trailing ? part.slice(0, -trailing.length) : part;
        const href = normalizeExternalUrl(core);

        if (!href) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        return (
          <React.Fragment key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className ?? "underline break-words"}
              style={{ color: "var(--brand)" }}
              onClick={(e) => {
                if (isCapacitorNative()) {
                  e.preventDefault();
                  openExternalLink(href);
                }
              }}
            >
              {core}
            </a>
            {trailing}
          </React.Fragment>
        );
      })}
    </>
  );
}
