# CMC Sober Coach – v1 Implementation Roadmap

This roadmap translates the v0 → v1 scope into concrete, incremental steps. Each step lists: files to add/update, functionality, v0 preservation strategy, and testing/safety.

## 0) Preliminaries
- **Files**: `README.md` (note v1 branch), `docs/v1_plan.md` (this file)
- **Functionality**: Document plan and branching strategy. No code changes.
- **Preserve v0**: Work on `v1` branch; keep v0 routes/pages intact.
- **Testing/Safety**: None.

## 1) Architecture Expansion: Multi‑Agent Coaches + Manager AI (Scope §2, §4.2)
- **Files**:
  - Create `src/server/ai/`:
    - `types.ts` (coach event, tag, plan types)
    - `coaches/dbtCoach.ts`
    - `coaches/selfCompassionCoach.ts`
    - `coaches/cbtCoach.ts`
    - `manager/planManager.ts`
  - API:
    - `src/app/api/events/route.ts` (POST metrics/events)
    - `src/app/api/plan/route.ts` (POST synthesize plan from conversation slice)
  - Config:
    - `src/server/ai/promptFragments.ts` (prompt snippets per coach)
- **Functionality**:
  - Implement pure functions to: accept message turns, extract signals/tags (heuristics + LLM), emit `CoachEvent[]`.
  - `planManager` collects recent `CoachEvent[]` and synthesizes a "personalized plan" paragraph + action items via OpenAI.
  - Include a shared “crisis & scope guardrails” prompt fragment in 
    `src/server/ai/promptFragments.ts` that all coaches import to avoid diagnosis/medical advice and keep scope.
  - `events` API stores in-memory (for v1) and echoes back; `plan` API returns synthesized guidance.
- **Preserve v0**: Do not change existing API responses. New endpoints are additive. Keep onboarding/advice flows working.
- **Testing/Safety**:
  - Unit tests for `inferPhase`, coach taggers (deterministic heuristics).
  - Sanity tests for manager output limits (length, no PHI synthesis).

## 2) Metrics Logging (Scope §2, §4.2, §2 Expanded Feature Set)
- **Files**:
  - `src/server/store/memory.ts` (in‑memory store for events)
  - Extend `src/app/api/events/route.ts` to write/read
  - Types in `src/server/ai/types.ts`
  - src/server/util/redactPII.ts (utility: name/email/phone redaction)
- **Functionality**:
  - POST `/api/events` to log `CoachEvent` per user/session (ephemeral id via cookie/session header).
  - GET `/api/events?limit=` to retrieve recent for debugging.
  - Standardize a session identity strategy (HTTP‑only cookie or URL param) so events, mapping, and plan synthesis join on the same session.
- **Preserve v0**: No changes to existing endpoints; optional logging calls from existing pages behind a feature flag.
- **Testing/Safety**:
  - Validate payload shape; strip PII; rate‑limit by IP/session.

## 3) Onboarding Upgrade: Practical‑Curiosity Protocol (Scope §2, §4.3)
- **Files**:
  - Update `src/app/api/onboarding/route.ts` (prompt: map to assessments without verbatim items; keep summary flow and crisis checks)
  - Client `src/app/onboarding/page.tsx` (toggle to enable v1 intake mode; maintain current behavior default)
  - Add `src/server/ai/mapping/onboardingMapping.ts` (map transcript → assessment fields)
  - Add `src/app/api/onboarding/map/route.ts` (POST transcript → structured fields)
- **Functionality**:
  - Enhance system prompt to elicit data that populates Self‑Compassion, URICA, K10, WHO‑5, DBT‑WCCL, CSE, ASSIST, ASI constructs (indirectly).
  - Add background mapping endpoint to transform transcript to a typed `OnboardingProfile` (with confidence flags).
- **Preserve v0**: Ship v1 prompt under a `?v1=1` query or header; default remains v0. Keep "Finish & Generate Report" intact.
- **Testing/Safety**:
  - Mapping tests: sample transcripts → expected fields present/blank.
  - Enforce one‑question rule; crisis interlocks unchanged.
  - Show a consent/assessment disclaimer controlled by an env flag (e.g., LEGAL_ASSESSMENT_DISCLAIMER); this is educational/coaching, not diagnostic.

### Bug fixes & polish folded into v1
- Strip leaked HTML comments (`<!--OFFER_SUMMARY-->`, `<!--SUMMARY_DONE-->`) from any user-visible text; add a unit test to assert these never render.
- Tighten the intake summary trigger (offer only after sufficient signal; e.g., minimum inferred constructs or confidence threshold).
- De-duplicate follow-ups to avoid re-asking the same motivation/intent.
- Add export options to the intake summary (Copy / Download PDF / Email).

## 4) Advice Loop Upgrade: Multi‑Coach Listening (Scope §2, §4.2)
- **Files**:
  - Update `src/app/advice/page.tsx` to optionally call `/api/events` after each user turn and show plan suggestions from `/api/plan` when permissioned.
  - Update `src/app/api/advice/route.ts` to include few‑shot hints that reference coach tags (non‑breaking).
- **Functionality**:
  - After assistant message, post conversation slice to log coach tags; on "Would it be helpful…" yes → fetch `/api/plan` and render options.
- **Preserve v0**: Keep existing one‑paragraph response. New UI renders under a feature flag or "Get Advice" mode only.
- **Testing/Safety**:
  - Guardrails: no medical claims; max token/length; single question etiquette remains.

### Bug fixes & polish folded into v1
- Unify chat UI so messages always render inline (remove any separate "view transcript" detours in lessons).
- Ensure Enter submits and Shift+Enter inserts newline across all chat inputs; add unit and e2e tests.
- Remove scripted “Next” lesson advances that ignore user input; drive progression from the last user message.

### Roleplay Scenario Integration
- Integrate roleplay scenarios stored in `public/roleplays` into the advice loop.
- Each roleplay follows the structured conversational protocol (Reflection → Validation → Follow-up → Action Menu).
- Ensure roleplays render through the unified ChatPane UI so they appear as live conversations (no separate transcript viewer).
- Allow the Manager AI or a feature flag to trigger roleplay practice (e.g., DBT skill roleplay when relevant to tags).
- Preserve v0: advice flow can still operate without roleplays; enable roleplay mode behind a feature flag.
- Testing/Safety: verify crisis interlocks remain active during roleplays; add unit/e2e tests for action menu rendering.

## 5) Learning Hub: Modules + Progress (Scope §2, §4.3)
- **Files**:
  - Pages: `src/app/learn/modules/page.tsx`, `src/app/learn/[slug]/page.tsx` (extend)
  - Components: `components/lesson/LessonGuide.tsx` (enhance), `components/lesson/AvatarTalkingHead.tsx` (use existing spec)
  - Store: `src/server/store/progressMemory.ts` (in‑memory)
  - API: `src/app/api/progress/route.ts` (GET/POST module progress)
- **Functionality**:
  - Multi‑lesson modules with local in‑memory progress per session; show practiced/reflection states; optional avatar feedback.
- **Preserve v0**: Existing `learn` pages remain; modules view added as new routes.
- **Testing/Safety**:
  - a11y checks for keyboard focus; ensure lessons work without avatar.

## 6) Plan Builder UI (Scope §2, §4.2)
- **Files**:
  - Page: `src/app/plan/page.tsx`
  - Components: `src/components/plan/PlanCard.tsx`, `PlanList.tsx`
- **Functionality**:
  - Display latest synthesized plan with 3–5 suggested actions and brief rationale. Allow user "accept" to pin in session.
- **Preserve v0**: New page. Link from advice when permission is given.
- **Testing/Safety**:
  - Ensure empty‑state renders; word count caps; no lists until permission.

## 7) PWA Delivery (Scope §2, §4.4)
- **Files**:
  - `public/manifest.webmanifest`
  - `src/app/icon.png`, `src/app/apple-touch-icon.png`
  - `src/app/robots.txt`
  - `src/app/service-worker.ts` (or workbox setup)
  - `next.config.js` updates for headers and SW
- **Functionality**:
  - Installable PWA, offline caching of shell and static content; show install prompt.
- **Preserve v0**: Progressive enhancement only; app works without SW.
- **Testing/Safety**:
  - Lighthouse PWA checks; fallbacks for offline chat (disabled with clear messaging).

## 8) Notifications (Scope §2, §4.4)
- **Files**:
  - `src/app/api/notifications/route.ts` (stub)
  - Client helpers `src/client/notifications.ts`
- **Functionality**:
  - Permission prompt flow and stubbed push subscription (server TBD). Use no‑op in demo.
- **Preserve v0**: Opt‑in only; no prompts on first load.
- **Testing/Safety**:
  - Graceful denial paths; feature flag by env.

## 9) Accessibility and Safety (Scope §4.5)
- **Files**:
  - a11y checklist `docs/a11y.md`
  - Crisis text constants centralization `src/server/safety/constants.ts`
- **Functionality**:
  - Consistent crisis responses; color contrast; focus traps for modals.
- **Preserve v0**: Replace duplicated strings with import but keep text identical.
- **Testing/Safety**:
  - Automated axe run in dev; unit tests for crisis regex to avoid false positives.

### Bug fixes & polish folded into v1
- Replace the blocked Naloxone video with an embeddable source or self-hosted MP4 with captions and a text transcript fallback.
- 911/988 buttons: show a disabled/demo state with tooltip in non-production; wire to the device dialer in production builds.

## 10) Testing Strategy (Scope §4.5, §4.2)
- **Files**:
  - `tests/unit/*.test.ts` for coach taggers, mapping, advice phase logic
  - `tests/e2e/*.spec.ts` (Playwright) for onboarding/advice happy paths and crisis
  - `package.json` scripts: `test`, `e2e`
  - tests/utils/redaction.test.ts
- **Functionality**:
  - Build minimal deterministic tests to keep guardrails intact.
  - Verify Enter-to-send and Shift+Enter newline across Advice and Learn inputs.
  - Cover HTML comment redaction (no leaked comments in rendered output).
- **Preserve v0**: Tests run in CI but do not block local demo usage.
- **Testing/Safety**:
  - Add rate‑limit stubs; ensure OPENAI key missing → graceful fallbacks.

## 11) Deployment/Config
- **Files**:
  - `.env.example` updates (OPENAI_MODEL, FEATURE flags)
  - `README.md` v1 instructions
- **Functionality**:
  - Document env flags: `FEATURE_V1=1`, `FEATURE_PWA=1` etc.
    - Feature flags (documented in .env.example):
      - FEATURE_V1
      - FEATURE_COACHES
      - FEATURE_PLAN
      - FEATURE_ONBOARDING_MAP
      - FEATURE_PWA
      - FEATURE_PUSH
      - FEATURE_ROLEPLAYS
- **Preserve v0**: Flags default off; v0 behavior unchanged without flags.
- **Testing/Safety**:
  - Manual smoke test matrix: v0-only, v1‑features enabled.

### Bug fixes & polish folded into v1
- Home modal “Don’t show again”: persist via localStorage or cookie and provide a way to re-open the modal from settings/help.
- “Just Chat” page: either hide it or wire it to the same chat component used by Get Advice to prevent drift.

---

### Incremental Ship Order
1) Types + in‑memory store + events API
2) Coach taggers + manager API
3) Advice integration (permissioned plan)
4) Onboarding mapping endpoint + prompt enhancements (behind flag)
5) Learning modules + progress (in‑memory)
6) Plan page
7) PWA + Notifications (flags)
8) a11y + tests + docs
