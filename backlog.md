# Backlog

Issues found during audits but deferred. Address in future sessions.

---

## From Light Audit — April 7, 2026

### Low-Medium
- **`src/app/(main)/create/CreateContent.tsx:1310`** — `console.error` logs post validation schema details to the browser console in production. Should be removed or wrapped in a `process.env.NODE_ENV === 'development'` guard.

### Low
- **`src/app/(main)/notifications/page.tsx:109,121,172,196`** — Multiple `console.error` calls in fetch/mark-read handlers. Review in next deep audit to determine if these should be silenced or surfaced to users.
