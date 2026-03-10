# Onboarding Flow Implementation Summary

**Date:** March 7, 2026  
**Scope:** V1 AI onboarding flow for CMC Sober Coach  
**Status:** Implemented — feature-flagged behind `FEATURE_V1=1` and `FEATURE_ONBOARDING_MAP=1`

---

## What Was Built

A full-stack v1 AI onboarding flow that runs a 15–20 minute conversational intake, maps the conversation to a structured user formulation, and seeds all future coaching with a provisional, confidence-annotated profile. The system is ITC-compliant, heuristic (not clinically validated), and designed to refine over time.

---

## Files Changed

### `docs/v1_onboarding_spec.md` — Authoritative Product Spec
**Was:** The original user request (raw prompt text).  
**Now:** A complete 13-section developer-ready product + conversation design specification.

Sections:
1. **Product Goal** — What onboarding is for, what it accomplishes in 15–20 min, and what it explicitly does not claim
2. **Conversational Design Principles** — Tone table, ITC stance, what to avoid, sample AI wording
3. **Onboarding Flow** — All 10 segments with purpose, primary questions, optional follow-ups, internal fields filled, branch triggers, and stopping conditions
4. **Branching Logic** — 12 common user presentations in explicit if/then style (ambivalent, vague, ashamed, minimizing, recent slip, "nothing helps," practical, reflective, intoxicated, and more)
5. **Data Model / Output Schema** — Full TypeScript-typed `OnboardingFormulation` interface with a complete realistic JSON example output
6. **Coach Lens Skill Map** — Six lenses (MI, ACT, DBT, Mindfulness, Self-Compassion, Executive Support) with signal detection, strength/gap inference, and example questions per lens
7. **Profile Bands / Heuristic Scoring** — Low/Emerging/Moderate/Strong criteria for six domains with confidence evidence rules
8. **Behavioral Process Dimensions** — Seven cross-cutting dimensions (impulse↔reflection, solo↔social, avoidance↔approach, etc.) with scale anchors and conversational evidence
9. **Stopping Rules / Efficiency Logic** — Per-segment "enough signal" criteria, turn budget table (12–18 turns total), deferral rules for low-confidence domains
10. **End-of-Onboarding User Summary** — Human-sounding summary template with usage rules (no clinical terms, reflect both risk and strength, 1–2 starting points)
11. **Safety Layer** — Seven scenarios fully specified: suicidal ideation, overdose, withdrawal, blackouts, using alone, polysubstance, domestic violence — each with interrupt behavior and exact response language
12. **UX / Engineering Recommendations** — Field tracking, repetition avoidance, dynamic question selection, partial completion, provisional inference marking, formulation refinement over time
13. **V1 vs. Later Phases** — Clear separation of must-have v1 features vs. explicitly deferred items (embedded psychometric items, progressive onboarding, passive refinement, validated scoring)

---

### `src/server/ai/types.ts` — Full `OnboardingFormulation` Type System
**Added alongside existing `OnboardingProfile`:**

New exported types:
- `ProfileBand` — `'Low' | 'Emerging' | 'Moderate' | 'Strong'`
- `ConfidenceLevel` — `'Low' | 'Medium' | 'High'`
- `CoverageStatus` — `'not_started' | 'partial' | 'complete'`
- `SubstanceEntry` — name, frequency, amount_description, route
- `CurrentUse` — substances array, pattern consistency, change direction, functional impact, disclosure confidence
- `IdealGoal` — goal type, specificity, user stated goal, moderation vision, ambivalence level, values signals, prior attempts
- `TriggerEntry` — category (emotional/situational/relational/sensory/temporal) + description
- `RiskMap` — triggers, high-risk times/places, emotional drivers, social risk factors, craving pattern, habitual pattern flag
- `ProtectionMap` — supportive people/places/routines, emotional anchors, prior successes, professional support status
- `MIProfile`, `ACTProfile`, `DBTProfile`, `MindfulnessProfile`, `SelfCompassionProfile`, `ExecutiveSupportProfile` — each with band fields and a confidence level
- `CoachProfiles` — container for all six lens profiles
- `CommunicationProfile` — style, depth, verbosity, help-seeking style, challenge tolerance, shame sensitivity, engagement level
- `SafetyFlags` — 10 boolean flags (suicidal ideation, self harm, overdose history/recent, withdrawal, withdrawal medically complex, blackout, using alone, polysubstance, DV) + acute risk level + safety notes
- `ConfidenceSummary` — per-domain confidence + overall + low-confidence domain list
- `DimensionScore` — `{ value: number | null, confidence: ConfidenceLevel }` for 1–5 dimension scales
- `BehavioralDimensions` — seven scored dimensions + lapse recovery style + overall confidence
- `SegmentCoverage` — coverage status for each of the 10 onboarding segments
- `OnboardingFormulation` — top-level container for all of the above
- `createEmptyFormulation(session_id)` — factory function returning a blank formulation with all fields at null/default

---

### `src/server/ai/mapping/onboardingMapping.ts` — Rewritten for V1 Schema

**Replaced:** The previous file mapped transcripts to the legacy 8-construct `OnboardingProfile` (selfCompassion, urica, kessler10, who5, dbtWccl, copingSelfEfficacy, assist, asi).

**New primary function: `mapTranscriptToFormulation(sessionId, transcript)`**
- Calls GPT with a detailed mapping prompt
- Returns a fully merged `OnboardingFormulation` (AI result deep-merged with empty defaults so the object is always structurally complete)
- Uses `temperature: 0.2` for conservative, consistent inference
- Uses `response_format: { type: 'json_object' }` for reliable JSON output

**New utility: `inferSegmentCoverage(transcript)`**
- Pure heuristic (no AI call) — runs regex patterns against the transcript
- Returns `SegmentCoverage` with `complete | partial | not_started` for all 10 segments
- Used to populate `segment_coverage` on every formulation

**Mapping prompt** includes:
- Full JSON schema with all field types and allowed values
- Dimension scale reference (1=impulse → 5=reflection, etc.)
- Conservative inference guidelines (null over guessing, confidence tied to evidence strength)
- Safety flag rules (only set to `true` if user explicitly described the situation)

**Legacy shim preserved: `mapTranscriptToProfile(sessionId, transcript)`**
- Still exported for backward compatibility with existing callers
- Internally calls `mapTranscriptToFormulation` then converts the result back to the old `OnboardingProfile` shape
- Attaches the full `OnboardingFormulation` as `.formulation` on the returned object so callers can migrate incrementally

---

### `src/server/ai/promptFragments.ts` — `ONBOARDING_V1_PROMPT` Extended

**Changes to `ONBOARDING_V1_PROMPT`:**

Added to hard guardrails:
- Pre-response check now includes "Am I about to ask more than one question?"
- No-skills-during-onboarding rule with exact redirect language

Added **Branching Logic section** covering 11 presentations:
- Highly ambivalent → reflect both sides, set ambivalence_level = Strong, continue
- Unsure if there's a problem → stay curious, don't diagnose either way
- Vague answers → try concrete framing, accept low confidence after 2 attempts
- Ashamed/guarded → slow down, fewer questions, more reflections
- Minimizing → accept at face value, note low disclosure_confidence, never confront
- Recent slip → use user's language, not "relapse"; receive without alarm
- "Nothing helps" → validate exhaustion, explore what's been tried
- Wants practical help now → acknowledge, redirect briefly, move efficiently
- Prefers reflective → match depth, spend more time on values/identity
- Withdrawal risk → specific language about medical safety; don't advise cold turkey
- Appears intoxicated → name what you're noticing, offer to pause

Added **per-scenario safety response language** inline:
- Suicidal ideation: exact response text including 988 and Crisis Text Line, explicit no-safety-contracts instruction
- Overdose risk: 911 instruction + naloxone mention for opioids
- Domestic violence: DV Hotline + text option, no action push

Updated **Domain 10** to explicitly include communication style assessment with a sample question.

---

### `src/app/api/onboarding/route.ts` — Heuristics and Segment Tracking Expanded

**New heuristic functions:**
- `mentionsCommunicationStyle(text)` — detects "direct," "give it to me straight," "gentle," "reflective," "help me think," etc.
- `mentionsSafetyTopics(text)` — detects safety-relevant disclosures (blackout, overdose, withdrawal, using alone, mixing, suicidal, DV)

**`coverageScore()` expanded:**
- Now scores 8 domains (was 5): added `mentionsFunction`, `mentionsStrengths`, `mentionsReadiness`
- Maximum score is now 8 (was 5)

**`hasEnoughSignal()` updated for segment 9:**
- Segment 9 now satisfied by: communication style mentioned OR safety topics mentioned OR ≥14 user turns

**`shouldOfferSummaryNow()` V1 threshold updated:**
- V1 now requires `score >= 6` (of 8 domains) rather than the previous `score >= 5` (of 5 domains)

**`deriveCurrentSegment()` updated:**
- Added domain 9 (communication style) as a distinct step before closing
- Comments updated to match spec segment naming

---

## Architecture Overview

```
User message
     │
     ▼
route.ts POST handler
     │
     ├─► safetyScreen(input)          — always first; 5-type safety classifier
     │       └─ returns response + X-Safety-Type header if triggered
     │
     ├─► deriveCurrentSegment()       — heuristic segment tracker (0–9)
     ├─► hasEnoughSignal()            — per-segment stopping rule
     │
     ├─► skillsIntercept()            — redirects early skills requests
     ├─► shouldOfferSummaryNow()      — coverage + turn threshold check
     │
     └─► callOpenAI(SYSTEM_PROMPT_V1) — full conversational turn
              │
              SYSTEM_PROMPT_V1 =
                CRISIS_AND_SCOPE_GUARDRAILS
                + ONBOARDING_V1_PROMPT (10-segment flow + branching + safety)

Background (triggered from client at intervals):
     └─► /api/onboarding/map POST
              └─► mapTranscriptToFormulation()
                       ├─► AI mapping call (gpt-4o-mini, temp 0.2, json_object)
                       └─► inferSegmentCoverage() (heuristic, no AI)
                       └─► returns OnboardingFormulation
```

---

## What's NOT in V1 (deferred)

| Feature | Reason |
|---------|--------|
| Embedded psychometric micro-items (SCS, URICA, K10, WHO-5 verbatim) | Requires clinical validation process and informed consent flow |
| Progressive onboarding across multiple sessions | Requires persistent user identity/auth |
| User-visible formulation dashboard | UX complexity + risk of over-claiming |
| Passive refinement through behavior logs | Requires persistent event store + versioning |
| True coach handoff driven by formulation | Manager AI not yet fully wired to formulation fields |
| Validated clinical scoring | Out of coaching scope without clinical validation |
| Demographic / cultural adaptation | V2 personalization layer |

---

## Feature Flags

| Variable | Value to Enable |
|----------|----------------|
| `FEATURE_V1` | `1` |
| `FEATURE_ONBOARDING_MAP` | `1` |
| `NEXT_PUBLIC_LEGAL_ASSESSMENT_DISCLAIMER` | `1` (shows disclaimer in UI) |

V0 onboarding (`SYSTEM_PROMPT_V0`) remains fully functional when either flag is absent.

---

## QA Failure Case — Exercise Onboarding Repeats, Loops, and Leaks Legacy Substance-Use Logic

> **This transcript must be treated as a must-pass QA scenario before implementation is considered successful.**

### Purpose

This is a grounding failure case for the onboarding refactor. The goal is to ensure the revised implementation explicitly addresses every problem documented here. It is not a theoretical edge case — it is a real failure mode that reveals structural weaknesses in the current system.

### Plain-English Bug Statement

> The onboarding fails this exercise case because it does not recognize already-covered material, repeats semantically overlapping questions, lacks turn-shape variety, and leaks legacy substance-use logic into a non-substance onboarding flow.

---

### Failure Scenario Summary

A user comes in for help exercising more, not for substance use. The onboarding gathers some useful material, but the conversation becomes mechanical, repetitive, and eventually looping. Legacy substance-use language is also injected into the exercise flow.

**Key user content already present in the transcript:**

| Domain | What the user said |
|---|---|
| Goal | Wants help exercising more |
| Why now | Nicer weather; wants to look good at the beach |
| Baseline | Desk job, tired after work, little activity, ~6,000 steps/day |
| Barriers | Schedule, tiredness, dislike of exercise, dread, intimidation, not knowing what to do |
| Emotional/cognitive barriers | "Dread," "I'm a failure," "I should just give up," hopelessness |
| Desired outcome | Even doing it once would be better than now; wants to feel stronger, look better, be comfortable shirtless |
| Prior attempts | Gyms, trainers, classes — none sustained |
| Social context | Friends go to the gym but that is intimidating, not supportive |
| Mood concern | Worries the summer will be bad and he may get depressed |

---

### Observed Failures in This Transcript

1. **Repeated near-duplicate questions** — the same domain is probed multiple times with only surface wording changes:
   - weekly activity / current routine / movement now
   - goals / desired outcome / what would be different
   - supports / people / routines
   - prior attempts / what have you tried

2. **No meaningful turn-shape variety** — almost every turn is structured as a short reflection followed by a question.

3. **No reflection-only turn** — every assistant turn contains a question; no turn rests with what has been said.

4. **No loop repair** — after the user says "I already answered that" or "I told you that already," the assistant continues similar probing without acknowledgment or adjustment.

5. **Legacy skills intercept leaks substance-use language** — the phrase "cutting back, stopping, or deciding later what change looks like" appears in an exercise onboarding flow where it is clearly wrong.

6. **The system fails to recognize substantial usable signal** — by the middle of the conversation the system already has enough material for a first-pass picture and continues probing anyway.

7. **The system does not shift approach when frustration is obvious** — user frustration is visible in the transcript and produces no behavioral change in the assistant.

8. **Mood-sensitive content does not change interview strategy** — "I'm worried I'll get depressed" is treated as another generic intake cue rather than a signal requiring a different response.

---

### Diagnostic Implications

| Symptom | Root cause |
|---|---|
| Repeated questions | Coverage recognition is too weak; no semantic duplicate check |
| Loop with no repair | No frustration-detection or repair mode |
| Substance-use language in exercise flow | Old substance-specific intercept logic still leaks into generalized onboarding |
| No turn variety | Turn policy is too narrow; no "no-question needed" mode |
| Continued probing past adequate signal | No mid-conversation consolidation capability |

---

### Acceptance Criteria

#### A. No legacy substance-use language in non-substance onboarding

**Fail if** the assistant uses any of the following in a clearly non-substance case:
- "cutting back"
- "stopping"
- "staying sober"
- "abstinence"
- "relapse"
- substance-use-specific goal framing of any kind

**Pass condition:** Exercise onboarding never uses substance-use-specific intercept language.

---

#### B. No semantic duplicate questioning

**Fail if** the assistant asks materially the same question twice after the user has already answered it, even if the wording changes.

Examples from this failure transcript:
- repeated weekly-routine / activity baseline questions
- repeated desired-outcome / goal questions
- repeated support questions after support context already exists
- repeated prior-attempt questions after prior attempts were already named

**Pass condition:** No domain is re-probed with a semantically duplicate question unless new clarification is genuinely required and explicitly justified.

---

#### C. "Already answered that" must trigger a strategy change

**Fail if** the user says any of the following and the assistant continues re-asking the same domain:
- "already answered that"
- "already discussed this"
- "I said that already"
- "you asked that already"

**Pass condition:** Once the user signals repetition or frustration, the assistant must:
- mark the domain complete or deferred,
- stop re-asking it in the next turn, and
- either summarize what it has, pivot to a genuinely new domain, or explicitly repair the loop.

---

#### D. Turn-shape variety must be present

**Fail if** the transcript remains mostly "brief reflection + one question" throughout.

**Pass condition:** Within a normal onboarding transcript there is visible turn-shape variation including at least:
- one reflection-only turn
- one recap/linking turn
- one rationale-plus-question turn
- variation in response length

---

#### E. Reflection-only turns must be allowed

**Fail if** every assistant turn contains a question.

**Pass condition:** At least one turn in this scenario contains no question and still feels useful and natural.

---

#### F. Coverage recognition must prevent unnecessary re-probing

**Fail if** the system continues to ask about domains that already have adequate signal — including goals, prior attempts, baseline activity, barriers, or social context.

**Pass condition:** Once enough signal exists for a domain, the system moves on or consolidates rather than re-probing shallowly.

---

#### G. Frustration-repair mode must exist

**Fail if** the user shows frustration and the assistant continues with normal intake behavior.

**Pass condition:** When repetition frustration is detected, the assistant shifts mode and does one of:
- acknowledges the loop,
- summarizes what it has heard,
- offers a new angle, or
- moves toward formulation or a transition.

---

#### H. Mood-sensitive content must matter

**Fail if** hopelessness, self-criticism, or concern about getting depressed is treated as just another generic intake cue.

**Pass condition:** The assistant briefly deepens or reflects the mood signal in a way that changes the next move, rather than simply returning to generic goal or support prompts.

---

#### I. Mid-conversation consolidation must become possible

**Fail if** the system continues generic intake questioning long after enough material exists for a useful first-pass picture.

**Pass condition:** Once the conversation has enough meaningful signal, the assistant can consolidate, link, or move toward summary instead of continuing repetitive questioning.

---

### Required Testing Plan Additions

1. **Dedicated transcript-level test or QA harness scenario** for this exercise case. This is a named, required test — not optional coverage.

2. **Required assertions in that test:**
   - No substance-use language appears anywhere in the exercise flow
   - No semantically duplicated goal, baseline, or support questions are asked
   - A user signal of "already answered that" suppresses immediate re-probing of the same domain
   - At least one reflection-only turn is possible within a full onboarding run
   - Frustration cues trigger a repair, summary, or pivot behavior rather than continued intake questioning

3. **Route/policy-level check:** Generalized `skillsIntercept` language must be domain-appropriate. Substance-use-specific phrases must not appear in exercise, sleep, relationship, or other non-substance behavior-change onboarding flows. This should be verifiable at the prompt-fragment or intercept-function level without requiring a full AI call.
