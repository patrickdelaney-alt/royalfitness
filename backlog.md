# Backlog

Issues found during audits but deferred. Address in future sessions.

---

## From Light Audit — July 26, 2026

### High
- **`src/app/(main)/create/CreateContent.tsx:867`** — Failed upload never resets `fileInputRef.current.value`. After an error, re-selecting the same file fires no `change` event; user is silently blocked from retrying. Fix: add `e.target.value = ""` in the failure path (same pattern as catalog `PhotoUpload`).
- **`src/app/(main)/profile/[username]/page.tsx:258`** — `handleInvite` calls `res.json()` before checking `res.ok`. On error the destructured `url` is `undefined`, so `navigator.share({ url: undefined })` is called silently with no user feedback.
- **`src/app/(main)/create/CreateContent.tsx:600`** — `session.exercises` is cast and `.filter()` called outside the wrapping try/catch. If the value isn't an array (schema mismatch from stale localStorage), it throws unhandled inside the effect, leaving the form broken.
- **`src/components/post-card.tsx:~511`** — `AffiliateSection.copyCode` calls `navigator.clipboard.writeText()` fire-and-forget. On clipboard permission denial, `setCopied(true)` and the success toast still fire — false confirmation.

### Medium
- **`src/components/user-catalog-section.tsx:523`** — `Promise.all` for catalog fetches causes the entire catalog to show an error if any single category fetch fails. Switch to `Promise.allSettled` so the remaining categories still render.
- **`src/components/user-catalog-section.tsx:150`** — `DetailModal.copyCode` clipboard not awaited or caught — same false-confirmation issue as the affiliate copy above.
- **`src/components/post-card.tsx:~1222`** — `handleEdit` PATCH failure leaves the edit modal open with no error message or toast. User has no indication the save failed.
- **`src/components/post-card.tsx:~1114`** — `loadComments` has no loading indicator; on slow connections the comments area appears broken/empty before the fetch resolves.
- **`src/app/(main)/create/CreateContent.tsx:1700`** — Gym search fires on every keystroke with no debounce, flooding `/api/gyms`. Add 300–500ms debounce.
- **`src/app/(main)/profile/[username]/page.tsx:203`** — `handleAcceptRequest` / `handleDeclineRequest` have no try/catch; network failure produces unhandled rejection with no UI revert.
- **`src/components/post-card.tsx:~1261`** — `handleReport` does not check `res.ok`; report modal closes and shows success even on 4xx/5xx.

### Low
- **`src/lib/generate-share-card.ts:43`** — `wrapText` ignores `\n` in captions; intentional line breaks in captions render as a single run on the share card.
- **`src/components/user-catalog-section.tsx:185`** — Empty-photo placeholder renders the raw category label string at `text-6xl`; should be an emoji or icon.
- **`src/components/user-catalog-section.tsx:535`** — `console.error("Failed to fetch catalog:", err)` leaks stack traces in production.
- **`src/components/founding-member-modal.tsx:29`** — `QRCode.toString(...).catch(console.error)` leaks QR errors to production console.

---

## From Light Audit — April 8, 2026

### Low
- **`src/app/(main)/error.tsx:14`** — `console.error("[MainError]", error)` fires unconditionally in the error boundary `useEffect`, logging all client-side errors to the production browser console. Wrap in `if (process.env.NODE_ENV === 'development')`.
- **`src/app/(main)/catalog/page.tsx:3807,3821`** — Two unguarded `console.error` debug calls for missing `_catalogType` edge cases in `handleDelete`/`handleSaveEdited` run in production. Wrap in `NODE_ENV` guard or remove. (Line numbers updated from 2499/2511 after catalog page changes in July 2026.)

---

## From Light Audit — April 7, 2026

### Low
- **`src/app/(main)/notifications/page.tsx:109,121,172,196`** — Multiple `console.error` calls in fetch/mark-read handlers. Review in next deep audit to determine if these should be silenced or surfaced to users.
