# Backlog

Issues found during audits but deferred. Address in future sessions.

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
