# Security remediation — October 25, 2026

Status: draft for review; not approved for production or App Store release.
Base: 5d5a7b426afc147337a4df0d60d97bf9e8814141. Node 24.22.1, npm 11.9.0.

## Changes

- Upgrade Next and eslint-config-next 16.1.6 → 16.4.3.
- Upgrade next-auth beta.30 → beta.32, resolving Auth.js core to 0.41.3.
- Remove unused @auth/prisma-adapter (no application imports or configured adapter); Royal uses custom Prisma lookups and JWT sessions. Augment JWT through next-auth/jwt instead of relying on a hoisted transitive module. Handle an absent credentials user ID consistently with the existing empty-ID fallback.
- Upgrade Capacitor CLI/core/iOS 8.1.0 → 8.5.3, including the generated Swift package pin. Existing haptics/social-login plugins satisfy the core peer requirement; native compatibility remains a release gate.
- Apply non-force npm audit fixes within declared ranges. Align Prisma CLI, client and both database adapters at 7.10.1 following the CLI security update. No schema changes.
- Remove prisma db push --accept-data-loss from build. Build only generates the client and compiles Next. Database schema changes must be planned and executed separately against the intended database, with backup and review. This patch needs no schema deployment.
- Remove @ts-nocheck from the Prisma initialization module. Fourteen other suppressed files remain; inventory below.
- Add npm run typecheck. Repair health-test environment setup with jest.replaceProperty and restore per test.

## Audit evidence

See 2026-10-25-audit.json for advisory IDs, dependency paths and summarized raw results.

| Check | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Fresh baseline, full dependency tree | 7 | 24 | 11 | 1 |
| Final full dependency tree | 0 | 0 | 3 | 0 |
| Final production-only tree | 0 | 0 | 0 | 0 |

These counts are npm package findings, not a count of independently exploitable defects. The October 11 historical count was not reproduced. A zero audit count is not proof of application security.

The three remaining moderate findings are one transitive chain: @capacitor/cli → xcode → uuid. npm proposes downgrading CLI to 8.4.3 outside the exact pin; no force fix or override applied. They are build-tool findings, not proof of shipped runtime exposure. Review upstream remediation before release; any deferral needs a named owner, rationale and deadline. Always retain the full audit because native iOS lives in devDependencies.

## Validation performed

- Clean npm ci --ignore-scripts succeeded; Prisma generation explicitly run afterward.
- Production build passed with placeholder AUTH_SECRET and an unreachable local-only database URL. No database push or production credentials used.
- TypeScript check passed, including unsuppressed Prisma initialization.
- Jest: 21 suites / 72 tests passed before and after changes.
- Capacitor sync passed and regenerated the Swift package with 8.5.3. This is not an Xcode compilation or device test.
- ESLint on the four changed TypeScript files passed.
- Whole-repository lint is not clean: initial run 50 errors / 54 warnings; updated tooling 81 errors / 58 warnings. New React hooks rules expose existing patterns in untouched screens. No blanket rule suppression added. Review and address separately before calling the overall quality gate green.
- Local production HTTP smoke checks: /api/health 200 with minimal response, /signin and /signup 200, unauthenticated /api/auth/session returns null. /api/posts returns 500 without a reachable database; data-backed behavior has not been validated.

## Required before release

1. Use an isolated staging database and explicitly configured auth secret/domain. Verify Prisma/Neon queries, cold starts and representative read/write transactions after the Prisma upgrade.
2. Test credentials signup/login, password reset, Google web OAuth, native Google and Apple if enabled. Check existing sessions, expiration, logout, invalid tokens and cross-account access denial. Preserve cookie settings; do not rotate production secrets accidentally.
3. Test feed, photo uploads, post create/edit/delete, catalog sharing and referral links, stats/streaks and onboarding on new and established accounts.
4. Compile/archive in Xcode, resolve Swift packages, and run on a real iPhone through TestFlight. Test native Google callbacks, haptics, external links and session persistence after upgrading the installed app.
5. Test the new website against the currently released iOS binary AND the new binary: Capacitor loads royalwellness.app live. A website deployment does not repair old native binaries.
6. Resolve or explicitly accept remaining moderate audit risk and review lint findings. Rerun audits at release time. Keep the previous web deployment available for rollback; native rollout cannot be instantly undone. This patch changes no database schema.

The existing ios-deploy workflow uploads to TestFlight and was not triggered. It references master and a CocoaPods install while this checkout uses main and Swift Package Manager; reconcile the release workflow with the actual Xcode project before using it. Do not trigger it as a substitute for a build-only validation.

## Remaining @ts-nocheck inventory

src/app/p/[id]/page.tsx
src/app/api/achievements/route.ts
src/app/api/admin/users/route.ts
src/app/api/admin/waitlist/route.ts
src/app/api/admin/backfill-founding-members/route.ts
src/app/api/users/suggestions/route.ts
src/app/api/users/[username]/route.ts
src/app/api/users/[username]/following/route.ts
src/app/api/recommendations/route.ts
src/app/api/users/[username]/followers/route.ts
src/app/api/social/follow/route.ts
src/app/api/social/follow-requests/route.ts
src/app/api/gyms/route.ts
src/lib/achievements.ts
