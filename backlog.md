# Backlog

Issues found during audits but deferred. Address in future sessions.

---

## From Light Audit — August 2, 2026

### Low
- **`src/app/(main)/workout/WorkoutSession.tsx:89-100`** — Two `setState` calls (`setSession`, `setElapsed`) inside a single `useEffect` with empty deps triggers the `react-hooks/react-compiler` cascading-renders lint error. React 18 batches these, so no actual loop occurs, but refactoring to derive `elapsed` from `session` state (single setState) would silence the warning and remove the risk.

---

## From Light Audit — April 8, 2026

### Low
- **`src/app/(main)/error.tsx:14`** — `console.error("[MainError]", error)` fires unconditionally in the error boundary `useEffect`, logging all client-side errors to the production browser console. Wrap in `if (process.env.NODE_ENV === 'development')`.
- **`src/app/(main)/catalog/page.tsx:2499,2511`** — Two unguarded `console.error` debug calls for missing `_catalogType` edge cases run in production. Wrap in `NODE_ENV` guard or remove.

---

## From Light Audit — April 7, 2026

### Low
- **`src/app/(main)/notifications/page.tsx:109,121,172,196`** — Multiple `console.error` calls in fetch/mark-read handlers. Review in next deep audit to determine if these should be silenced or surfaced to users.
