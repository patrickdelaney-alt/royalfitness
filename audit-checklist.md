# Royal — Proactive Audit Checklist

Use this document at the start of every audit session in Claude Code.
Reference it with: *"Run a proactive audit using the audit-checklist.md in the repo."*

---

## Audit Types

| Type | Frequency | Trigger |
|---|---|---|
| Light Audit | Weekly | Monday morning, or after any merge |
| Deep Audit | Monthly | First Monday of each month |
| Feature Audit | On-demand | After any new feature ships |

---

## Light Audit (Weekly ~30 min)

Focus: recently touched files only. Fast, surface-level sweep.

### Scope
- Files changed in the last 7 days (check via git: `git diff --name-only HEAD~7`)
- Any screen a user lands on in the first 3 sessions (onboarding, feed, profile, post creation)

### Checks
- [ ] No visible UI breakage on core screens (feed, profile, notifications, post)
- [ ] All interactive elements (buttons, inputs, modals) respond correctly
- [ ] No obviously broken loading or empty states
- [ ] No console errors or unhandled promise rejections in recently changed files
- [ ] Text is not truncating or overflowing unexpectedly
- [ ] Navigation flows work end-to-end (tab bar, back buttons, modals open/close)

### Output
Run `small-bug-fix` skill on any flagged files. Fix one bug per session max.

---

## Deep Audit (Monthly ~90 min)

Focus: full codebase sweep across all four bug tiers from the `small-bug-fix` skill.

### Auth & Data (Check but do not touch)
- [ ] Supabase RLS policies are present on all user-facing tables
- [ ] No exposed API keys or secrets in client-side code
- [ ] Auth state is handled gracefully (loading, signed out, session expired)
- [ ] No Supabase queries running without error handling

### UI/UX
- [ ] All screens handle three states: loading, empty, error
- [ ] Images have fallback states (broken avatar, missing photo)
- [ ] Modals and sheets close correctly and don't leave ghost overlays
- [ ] Scroll behavior is correct (no double-scroll, no locked scroll)
- [ ] Brand colors are consistent: cream `#f5f2ec`, green `#2d5a27`, gold `#c8a951`
- [ ] Typography is consistent with brand guide (no rogue font weights or sizes)

### Logic & State
- [ ] No duplicate renders or flashing UI on navigation
- [ ] Form inputs reset correctly after submit
- [ ] Optimistic updates (likes, follows) reconcile correctly with server state
- [ ] No stale closures in useEffect hooks

### Performance
- [ ] No unnecessary API calls firing on every render
- [ ] Images are appropriately sized (no full-res uploads rendering at thumbnail size)
- [ ] No uncleared intervals or timeouts in unmounted components

### The Catalog (Royalties Layer)
- [ ] Referral links generate and copy correctly
- [ ] Earnings/royalties data displays accurately and handles zero-state gracefully
- [ ] No broken flows in the invite or affiliate path

### Output
Produce a prioritized list of findings. Fix highest-impact item only. Log the rest to `backlog.md`.

---

## Feature Audit (Post-Ship)

Run immediately after any new feature merges to production.

### Checks
- [ ] The feature works end-to-end on a fresh account
- [ ] The feature works end-to-end on an established account with real data
- [ ] The 3 files most likely affected by this change have no new regressions
- [ ] No new console errors introduced
- [ ] Feature degrades gracefully if the network is slow or the API call fails
- [ ] Nothing adjacent to the feature is broken (check the screen before and after in the user flow)

---

## Royal-Specific Risk Areas

These are the parts of the app most likely to develop subtle bugs. Always include in deep audits.

| Area | Risk | What to check |
|---|---|---|
| Post creation | Photo upload edge cases | Single photo, multiple photos, delete mid-upload |
| Notifications | Text rendering | Long strings, empty notifications, unread count |
| Profile | Avatar + bio edit | Save state, cancel state, image fallback |
| Feed | Infinite scroll | End of feed state, refresh, empty feed |
| The Catalog | Referral flow | Link generation, share sheet, earnings display |

---

## Constraints (Inherited from `small-bug-fix` skill)

- **Never** modify auth, payments, or DB schema during an audit
- **Never** introduce new dependencies
- **One bug fixed per session** — log the rest
- All fixes must be under ~10 lines of code
- If a fix feels complex, add it to `backlog.md` and move on

---

## Session Starter Prompt (copy into Claude Code)

```
Please run a [LIGHT / DEEP / FEATURE] audit on the Royal codebase using the audit-checklist.md.

Focus on: [paste scope — e.g. "files changed this week" or "post creation flow"]

Do not fix anything yet. First give me a prioritized list of findings, ranked by user-facing impact. Then we'll pick one to fix.
```

---

*Last updated: April 2026 | Repo: patrickdelaney-alt/royalfitness*
