# Backlog

Issues found during audits but deferred. Address in future sessions.

---

## From Light Audit — November 1, 2026

### No new bugs found this session

Scope: files changed in last 7 days (security remediation PR #286, plus PRs #284, #282, #281).

All recently changed code reviewed and looks correct:
- `onboarding-guard.ts` — redirect loop fix is solid, no edge cases found.
- `SignInClient.tsx` / `SignUpClient.tsx` — auth flows, OAuth, native Google, form validation all look correct.
- `referral-url.ts` / `referral-links/route.ts` — absolute URL generation and dedup logic are correct.
- `onboarding/layout.tsx` — correctly delegates to onboarding guard.

### Low — pre-release checklist for security remediation (PR #286)
- **`docs/security/2026-10-25-remediation.md`** — Security patch merged but the "Required before release" section lists 6 manual steps not yet checked off (staging DB test, auth flow test, feature smoke test, Xcode/TestFlight build, website/native compat check, lint cleanup). Do not ship to App Store until these are complete. The production-only npm audit is clean (0 findings); 3 moderate build-tool findings remain (capacitor → xcode → uuid).
- **Lint** — 81 errors / 58 warnings reported in the remediation doc (pre-existing patterns exposed by updated React hooks rules). Not new, but needs addressing before the codebase can claim a green quality gate.

---

## From Light Audit — August 16, 2026

### Fixed this session
- **`src/lib/generate-share-card.ts:175-183` (`wrap`)** — The ellipsis condition used `ctx.measureText(text).width > maxWidth * maxLines` to decide whether to add `…`, but this can be false even when content was truncated (short trailing words keep the total below the threshold). Fixed by tracking truncation with an explicit `truncated` flag set on the loop `break`, so an ellipsis is always added whenever words were dropped.

### No new deferred issues this session

---

## From Streak Cache / Catalog Cooldown Audit — August 9, 2026

### Fixed this session
- **`src/app/api/posts/route.ts`**, **`src/app/api/posts/[id]/route.ts`** — `invalidateStreakCache()` was fire-and-forget after post create/delete, racing an immediate `/api/stats` read (which could see the old, still-in-TTL `streakComputedAt` and serve a stale streak). Now awaited before the response is sent.
- **`src/app/api/posts/route.ts`** — the `CatalogShareCooldown` unique constraint (`P2002`) was only handled via a pre-check `findFirst` before the transaction; a genuine race (double-submit, retry) that slipped past the pre-check hit the real constraint inside `$transaction` and fell into the generic 500 handler. Now caught specifically and returns the same on-brand 409 ("You've already shared this item today...").

### Medium — deferred, out of scope for this session
- **`src/lib/achievements.ts` (`computeStreaks`), `src/app/api/achievements/route.ts:108-142`, `src/app/api/recommendations/route.ts:98-117`** — each reimplements its own streak calculation directly from `Post` rows instead of using the canonical `getOrRefreshStreaks()` in `src/lib/user-stats.ts`. They're always "live" (no staleness risk), but the three implementations use different lookback windows (500 posts / 200 posts / unbounded vs. the 730-day bounded query backing `/api/stats`), so the streak shown on achievements/recommendations can legitimately disagree with the number on the stats page. Worth consolidating onto one implementation.

---

## From Light Audit — August 9, 2026

### Fixed this session
- **`package.json`** — `@testing-library/dom` (peer dep of `@testing-library/react`) was missing from `devDependencies`, causing 3 test suites to fail with "Cannot find module '@testing-library/dom'". Moved to `devDependencies`. All 36 tests now pass.

### Low
- **`src/app/api/stats/leaderboard/route.ts:81`** — Parameter `r` implicitly has `any` type; `tsconfig` is strict enough to flag this. Add an explicit type annotation.
- **`src/app/api/users/suggested/route.ts:31-33`** — Three implicit `any` parameters (`f`, `b`, `b`). Add types matching the Prisma follow/block shapes.
- **`src/app/api/health/__tests__/route.test.ts:33,42,80`** — Tests write to `process.env.NODE_ENV` (read-only in strict TS). Refactor to use `jest.replaceProperty` or a helper to avoid the TS2540 error.

---

## From Light Audit — April 8, 2026

### Low
- **`src/app/(main)/error.tsx:14`** — `console.error("[MainError]", error)` fires unconditionally in the error boundary `useEffect`, logging all client-side errors to the production browser console. Wrap in `if (process.env.NODE_ENV === 'development')`.
- **`src/app/(main)/catalog/page.tsx:2499,2511`** — Two unguarded `console.error` debug calls for missing `_catalogType` edge cases run in production. Wrap in `NODE_ENV` guard or remove.

---

## From Light Audit — April 7, 2026

### Low
- **`src/app/(main)/notifications/page.tsx:109,121,172,196`** — Multiple `console.error` calls in fetch/mark-read handlers. Review in next deep audit to determine if these should be silenced or surfaced to users.
