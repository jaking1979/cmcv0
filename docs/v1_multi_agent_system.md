# V1 Multi-Agent Coaching System

## Overview

The V1 system uses a **Coaching Symphony** model: Kato is the primary coaching voice at all times, supported by six specialized coaching lenses. Rather than independent agents taking turns, supporting coaches inform Kato's stance, language, and skill offerings — surfacing only when especially relevant or when the user explicitly selects a lens.

---

## The Coaching Team

### Primary Voice

#### Kato — Conductor · Primary Coach
**Modality:** Motivational Interviewing · ACT · Behavioral Skills Synthesis

Kato is the single coaching voice the user always hears. Kato integrates context from all six supporting lenses and responds using whichever framework fits the moment — without labeling modalities clinically. Every supporting coach surfaces *through* Kato, not alongside it.

---

### Supporting Coaches (Lenses)

Supporting coaches are not independent speakers. They are frameworks Kato draws from. Each lens can be activated two ways:

1. **User selects it** during the Team Intro first-run flow (becomes the `activeCoach` for the session)
2. **Conversation signals** surface it (via coach event tags injected into the system prompt)

#### 1. Mindfulness Coach
**Focus:** Present-moment awareness, noticing without judgment, grounding
**Modality:** MBSR · MBCT · Mindfulness-Based Relapse Prevention (MBRP)

**When active:** Brings attention to present-moment experience — sensations, the space between urge and action. Uses grounded, sensory language. Does not push mindfulness practice; lets the lens inform curiosity.

#### 2. DBT Skills Coach
**Focus:** Emotion regulation, distress tolerance, interpersonal effectiveness
**Modality:** Dialectical Behavior Therapy (DBT) — Linehan

**Detects:**
- Distress tolerance needs ("overwhelming", "can't handle", "unbearable", "crisis")
- Emotion dysregulation ("mood swings", "out of control", "explosive")
- Interpersonal challenges ("conflict", "boundary", "assertive")
- Mindfulness opportunities

**When active:** Identifies the most relevant DBT module (mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness). Offers one skill at a time as an option, not a prescription.

#### 3. Self-Compassion Coach
**Focus:** Self-kindness, common humanity, mindful awareness
**Modality:** Mindful Self-Compassion (MSC) — Neff & Germer

**Detects:**
- Self-criticism ("I'm a failure", "I hate myself")
- Shame and embarrassment
- Harsh self-judgment ("should have known better")
- Isolation feelings ("I'm the only one")
- Over-identification with problems ("I am my addiction")

**When active:** Notices harsh self-narratives and reflects them without amplifying or arguing. When readiness is present, may invite the "dear friend" reframe. Does not moralize or push.

#### 4. ACT Coach
**Focus:** Values, acceptance, psychological flexibility
**Modality:** Acceptance and Commitment Therapy (ACT) — Hayes, Strosahl & Wilson

**When active:** Helps the user notice thoughts as thoughts rather than facts. Stays curious about what they value underneath the struggle. When readiness is present, may invite small, values-aligned action alongside discomfort — not as a way to eliminate difficult feelings.

#### 5. Motivational Interviewing Coach
**Focus:** Ambivalence, readiness, change talk
**Modality:** Motivational Interviewing (MI) — Miller & Rollnick

**When active:** Stays off the motivational seesaw — does not argue for change or against it. Reflects ambivalence without resolving it prematurely. Elicits the user's own reasons and values; does not supply them. Plans only when readiness is clearly present.

#### 6. Executive Functioning Coach
**Focus:** Planning, focus, follow-through
**Modality:** Executive Function Coaching · CBT Strategies · ADHD-Informed Practice

**When active:** Treats planning and time struggles as EF capacity challenges — not motivation problems. Helps break things into the smallest possible next step when the user is ready. Acknowledges EF barriers are often neurological, not character flaws. Specific and concrete, avoids vague encouragement.

---

## How the System Works

### Architecture: Coaching Symphony (not Round-Robin Agents)

```
User message
     │
     ▼
/api/advice  ──► Selects system prompt based on:
                  1. ITC_MASTER_PROMPT (always — highest priority)
                     └─ auto-generated from docs/ITC_master_rules.md at build time
                        via scripts/generateMasterPrompt.mjs →
                        src/server/ai/generated/itcMasterRules.ts
                  2. CRISIS_AND_SCOPE_GUARDRAILS (always)
                  3. App stage context (LIGHT_CHAT / ONBOARDING / PERSONALIZED_CHAT)
                  4. Personalization (name, memory summary)
                  5. Active coach lens hint (if activeCoach ≠ 'kato')
                  6. V1 coach signal tags (background context, confidence > 0.6)
                  7. Few-shot roleplay examples (2, matched to input)
     │
     ▼
Kato responds as single voice, informed by all active layers
```

> **Important:** `ITC_MASTER_PROMPT` is not a hand-written string. It is auto-generated
> from `docs/ITC_master_rules.md` at build time and committed to source control. Editing
> `promptFragments.ts` directly will have no effect — edit the master rules doc and run
> `npm run generate:prompt` to regenerate. `npm run build` and `npm run dev` both do this
> automatically. Run `npm run validate:prompt` to confirm the generated file is current.

### Background Analysis Pipeline (V1 — DBT / SC / CBT only)

In parallel with each user-assistant exchange, the three original pattern-detection coaches analyze the conversation:

```
After each exchange (when FEATURE_V1=1 and FEATURE_COACHES=1):
     │
     ▼
POST /api/events
     │
     ├── analyzeForDBT()       → detects: distress, dysregulation, interpersonal, mindfulness signals
     ├── analyzeForSelfCompassion() → detects: self-criticism, shame, isolation, over-identification
     └── analyzeForCBT()       → detects: cognitive distortions, avoidance, behavioral activation needs
     │
     ▼
Events stored in session memory (confidence ≥ 0.3 threshold)
     │
     ▼
High-confidence tags (> 0.6) injected into next system prompt as
"CONVERSATION SIGNALS" — background context only, not named back to user
```

> **Note:** The Mindfulness, ACT, MI, and Executive Functioning coaches do not yet have their own pattern-detection analysis functions in the events pipeline. They operate exclusively through the `activeCoach` lens system in the advice API.

### Active Coach Lens (User-Selected)

During the **Team Intro** first-run flow, users can browse all 7 coaches and choose to "start with" a specific supporting coach. This sets `activeCoach` for the session, which is passed to `/api/advice` and activates a corresponding lens hint in the system prompt.

```typescript
// Client sends with every message:
{
  activeCoach: 'mi' | 'dbt' | 'self-compassion' | 'act' | 'mindfulness' | 'exec' | 'kato'
}

// Server selects the appropriate ACTIVE LENS block
// to append to the system prompt
```

Default: `'kato'` (no additional lens hint — Kato integrates freely).

### Plan Synthesis (Manager AI)

When sufficient coach events have been collected, the Manager AI synthesizes them into a personalized action plan.

```
Input: Recent CoachEvents (DBT / SC / CBT) + last 10 messages

Manager AI:
1. Extract signals from each coach type
2. Prioritize by urgency and feasibility
3. Generate 3–5 specific, actionable items
4. Categorize (immediate / short-term / long-term)
5. Assign difficulty ratings

Output: PersonalizedPlan with structured actions
```

---

## First-Run Flow & App Stages

The advice page manages a full first-run state machine persisted in localStorage:

```
PRE_CONSENT
  → (user consents)
POST_CONSENT_NAME
  → (user submits name)
FIRST_RUN_CHOICE
  → "Start onboarding"    → ONBOARDING
  → "Start talking now"   → LIGHT_CHAT
  → "Meet your team"      → TEAM_INTRO

TEAM_INTRO
  → (tap a coach)         → COACH_LENS
  → "Start chatting"      → LIGHT_CHAT

COACH_LENS
  → "← Back"             → TEAM_INTRO
  → "Start with [coach]" → LIGHT_CHAT (with activeCoach set)

ONBOARDING                → LIGHT_CHAT (on completion)

LIGHT_CHAT                — active coaching, no full onboarding
PERSONALIZED_CHAT         — active coaching, onboarding complete
```

### System Prompt by Stage

| Stage | System Prompt |
|---|---|
| `PRE_CONSENT` | ITC master rules + crisis guardrails + pre-consent instructions (coaching vs. therapy only) |
| `LIGHT_CHAT` | ITC master rules + crisis guardrails + stage context — warm, present, no assumed history |
| `PERSONALIZED_CHAT` | ITC master rules + crisis guardrails + stage context — draws on memory summary appropriately |
| `ONBOARDING` | ITC master rules + crisis guardrails + stage context — listen-first orientation, no skills yet |

> All stages include `ITC_MASTER_PROMPT` as the first layer. Prior to this change, `PRE_CONSENT`
> only included `CRISIS_AND_SCOPE_GUARDRAILS`. The full ITC behavioral stance now applies at
> every stage, including before consent is given.

---

## API Endpoints

### POST /api/advice
**Purpose:** Generate Kato's response (streaming edge function)

**Request:**
```json
{
  "input": "...",
  "history": [{"role": "user", "content": "..."}, ...],
  "userId": "usr_...",
  "appStage": "LIGHT_CHAT",
  "consentAccepted": true,
  "preferredName": "Alex",
  "activeCoach": "mi",
  "memorySummary": "..."
}
```

**Response:** Plain text stream (`text/plain`)

### POST /api/events
**Purpose:** Log coach insights from conversation analysis

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event_...",
      "sessionId": "sess_...",
      "coachType": "self-compassion",
      "tags": [{"type": "emotion", "value": "self-criticism", "confidence": 0.85}],
      "confidence": 0.85
    }
  ]
}
```

### POST /api/plan
**Purpose:** Generate personalized action plan from coach events

**Request:**
```json
{
  "messages": [{"role": "user", "content": "..."}, ...]
}
```

**Response:**
```json
{
  "success": true,
  "plan": {
    "id": "plan_...",
    "summary": "...",
    "actions": [
      {
        "id": "action_1",
        "title": "Grounding Technique",
        "description": "When you feel overwhelmed...",
        "category": "immediate",
        "difficulty": "easy"
      }
    ],
    "confidence": 0.8
  }
}
```

### GET /api/events
**Purpose:** Retrieve recent events for debugging/monitoring

### GET /api/plan
**Purpose:** Retrieve latest plan for session

---

## ITC Master Rules Pipeline

`docs/ITC_master_rules.md` is the single authoritative source for all AI behavioral rules. It is never read at runtime. Instead, a build-time generator converts it into a committed TypeScript file that is bundled with the Edge function.

```
docs/ITC_master_rules.md          (edit here)
         │
         ▼
scripts/generateMasterPrompt.mjs  (npm run generate:prompt)
         │  - strips markdown formatting
         │  - normalizes whitespace
         │  - escapes for template literal
         ▼
src/server/ai/generated/
  itcMasterRules.ts               (committed, do not edit manually)
         │
         ▼
src/server/ai/promptFragments.ts
  export const ITC_MASTER_PROMPT = ITC_MASTER_RULES
         │
         ▼
src/app/api/advice/route.ts
  systemPromptPreConsent()  → [ ITC_MASTER_PROMPT, CRISIS_AND_SCOPE_GUARDRAILS, ... ]
  systemPromptKato()        → [ ITC_MASTER_PROMPT, CRISIS_AND_SCOPE_GUARDRAILS, ... ]
```

### Keeping the Generated File Current

| Command | When to run |
|---|---|
| `npm run generate:prompt` | After editing `docs/ITC_master_rules.md` |
| `npm run validate:prompt` | To confirm the committed file is up-to-date (safe for CI) |
| `npm run dev` | Runs `generate:prompt` automatically before starting Next.js |
| `npm run build` | Runs `generate:prompt` automatically before building |

### Editing the Master Rules

1. Edit `docs/ITC_master_rules.md`
2. Run `npm run generate:prompt`
3. Commit both `docs/ITC_master_rules.md` and `src/server/ai/generated/itcMasterRules.ts`

Do not edit `src/server/ai/generated/itcMasterRules.ts` or the `ITC_MASTER_PROMPT` block in `promptFragments.ts` directly — those changes will be overwritten on the next generate run.

---

## Feature Flags

```bash
# .env.local
FEATURE_V1=1              # Master V1 flag — enables coach signal injection
FEATURE_COACHES=1         # Enable background coach analysis (DBT/SC/CBT pipeline)
FEATURE_PLAN=1            # Enable plan generation
FEATURE_ONBOARDING_MAP=1  # Enhanced onboarding mapping
```

> URL parameter flags (`?v1=1`, `?debug=1`) have been removed. Feature flags are now server-side environment variables only.

---

## Safety & Guardrails

### Crisis Detection
- Always active, regardless of feature flags or app stage
- Triggered on: "suicid", "kill myself", "end my life", "hurt myself", "harm myself", "overdose", "od"
- Returns safety message immediately; bypasses all coach analysis and system prompt selection
- Does **not** trigger on normal emotional support requests

### Scope Boundaries
- Kato is a behavior coach — not a therapist, clinician, or medical professional
- No diagnosis, no medical advice
- Professional referral encouraged when appropriate
- Pre-consent gate enforced server-side (not just UI)

### Privacy
- PII redacted from messages before coach analysis storage
- Session-based memory (server-side, cleared on restart)
- User identity: anonymous UUID, persisted in localStorage
- Persistent user context (name, stage, memory summary): localStorage only

### Rate Limiting
- 60 requests per minute per session
- Stricter limits for plan generation

---

## Memory System

User context is persisted in localStorage and sent as `memorySummary` with every message:

- **Preferred name** — used naturally, not in every message
- **App stage** — determines coaching mode and system prompt selection
- **Consent state** — gates coaching content server-side
- **Memory summary** — a plain-text summary of what Kato knows, used as quiet backdrop

---

## Performance Characteristics

### Response Times
- Advice API: ~1–3 seconds (OpenAI call, edge runtime)
- Events API: ~100–300ms (local pattern analysis)
- Plan API: ~2–4 seconds (OpenAI call)

### Token Usage (OpenAI)
- Advice response: ~200–600 tokens
- Plan generation: ~400–800 tokens
- ITC master rules (full doc): ~7,000 tokens per request (input only)
- Active coach lens hint adds: ~30–80 tokens per request
- Coach signal context adds: ~50–150 tokens per request (V1 only)

> The full `docs/ITC_master_rules.md` is injected on every request (~7,000 input tokens).
> On `gpt-4o-mini` this is approximately $0.001 per request — accepted cost for full behavioral
> fidelity. The doc fits well within the model's context window.

---

## Testing Scenarios

### Scenario 1: Self-Compassion Flow
```
User: "I'm such a failure. I hate myself for relapsing."
Expected signal detection: Self-Compassion (high), possibly DBT
Expected Kato stance: Warm, shame-reducing; gently reflects harsh language;
                      does not argue with or reinforce it
```

### Scenario 2: DBT Distress Flow
```
User: "I can't handle this overwhelming feeling. I'm going to explode."
Expected signal detection: DBT (high), possibly Self-Compassion
Expected Kato stance: Slows pace; may offer one distress tolerance skill
                      if readiness is present and the user asks
```

### Scenario 3: MI Ambivalence Flow (active lens)
```
User selects "MI Coach" in Team Intro → starts chat
User: "I want to change but I'm not sure I'm ready."
Active lens: MI
Expected Kato stance: Reflects both sides of ambivalence without resolving;
                      evokes user's own motivation; does not push toward action
```

### Scenario 4: ACT Values Flow (active lens)
```
User selects "ACT Coach" in Team Intro → starts chat
User: "I keep telling myself I'll quit tomorrow. I'm so weak."
Active lens: ACT
Expected Kato stance: Helps user notice the thought as a thought;
                      stays curious about what they value; does not try
                      to eliminate the difficult feeling
```

### Scenario 5: Multi-Signal Flow
```
User: "I'm such a failure (SC). I always mess up (CBT).
       I can't handle this stress (DBT)."
Expected signal detection: All three analysis coaches active
Expected plan focus: Integrated approach; plan synthesized from all signals
```

---

## Troubleshooting

### No coach signals activating
- Messages too short or generic — need stronger emotional/distress language
- Check `FEATURE_V1=1` and `FEATURE_COACHES=1` in environment
- Confidence threshold is 0.3 (lowered from 0.4 for better sensitivity)

### Active coach lens not affecting responses
- Confirm `activeCoach` is being sent in the request body
- Check that it matches a valid `CoachId`: `kato | mindfulness | dbt | self-compassion | act | mi | exec`
- Lens hints are only appended when `activeCoach !== 'kato'`

### Plan generation fails
- Check `OPENAI_API_KEY` is valid
- Check `FEATURE_PLAN=1` in environment
- Plan requires coach events in session memory first

### Empty plan or missing actions
- Parser expects specific format (SUMMARY: ... ACTIONS: ...)
- Check OpenAI response in logs for format deviations

---

## Future Enhancements

### Near-term
- Background pattern-detection for Mindfulness, ACT, MI, and EF coaches
  (currently only DBT, Self-Compassion, CBT have analysis functions in `/api/events`)
- Real-time coach signal strength display in UI
- Plan revision and iteration
- Plan history and tracking
- Add `npm run validate:prompt` to CI pipeline to catch stale generated files before deploy

### V2 Planned
- Database persistence
- User accounts
- Progress tracking over time
- Multi-session plan continuity
- Coach learning from feedback
