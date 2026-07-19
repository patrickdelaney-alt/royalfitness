# Backlog

Issues found during audits but deferred. Address in future sessions.

---

## From Light Audit — July 19, 2026

### Low
- **`src/components/founding-member-modal.tsx:29`** — `.catch(console.error)` on QR code generation fires in production on failure. Silence with `.catch(() => {})` or show a fallback UI.
- **`src/components/pending-post-card.tsx`** — Fade animation (`isFading` prop) no longer triggers since pending posts are removed immediately on dedup. The card vanishes abruptly when the live post arrives. Restore smooth fade by keeping the pending card visible during fade-out before store removal, or remove the unused animation machinery from `PendingPostCard`.

---

## From Light Audit — April 8, 2026

### Low
- **`src/app/(main)/error.tsx:14`** — `console.error("[MainError]", error)` fires unconditionally in the error boundary `useEffect`, logging all client-side errors to the production browser console. Wrap in `if (process.env.NODE_ENV === 'development')`.
- **`src/app/(main)/catalog/page.tsx:2499,2511`** — Two unguarded `console.error` debug calls for missing `_catalogType` edge cases run in production. Wrap in `NODE_ENV` guard or remove.

---

## From Light Audit — April 7, 2026

### Low
- **`src/app/(main)/notifications/page.tsx:109,121,172,196`** — Multiple `console.error` calls in fetch/mark-read handlers. Review in next deep audit to determine if these should be silenced or surfaced to users.
