# CMC Sober Coach — V1 AI Onboarding Flow
## Developer-Ready Product + Conversation Design Specification

**Audience:** Founders, product, and engineering  
**Status:** V1 implementation spec — heuristic, not clinically validated  
**Governs:** `src/app/api/onboarding/route.ts`, `src/server/ai/promptFragments.ts`, `src/server/ai/mapping/onboardingMapping.ts`

---

## SECTION 1: PRODUCT GOAL

### What This Onboarding Is For

The v1 AI onboarding is a 15–20 minute conversational intake that gives the CMC system enough information to generate a useful **first-pass formulation** of the user — a structured, provisional snapshot of their current substance use, goals, risk landscape, protective factors, skill strengths and gaps, and communication preferences.

This formulation powers personalization from the very first coaching session: it pre-seeds the coach lens skill map, informs the style and tone of responses, and provides the Manager AI with context for synthesizing a starting plan.

### What It Should Accomplish in 15–20 Minutes

1. Understand the user's **current use pattern** — what, when, how often, roughly how much
2. Clarify the user's **goal** — abstinence, moderation, reduction, or undecided — and surface ambivalence without resolving it
3. **Map the risk landscape** — triggers, cravings, high-risk times/situations, emotional patterns
4. **Map the protection landscape** — people, places, routines, emotions, and situations that help
5. **Estimate skill strengths and gaps** across six coaching lenses
6. **Read the user's communication style** to adapt tone, pacing, and depth
7. **Conduct a lightweight safety screen** and route to crisis protocol if needed
8. **Deliver a warm, accurate summary** that the user can see and confirm

### What It Explicitly Does NOT Claim To Do

- This is **not therapy** and not a clinical intake
- It does **not diagnose** any condition, including substance use disorder
- It does **not produce a validated psychometric profile** — all inferences are heuristic and provisional
- It does **not replace professional assessment** — if clinical evaluation is needed, the system says so
- It does **not commit the user to a plan** — all formulation conclusions are starting hypotheses, not facts
- It does **not claim that one onboarding fully defines the user** — the formulation is explicitly designed to be refined over time

---

## SECTION 2: CONVERSATIONAL DESIGN PRINCIPLES

### Governing Stance

The onboarding is informed by **Invitation to Change (ITC)** principles and **Motivational Interviewing (MI)**. This means:

- **Ambivalence is welcomed**, not treated as a problem to resolve
- **Autonomy is preserved at every step** — the user controls pace, depth, and what they share
- **Behavior makes sense in context** — every use pattern is treated as learned, adaptive, or regulatory
- **Reflections come before questions** — the system shows it heard before asking more
- **One question per turn, always**

### Tone and Interaction Style

| Principle | Behavior |
|-----------|----------|
| Conversational, not survey-like | Questions follow naturally from what the user said |
| Warm but efficient | Short validation (1 sentence max), then the next question |
| Non-shaming, non-punitive | Never express alarm, disappointment, or urgency about use patterns |
| Tolerates ambivalence | Holds both "I want to change" and "I'm not sure" without rushing either |
| Adaptive | Matches vocabulary, formality, and pacing to the user's style |
| Structured enough to gather data | Follows segment logic; doesn't repeat; doesn't skip safety |
| Validating | Acknowledges what the user said before moving on |

### What the AI Should Avoid

**Interrogation patterns:** Rapid-fire questions without acknowledgment; closed-ended questions; collecting evidence toward a conclusion

**Over-reassurance:** "You're so brave for sharing that"; "You're doing great!"; cheerleading that creates performance pressure

**Clinical/robotic language:** "Let's assess your current level of substance use"; "What stage of change would you say you're in?"; jargon (AUDIT, URICA, relapse, disorder, detox)

**Premature advice:** No coping skills, strategies, or tool recommendations during onboarding; no plan-building before the formulation is complete

**Robotic transitions:** "Now let's move on to the next topic"; "Good. Moving on."

**Righting reflex:** Jumping to fix, reassure, or reframe when the user expresses discomfort

### Sample AI Wording

- *"That makes sense. Situations like that add up."*
- *"It sounds like [reflection]. Can I ask — [question]?"*
- *"I'm not here to tell you what to do with any of this. I just want to understand what you're dealing with."*
- *"You don't have to answer that if it doesn't feel right."*
- *"I'm curious about [topic]. What's that been like for you?"*
- *"That's useful to know. One more thing — [question]."*

---

## SECTION 3: ONBOARDING FLOW

The onboarding consists of **10 conversational segments**. The AI does not announce transitions. It moves through them naturally. Target: **12–18 user turns** total.

---

### Segment 0: Opening / Frame-Setting

**Purpose:** Welcome, set expectations, invite the user to begin.

**Primary wording:**
> *"Hi — I'm glad you're here. Before we get into anything, I want to tell you what this is: I'm going to ask you some questions over the next 15 minutes or so to get a sense of your situation, your goals, and what tends to help or make things harder. There's no right way to answer. You're the expert on your own life. Ready to start?"*

**Optional follow-ups:**
- If user seems hesitant: *"We can go as slow or fast as you want. Nothing you say here will be judged."*
- If user has already started talking: Skip framing, acknowledge what they said first.

**Internal fields filled:** `communication_profile.engagement_level`, `communication_profile.verbosity`

**Branch triggers:** User jumps straight to disclosure → skip framing, move to Segment 1 content

**Stop when:** User has acknowledged and is ready to begin.

---

### Segment 1: Why Now + User Agenda

**Purpose:** Understand what brought the user here, what they want from the app.

**Primary questions:**
- *"What's been going on that brought you here today?"*
- *"What are you hoping this app can help with?"*

**Optional follow-ups:**
- *"Has something happened recently that made this feel more pressing?"*
- *"When you imagine getting some help with this, what would 'help' actually look like for you?"*

**Internal fields filled:** `ideal_goal.user_stated_goal`, `communication_profile.help_seeking_style`, `risk_map.recent_events`

**Branch triggers:**
- User mentions crisis event → skip to Segment 8 (Safety)
- User is vague ("I just need to do better") → *"When you say 'do better,' what does that mean for you?"*
- User is very specific → move efficiently, don't belabor

**Stop when:** System has a sense of what brought the user here and what they're hoping for.

---

### Segment 2: Current Use Pattern

**Purpose:** Understand what the user is using, how often, roughly how much — without making it feel like a clinical questionnaire.

**Primary questions:**
- *"Can you tell me a bit about what your use looks like right now — what you're using, and kind of when and how often?"*
- *"On a typical week, what does it look like?"*

**Optional follow-ups:**
- *"Is it pretty consistent, or does it vary a lot?"*
- *"Has this changed much recently — more, less, about the same?"*
- *"Have you noticed any effects on how you feel, sleep, or function?"*

**Internal fields filled:** `current_use.substances[]`, `current_use.pattern_consistency`, `current_use.recent_change_direction`, `current_use.functional_impact`, `safety_flags.*` (early flags)

**Branch triggers:**
- Blackouts mentioned → *"Blackouts can sometimes mean the body is dealing with a lot. Has that been happening regularly?"* → flag `safety_flags.blackout_risk`
- Using alone mentioned → flag `safety_flags.using_alone`
- Mixing substances → flag `safety_flags.polysubstance`
- Withdrawal symptoms → flag `safety_flags.withdrawal_risk`
- User minimizes → accept at face value, note low `disclosure_confidence`, don't push
- Heavy use disclosed → receive without alarm: *"Thanks for being honest about that. That helps me understand what you're working with."*

**Stop when:** Primary substance(s) named, rough frequency described, any acute safety flags noted.

---

### Segment 3: Ideal Future / Goals / Ambivalence

**Purpose:** Understand what the user actually wants. Surface ambivalence without trying to resolve it.

**Primary questions:**
- *"What would you like your use to look like, ideally? Even if it feels far away or complicated."*
- *"Is there a specific goal — like cutting back, stopping, or something else — or is it more of a 'figure it out as I go' thing?"*

**Optional follow-ups:**
- *"What would change for you if you got where you wanted to go?"*
- *"Is there a part of you that isn't sure about making changes?"* (if ambivalence signals present)
- *"What's gotten in the way before, if you've tried this?"*

**Internal fields filled:** `ideal_goal.goal_type`, `ideal_goal.ambivalence_level`, `ideal_goal.values_signals[]`, `ideal_goal.prior_attempts`, `coach_profiles.mi.readiness`

**Branch triggers:**
- Wants abstinence → note, don't add caveats or push moderation
- Wants moderation → note, don't push toward abstinence
- Undecided → *"That's okay. A lot of people start here without a clear answer. We can work with that."*
- High ambivalence → *"It sounds like you're holding both — part of you that wants to change, and part that isn't sure. That's really common."* Then move on.
- Recent slip mentioned → *"That's useful context. How has that felt for you?"*

**Stop when:** Goal type assigned (even if "undecided"); ambivalence level estimated.

---

### Segment 4: Risk Map

**Purpose:** Identify triggers, cravings, emotional states, times, places, and situations that make it hardest to meet goals.

**Primary questions:**
- *"What tends to set off the urge to use — or makes it really hard to stay on track?"*
- *"Are there certain times of day, places, or situations where it gets harder?"*
- *"What's usually going on emotionally when it's toughest?"*

**Optional follow-ups:**
- *"Are there people or situations that tend to pull you toward using?"*
- *"What does a high-risk evening look like for you?"*
- *"Is stress a big factor, or is it more about certain specific things?"*

**Internal fields filled:** `risk_map.triggers[]`, `risk_map.high_risk_times[]`, `risk_map.high_risk_places[]`, `risk_map.emotional_drivers[]`, `risk_map.craving_pattern`

**Branch triggers:**
- User says "everything" is a trigger → *"I hear that. When you look back at the last week, was there one moment that really stands out?"*
- User says "nothing" triggers it → accept, note `habitual_pattern = true`
- Overwhelming stress described → probe gently for distress tolerance capacity

**Stop when:** 2–3 distinct risk factors identified across at least 2 categories (emotional, situational, social, temporal).

---

### Segment 5: Protection / Safety Map

**Purpose:** Identify what helps — people, places, routines, emotions, prior successes.

**Primary questions:**
- *"On the flip side — what tends to help? Who or what makes it easier to stay on track?"*
- *"Have there been times — even recently — when you got through a tough moment and didn't use? What made that possible?"*

**Optional follow-ups:**
- *"What does a good day look like for you?"*
- *"Are there places or routines that feel steadying?"*
- *"Is there anything you do — or used to do — that helps when things get hard?"*

**Internal fields filled:** `protection_map.supportive_people[]`, `protection_map.protective_routines[]`, `protection_map.prior_successes[]`, `protection_map.coping_resources_present`

**Branch triggers:**
- User says "nothing helps" → *"That's a hard place to be in. Even small things that maybe slightly help?"*
- User identifies strong support → note warmly and move on
- User mentions therapist or professional → note as resource, ask if currently in contact

**Stop when:** At least 1–2 protective factors identified (person, place, or routine).

---

### Segment 6: Skills Map by Coach Lens

**Purpose:** Estimate the user's current strengths and growth areas across six coaching lenses without naming the frameworks.

**Approach:** Much of this data is gathered organically by Segments 1–5. Segment 6 fills remaining gaps through targeted, natural questions.

**Primary questions (choose based on what's still missing):**
- *"When things get intense and the urge is strong, what do you tend to do in that moment?"* → DBT / distress tolerance
- *"Do you tend to get down on yourself when things go sideways?"* → Self-compassion
- *"Is there anything that really matters to you that connects to this — like something you want to protect or get back to?"* → ACT / values
- *"Do you find it easy to plan things out, or do you tend to decide in the moment?"* → Executive support
- *"Have you tried things before — strategies, apps, programs? What's worked, even a little?"* → Skills breadth

**Optional follow-ups:**
- *"What does it feel like in your body when the urge hits?"* → Mindfulness / interoceptive awareness
- *"What goes through your head when you've slipped or things haven't gone as planned?"* → Self-compassion / lapse recovery

**Internal fields filled:** `coach_profiles.*` (all six lenses), `behavioral_dimensions.*`

**Branch triggers:**
- Strong self-criticism → note `coach_profiles.self_compassion.inner_critic_intensity = "Strong"`, prioritize SC coaching
- Vague about internal experience → note `coach_profiles.mindfulness.interoceptive_awareness = "Low"`
- Chaotic / impulsive patterns → note `coach_profiles.executive_support.structure_need = "Moderate/Strong"`
- Already has strong skill vocabulary → note `coach_profiles.skills_breadth = "Moderate/Strong"`

**Stop when:** Each of the six lenses has at least a provisional band estimate.

---

### Segment 7: Communication Style

**Purpose:** Understand how the user prefers to receive support — direct vs. reflective, practical vs. exploratory.

**Primary questions:**
- *"When you're working through something tough, do you find it more helpful when someone gets practical with you, or when they help you think it through?"*
- *"Would you say you're more of a 'give it to me straight' person, or do you like a gentler approach?"*

**Optional follow-ups:**
- *"Is there anything about how you'd like me to talk to you that would help?"*

**Internal fields filled:** `communication_profile.style`, `communication_profile.challenge_tolerance`, `behavioral_dimensions.prefers_direct_feedback`

**Stop when:** Communication style preference assigned (direct/reflective/mixed).

---

### Segment 8: Safety Screen

**Purpose:** Conduct a lightweight but meaningful safety screen. This segment can be triggered early if signals appear in any prior segment.

**Primary questions (only if not already covered):**
- *"I want to check in about one more thing — are you dealing with anything right now that feels physically unsafe, or that's having you worried about your own safety?"*

**Optional follow-ups (if concern is raised):**
- *"Have you had any experiences where you've overdosed or come close?"*
- *"Do you ever notice withdrawal symptoms — shakes, sweating, feeling sick — when you don't use?"*
- *"Are you generally using alone, or do you usually have people around?"*

**Internal fields filled:** `safety_flags.*` (full screen), `safety_flags.acute_risk_level`

**Branch triggers:**
- Any high-risk disclosure → interrupt normal flow, deliver safety layer response (see Section 11)
- Moderate risk (using alone, blackouts) → note flags, continue onboarding, mention resources at close
- No safety concerns → continue to Segment 9

**Stop when:** Acute risk level assigned (even if "none").

---

### Segment 9: Wrap-Up and Summary

**Purpose:** Summarize what was heard, reflect both strengths and challenges, offer first framing of where coaching might start, ask permission to generate full summary.

**Primary wording:**
- *"I've got a pretty good picture of where you're starting from. Can I take a moment to reflect back what I'm hearing?"*
- [Deliver spoken summary — see Section 10 template]
- *"Does that feel accurate? Is there anything important I missed or got wrong?"*
- *"Would you like me to generate a fuller written summary of what we covered?"*

**Internal fields filled:** `confidence_summary.overall_confidence`, `segment_coverage` (final pass)

**Branch triggers:**
- User corrects the summary → update the relevant field, thank them, re-ask
- User says "not really" or seems disengaged → *"That's okay. We'll get more of it over time."*

**Stop when:** Summary delivered and confirmed (or acknowledged).

---

## SECTION 4: BRANCHING LOGIC

### User Is Highly Ambivalent

**Signal:** Uses both sides ("I want to quit but I also don't"), contradicts themselves across turns.

**Logic:**
- Reflect both sides without resolving: *"It sounds like there's a pull in both directions — wanting things to be different, and also not being sure what that would mean."*
- Do NOT push toward change
- Set `ideal_goal.ambivalence_level = "Strong"`, `coach_profiles.mi.readiness = "Low/Emerging"`
- Continue onboarding — ambivalence doesn't block other data collection
- At close: *"We don't have to resolve this today. The coaching can work alongside whatever you're figuring out."*

---

### User Is Unsure Whether There Is a Problem

**Signal:** "I don't know if it's really an issue," "maybe I'm overthinking it."

**Logic:**
- Do NOT diagnose or reassure either way
- Reflect: *"It sounds like that question is something you're sitting with."*
- Offer curiosity: *"What made you start wondering about it?"*
- Set `ideal_goal.goal_type = "undecided"`; continue gathering use and risk data

---

### User Wants Abstinence

**Signal:** "I want to stop completely," "I'm done with it."

**Logic:**
- Accept without caveats; do NOT suggest moderation as more realistic
- Set `ideal_goal.goal_type = "abstinence"`
- Probe prior attempts: *"Have you tried stopping before? What's that been like?"*
- Flag withdrawal risk if relevant

---

### User Wants Moderation

**Signal:** "I just want to cut back," "I want to drink socially, just not every night."

**Logic:**
- Accept fully; do NOT push toward abstinence
- Set `ideal_goal.goal_type = "moderation"`
- Explore specifics: *"What does 'more control' look like in your mind?"*
- Set `ideal_goal.moderation_vision` from response

---

### User Is Undecided About Goal

**Signal:** "I'm not sure what I want," "I don't know."

**Logic:**
- *"That's a perfectly reasonable place to start. Some people come in knowing exactly what they want; others figure it out over time. Either way works."*
- Set `ideal_goal.goal_type = "undecided"`; continue onboarding

---

### User Gives Vague Answers

**Signal:** One-word responses, "I don't know," "it varies," repeated for multiple questions.

**Logic:**
- Don't interrogate; try a more concrete framing: *"Even just thinking about last week — was there a particular night that stands out?"*
- Or try a different angle: *"Is it easier to talk about what happens before you use, or what happens after?"*
- If vagueness continues: mark field confidence as Low, move on
- At close: *"Some of this is still a bit fuzzy — that's fine. We'll fill in more over time."*

---

### User Minimizes Use

**Signal:** "Just a few drinks," "only on weekends," but context suggests more.

**Logic:**
- Accept what the user says at face value — do NOT challenge minimization
- Set low `current_use.disclosure_confidence`
- Let contradictions live; they'll surface over time
- DO NOT say: "But you mentioned your partner has noticed something — doesn't that suggest it's more serious?"

---

### User Seems Ashamed or Guarded

**Signal:** Short defensive responses; apologizes for use; "I know I shouldn't."

**Logic:**
- Reduce pace: fewer questions, more reflections
- Normalize briefly: *"You don't have to be embarrassed about any of this."*
- Set `communication_profile.shame_sensitivity = "high"`
- Let them lead: *"You can share as much or as little as feels right."*

---

### User Reports Recent Slip

**Signal:** "I just had a really bad week," "I slipped up last night."

**Logic:**
- Receive without alarm or excessive reassurance
- Do NOT say "relapse" — use user's own language or "what happened"
- *"How has that felt for you since?"*
- Set `risk_map.recent_high_risk_event = true`
- If shame is high: *"These things happen. It doesn't erase everything before it."*

---

### User Says "Nothing Helps"

**Signal:** "I've tried everything," "nothing works for me."

**Logic:**
- Receive without contradiction: *"That's exhausting — trying things and not seeing them stick."*
- Explore what's been tried: *"What have you tried? I'm curious what it was like."*
- Set `protection_map.prior_attempts_failed = true`
- Gently probe: *"Was there anything — even something small — that helped at all, even for a little while?"*

---

### User Wants Very Practical Help

**Signal:** "Just tell me what to do," "can we skip the talking and get to the strategies?"

**Logic:**
- Acknowledge: *"I hear you — you want something concrete."*
- Redirect during onboarding: *"Let me ask a couple more things so the suggestions actually fit your situation. Then we can get practical."*
- Set `communication_profile.style = "direct"`, `coach_profiles.executive_support.structure_need = "Moderate/Strong"`
- Move efficiently; cut reflective depth

---

### User Prefers Reflective / Insight-Oriented Help

**Signal:** Asks why-questions, explores meaning, interested in patterns, talks about feelings in detail.

**Logic:**
- Match depth: use more reflective questions; spend more time on values and emotional patterns
- Set `communication_profile.style = "reflective"`, `coach_profiles.act.values_clarity = "Emerging/Moderate"`
- Can go slightly deeper in Segments 3, 4, and 6

---

### User Appears Intoxicated, in Withdrawal, Medically Unwell, Suicidal, or Otherwise High-Risk

**→ See Section 11 (Safety Layer) for full handling.**

Summary:
- If intoxicated: name what you're noticing, offer to pause, gentle harm reduction only
- If withdrawal risk: flag immediately, recommend medical support
- If suicidal: leave normal onboarding, deliver full crisis response
- If medically unwell: express concern, recommend medical evaluation, do not continue normal onboarding

---

## SECTION 5: DATA MODEL / OUTPUT SCHEMA

The `OnboardingFormulation` is the structured internal output. It is provisional, heuristic, and never shown to the user in raw form.

### Top-Level Schema

```typescript
interface OnboardingFormulation {
  session_id: string
  timestamp: number                        // Unix ms
  schema_version: string                   // "1.0"
  current_use: CurrentUse
  ideal_goal: IdealGoal
  risk_map: RiskMap
  protection_map: ProtectionMap
  coach_profiles: CoachProfiles
  communication_profile: CommunicationProfile
  safety_flags: SafetyFlags
  confidence_summary: ConfidenceSummary
  behavioral_dimensions: BehavioralDimensions
  segment_coverage: SegmentCoverage
}

type ProfileBand = 'Low' | 'Emerging' | 'Moderate' | 'Strong'
type ConfidenceLevel = 'Low' | 'Medium' | 'High'
type CoverageStatus = 'not_started' | 'partial' | 'complete'
```

### CurrentUse
```typescript
interface CurrentUse {
  substances: SubstanceEntry[]            // required; may be empty []
  pattern_consistency: 'daily' | 'heavy_episodic' | 'irregular' | 'unknown' | null
  recent_change_direction: 'increasing' | 'decreasing' | 'stable' | 'unknown' | null
  functional_impact: string | null        // plain language
  disclosure_confidence: ConfidenceLevel
}
interface SubstanceEntry {
  name: string                            // "alcohol", "cannabis", "opioids"
  frequency: string | null               // "daily", "3-4x/week"
  amount_description: string | null      // "5-6 drinks per night"
  route: string | null                   // only if disclosed
}
```

### IdealGoal
```typescript
interface IdealGoal {
  goal_type: 'abstinence' | 'moderation' | 'reduction' | 'harm_reduction' | 'undecided' | null
  goal_specificity: 'clear' | 'vague' | 'none' | null
  user_stated_goal: string | null        // verbatim or near-verbatim
  moderation_vision: string | null       // only if goal_type = "moderation"
  ambivalence_level: ProfileBand
  values_signals: string[]               // e.g. ["family", "health", "work"]
  prior_attempts: boolean | null
  prior_attempt_description: string | null
}
```

### RiskMap
```typescript
interface RiskMap {
  triggers: TriggerEntry[]
  high_risk_times: string[]
  high_risk_places: string[]
  emotional_drivers: string[]
  social_risk_factors: string[]
  craving_pattern: 'sudden' | 'gradual' | 'situational' | 'mixed' | null
  habitual_pattern: boolean
  recent_high_risk_event: boolean
}
interface TriggerEntry {
  category: 'emotional' | 'situational' | 'relational' | 'sensory' | 'temporal'
  description: string
}
```

### ProtectionMap
```typescript
interface ProtectionMap {
  supportive_people: string[]
  supportive_places: string[]
  protective_routines: string[]
  emotional_anchors: string[]
  prior_successes: string[]
  prior_attempts_failed: boolean
  coping_resources_present: boolean
  professional_support_current: boolean
  professional_support_type: string | null
}
```

### CoachProfiles
```typescript
interface CoachProfiles {
  mi: MIProfile
  act: ACTProfile
  dbt: DBTProfile
  mindfulness: MindfulnessProfile
  self_compassion: SelfCompassionProfile
  executive_support: ExecutiveSupportProfile
}
interface MIProfile {
  motivation_level: ProfileBand; readiness: ProfileBand
  ambivalence_tolerance: ProfileBand; confidence: ConfidenceLevel
}
interface ACTProfile {
  values_clarity: ProfileBand; psychological_flexibility: ProfileBand
  experiential_avoidance: ProfileBand; confidence: ConfidenceLevel
}
interface DBTProfile {
  distress_tolerance: ProfileBand; emotion_regulation: ProfileBand
  interpersonal_effectiveness: ProfileBand; mindfulness_skills: ProfileBand
  confidence: ConfidenceLevel
}
interface MindfulnessProfile {
  interoceptive_awareness: ProfileBand; present_moment_attention: ProfileBand
  nonjudgmental_stance: ProfileBand; confidence: ConfidenceLevel
}
interface SelfCompassionProfile {
  self_kindness: ProfileBand; common_humanity: ProfileBand
  lapse_recover_style: 'learn' | 'collapse' | 'mixed' | null
  inner_critic_intensity: ProfileBand; confidence: ConfidenceLevel
}
interface ExecutiveSupportProfile {
  planning_capacity: ProfileBand; follow_through: ProfileBand
  impulse_gap: ProfileBand; structure_need: ProfileBand
  confidence: ConfidenceLevel
}
```

### CommunicationProfile
```typescript
interface CommunicationProfile {
  style: 'direct' | 'reflective' | 'mixed' | null
  preferred_depth: 'surface' | 'moderate' | 'deep' | null
  verbosity: 'brief' | 'moderate' | 'verbose' | null
  help_seeking_style: 'instrumental' | 'exploratory' | 'mixed' | null
  challenge_tolerance: 'low' | 'moderate' | 'high' | null
  shame_sensitivity: 'low' | 'moderate' | 'high' | null
  engagement_level: 'low' | 'moderate' | 'high' | null
}
```

### SafetyFlags
```typescript
interface SafetyFlags {
  suicidal_ideation: boolean; self_harm_risk: boolean
  overdose_history: boolean; overdose_recent: boolean
  withdrawal_risk: boolean; withdrawal_medically_complex: boolean
  blackout_risk: boolean; using_alone: boolean
  polysubstance: boolean; dv_risk: boolean
  acute_risk_level: 'none' | 'low' | 'moderate' | 'high'
  safety_notes: string | null
}
```

### ConfidenceSummary
```typescript
interface ConfidenceSummary {
  current_use: ConfidenceLevel; ideal_goal: ConfidenceLevel
  risk_map: ConfidenceLevel; protection_map: ConfidenceLevel
  coach_profiles: ConfidenceLevel; communication_profile: ConfidenceLevel
  safety_flags: ConfidenceLevel; overall: ConfidenceLevel
  low_confidence_domains: string[]
}
```

### BehavioralDimensions
```typescript
interface BehavioralDimensions {
  impulse_reflection: DimensionScore        // 1=impulse, 5=reflection
  solo_social_coping: DimensionScore        // 1=solo, 5=social
  avoidance_approach: DimensionScore        // 1=avoidance, 5=approach
  planned_in_moment: DimensionScore         // 1=in-the-moment, 5=planned
  relief_seeking_values_guided: DimensionScore // 1=relief, 5=values-guided
  lapse_recovery_style: 'learn' | 'collapse' | 'mixed' | null
  prefers_direct_feedback: DimensionScore   // 1=gentle, 5=direct
  confidence: ConfidenceLevel
}
interface DimensionScore { value: number | null; confidence: ConfidenceLevel }
```

### SegmentCoverage
```typescript
interface SegmentCoverage {
  seg0_opening: CoverageStatus; seg1_why_now: CoverageStatus
  seg2_current_use: CoverageStatus; seg3_goals: CoverageStatus
  seg4_risk_map: CoverageStatus; seg5_protection_map: CoverageStatus
  seg6_skills_map: CoverageStatus; seg7_communication: CoverageStatus
  seg8_safety: CoverageStatus; seg9_summary: CoverageStatus
}
```

### Realistic Example Output

```json
{
  "session_id": "sess_20260307_abc123",
  "timestamp": 1741369200000,
  "schema_version": "1.0",
  "current_use": {
    "substances": [{ "name": "alcohol", "frequency": "daily", "amount_description": "4-6 drinks most evenings, more on weekends", "route": "oral" }],
    "pattern_consistency": "daily",
    "recent_change_direction": "increasing",
    "functional_impact": "sleep disrupted, irritable mornings, missing gym, partner concerned",
    "disclosure_confidence": "Medium"
  },
  "ideal_goal": {
    "goal_type": "moderation",
    "goal_specificity": "vague",
    "user_stated_goal": "I just want to have more control over it.",
    "moderation_vision": "Drinking on weekends only, 2-3 drinks max",
    "ambivalence_level": "Moderate",
    "values_signals": ["health", "relationship with partner", "feeling in control"],
    "prior_attempts": true,
    "prior_attempt_description": "Tried dry January twice, got to day 10 and 18"
  },
  "risk_map": {
    "triggers": [
      { "category": "temporal", "description": "Evenings after work, especially stressful days" },
      { "category": "emotional", "description": "Stress and frustration from work" },
      { "category": "relational", "description": "Arguments with partner" }
    ],
    "high_risk_times": ["weekday evenings", "Friday nights"],
    "high_risk_places": ["home couch", "kitchen"],
    "emotional_drivers": ["stress", "frustration", "loneliness"],
    "social_risk_factors": ["work happy hours"],
    "craving_pattern": "gradual",
    "habitual_pattern": true,
    "recent_high_risk_event": false
  },
  "protection_map": {
    "supportive_people": ["partner (sometimes)", "friend Marcus"],
    "supportive_places": ["gym", "outdoor spaces"],
    "protective_routines": ["morning workouts", "cooking dinner mindfully"],
    "emotional_anchors": ["feeling clear-headed on sober mornings"],
    "prior_successes": ["18 sober days during dry January last year"],
    "prior_attempts_failed": false,
    "coping_resources_present": true,
    "professional_support_current": false,
    "professional_support_type": null
  },
  "coach_profiles": {
    "mi": { "motivation_level": "Moderate", "readiness": "Emerging", "ambivalence_tolerance": "Moderate", "confidence": "Medium" },
    "act": { "values_clarity": "Emerging", "psychological_flexibility": "Low", "experiential_avoidance": "Moderate", "confidence": "Low" },
    "dbt": { "distress_tolerance": "Low", "emotion_regulation": "Low", "interpersonal_effectiveness": "Emerging", "mindfulness_skills": "Low", "confidence": "Medium" },
    "mindfulness": { "interoceptive_awareness": "Low", "present_moment_attention": "Low", "nonjudgmental_stance": "Emerging", "confidence": "Low" },
    "self_compassion": { "self_kindness": "Low", "common_humanity": "Emerging", "lapse_recover_style": "collapse", "inner_critic_intensity": "Strong", "confidence": "Medium" },
    "executive_support": { "planning_capacity": "Moderate", "follow_through": "Emerging", "impulse_gap": "Low", "structure_need": "Moderate", "confidence": "Medium" }
  },
  "communication_profile": {
    "style": "direct", "preferred_depth": "moderate", "verbosity": "moderate",
    "help_seeking_style": "instrumental", "challenge_tolerance": "moderate",
    "shame_sensitivity": "moderate", "engagement_level": "high"
  },
  "safety_flags": {
    "suicidal_ideation": false, "self_harm_risk": false,
    "overdose_history": false, "overdose_recent": false,
    "withdrawal_risk": false, "withdrawal_medically_complex": false,
    "blackout_risk": false, "using_alone": true, "polysubstance": false, "dv_risk": false,
    "acute_risk_level": "low",
    "safety_notes": "Often drinks alone in the evening. No acute medical risk identified."
  },
  "confidence_summary": {
    "current_use": "Medium", "ideal_goal": "Medium", "risk_map": "High",
    "protection_map": "Medium", "coach_profiles": "Low", "communication_profile": "Medium",
    "safety_flags": "High", "overall": "Medium",
    "low_confidence_domains": ["act", "mindfulness"]
  },
  "behavioral_dimensions": {
    "impulse_reflection": { "value": 2, "confidence": "Medium" },
    "solo_social_coping": { "value": 2, "confidence": "Medium" },
    "avoidance_approach": { "value": 2, "confidence": "Low" },
    "planned_in_moment": { "value": 2, "confidence": "Medium" },
    "relief_seeking_values_guided": { "value": 2, "confidence": "Medium" },
    "lapse_recovery_style": "collapse",
    "prefers_direct_feedback": { "value": 4, "confidence": "Medium" },
    "confidence": "Low"
  },
  "segment_coverage": {
    "seg0_opening": "complete", "seg1_why_now": "complete",
    "seg2_current_use": "complete", "seg3_goals": "complete",
    "seg4_risk_map": "complete", "seg5_protection_map": "complete",
    "seg6_skills_map": "partial", "seg7_communication": "complete",
    "seg8_safety": "complete", "seg9_summary": "complete"
  }
}
```

---

## SECTION 6: COACH LENS SKILL MAP

### Lens 1: Motivational / MI

**Signals to listen for:** Explicit desire to change vs. resistance; ambivalence markers ("but," "I don't know"); discrepancy language ("I want X but keep doing Y"); confidence language; commitment language

**Example questions:**
- *"What's your sense of how ready you feel to make changes — on a gut level?"*
- *"Is there a part of you that's more on board than another?"*

**Infer strengths:** User voluntarily sought the app; uses action language early; names specific reasons for change; expresses readiness with concrete plans

**Infer gaps:** High ambivalence without self-awareness; persistent "I don't know"; heavy external motivation only ("my partner wants me to")

**User goals indicating interest:** "I want to understand why I keep doing this," "I need something to help me feel more motivated"

---

### Lens 2: ACT / Values

**Signals to listen for:** Values language ("my kids," "my health," "who I want to be"); psychological flexibility vs. rigidity; fusion with thoughts ("I AM an addict," "I'll always fail"); experiential avoidance ("I drink to not feel X"); willingness language

**Example questions:**
- *"Is there anything that really matters to you that connects to this?"*
- *"What does the drinking give you — what is it doing for you?"*

**Infer strengths:** Spontaneous values language; can describe what matters; expresses willingness despite difficulty

**Infer gaps:** Struggles to name what matters; use described purely functionally; avoidance language dominant

**User goals indicating interest:** "I want to figure out what I really want," "I feel lost"

---

### Lens 3: DBT / Distress Tolerance and Emotion Regulation

**Signals to listen for:** Emotional intensity ("overwhelming," "I can't handle it," "I explode"); use as primary coping for acute distress; impulse-driven patterns; interpersonal conflict as trigger; absence of any distress tolerance strategies

**Example questions:**
- *"When the urge is really strong, what do you usually do in that moment?"*
- *"Is it more like the feeling comes on fast and you act, or does it build up?"*

**Infer strengths:** Describes deliberate pause strategies; mentions grounding, exercise, calling someone

**Infer gaps:** Use is the only named response to distress; patterns are impulsive; emotional overwhelm is primary driver

**User goals indicating interest:** "I need help managing stress," "I act before I think," "I need better coping strategies"

---

### Lens 4: Mindfulness

**Signals to listen for:** Body awareness language ("I feel it in my chest"); present-moment vs. future/past orientation; self-observation ability ("I notice I..."); nonjudgmental stance; ability to describe internal states with nuance

**Example questions:**
- *"What do you notice in your body when a craving hits?"*
- *"Can you usually tell when an urge is coming, or does it catch you off guard?"*

**Infer strengths:** Rich internal language; can observe patterns from outside; present-tense descriptive language

**Infer gaps:** Can't describe internal states; past/future-dominated; "I don't know what I feel"

**User goals indicating interest:** "I want to be more aware," "I feel disconnected from myself"

---

### Lens 5: Self-Compassion

**Signals to listen for:** Self-critical language after slips ("I'm such a failure," "I have no willpower"); harsh vs. kind inner narrator; isolation thinking ("I'm the only one who can't do this"); lapse response style (learn vs. collapse)

**Example questions:**
- *"When something doesn't go the way you planned — like a slip — what do you tend to say to yourself?"*
- *"Do you tend to be hard on yourself about this?"*

**Infer strengths:** Self-compassionate language; contextualizes failures; describes getting back up after setbacks

**Infer gaps:** Intense self-criticism; shame language; "I should know better"; prolonged shame spiral after slip

**User goals indicating interest:** "I beat myself up a lot," "I hate that I keep failing"

---

### Lens 6: Executive Support / Planning / Follow-Through

**Signals to listen for:** Planning language ("I was trying to only have 2 but then..."); follow-through failures despite clear intentions; impulsivity at point of use; difficulty maintaining routines; mentions benefits of external structure

**Example questions:**
- *"Do you find it easier to plan things out in advance, or do you tend to decide in the moment?"*
- *"Have you tried setting rules for yourself about it? How has that gone?"*

**Infer strengths:** Can name and follow through on plans; has stable routines; planning described as helpful

**Infer gaps:** Plans consistently broken; impulsive decision point; "I start with a plan but then..."

**User goals indicating interest:** "I need accountability," "I can't stick to anything," "I need structure"

---

## SECTION 7: PROFILE BANDS / HEURISTIC SCORING

> These are heuristic, provisional estimates — not validated clinical scores. Store as `{ band: ProfileBand, confidence: ConfidenceLevel }`.

### Mindfulness / Awareness

| Band | Criteria |
|------|----------|
| **Low** | Cannot describe internal states; unaware of craving onset; reacts without noticing |
| **Emerging** | Some self-observation but inconsistent; can name triggers after the fact |
| **Moderate** | Notices patterns; some body awareness; beginning to catch cravings before acting |
| **Strong** | Rich self-observational language; describes internal states with nuance; uses noticing as a tool |

**Raises confidence:** Explicit body-awareness language, present-tense self-observation, describes craving phenomenology  
**Lowers confidence:** Single-word responses, "I don't know" when asked about internal states

---

### Self-Compassion / Reset Capacity

| Band | Criteria |
|------|----------|
| **Low** | Intense self-criticism; shame dominates after slip; prolonged collapse |
| **Emerging** | Some self-criticism; can occasionally bounce back; aware of harsh self-talk |
| **Moderate** | Can contextualize slips; some self-kindness; doesn't stay in shame long |
| **Strong** | Consistently treats self with kindness; sees slips as information; gets back up quickly |

**Raises confidence:** How user describes a past slip; language used about self after difficulty  
**Lowers confidence:** User never mentioned a slip, difficulty, or self-regard

---

### Skills Breadth

| Band | Criteria |
|------|----------|
| **Low** | No named coping strategies; uses only one approach (usually substance) |
| **Emerging** | Knows 1–2 strategies but uses inconsistently; often defaults to substance |
| **Moderate** | Has a repertoire; can name multiple strategies; uses some regularly |
| **Strong** | Rich and flexible skill set; selects strategies based on context |

**Raises confidence:** User names specific strategies spontaneously; describes prior skill learning  
**Lowers confidence:** Vague answers to coping questions; no named strategies despite prompting

---

### Values Clarity

| Band | Criteria |
|------|----------|
| **Low** | Cannot connect behavior change to anything that matters; goal is purely avoidance-based |
| **Emerging** | Mentions values vaguely ("I want to be healthier"); connection tenuous |
| **Moderate** | Names 1–2 specific values; can articulate how they connect to the change goal |
| **Strong** | Multiple values clearly named; intrinsic motivation strong; change framed as identity-aligned |

**Raises confidence:** Spontaneous values language; specific named relationships or life areas  
**Lowers confidence:** External-only motivation; purely avoidance-framed goal

---

### Motivation / Readiness

| Band | Criteria | URICA analog |
|------|----------|-------------|
| **Low** | No change goal; primarily here due to external pressure | Precontemplation |
| **Emerging** | Acknowledges problem; ambivalent; considering change | Contemplation |
| **Moderate** | Has a goal; taking some action; building confidence | Preparation / early Action |
| **Strong** | Actively working on change; has momentum | Action / Maintenance |

---

### Executive Support Need

| Band | Criteria |
|------|----------|
| **Low** | Strong planning capacity; follow-through intact; impulse gap reasonable |
| **Emerging** | Plans sometimes work; some follow-through; can use reminders |
| **Moderate** | Frequent plan-breaking; impulse dominates; benefits from external structure |
| **Strong** | Significant EF challenges; plans rarely stick; high structure need |

> "Strong" executive support need = most need for support, not most competence.

---

## SECTION 8: BEHAVIORAL PROCESS DIMENSIONS

These cross-cutting dimensions are inferred during onboarding and refined over time. Stored with `{ value: 1–5 | null, confidence: ConfidenceLevel }`.

### 1. Impulse ↔ Reflection (1=impulse, 5=reflection)
**Why it matters:** Determines how much pre-moment planning vs. in-the-moment intervention is needed.  
**Evidence for impulse:** "I don't even think about it, I just pour a drink"; very short gap between urge and use  
**Evidence for reflection:** "I usually debate with myself first"; can observe the decision process

### 2. Solo ↔ Social Coping (1=solo, 5=social)
**Why it matters:** Whether coaching should emphasize internal resources or social connection.  
**Evidence for solo:** Copes alone; reluctant to reach out; uses independently  
**Evidence for social:** "I call a friend when I'm struggling"; uses primarily in social contexts

### 3. Avoidance ↔ Approach (1=avoidance, 5=approach)
**Why it matters:** Readiness for ACT-based acceptance vs. active behavioral experiments.  
**Evidence for avoidance:** Uses to escape negative feeling; "I just need to not feel this"  
**Evidence for approach:** Willing to sit with discomfort; curious about patterns

### 4. Planned ↔ In-the-Moment (1=in-the-moment, 5=planned)
**Why it matters:** Emphasis on anticipatory planning vs. moment-of-use skills.  
**Evidence for planned:** "I set myself rules but then break them" — planning is in the toolkit  
**Evidence for in-the-moment:** Decisions happen purely situationally; no planning discussion

### 5. Relief-Seeking ↔ Values-Guided (1=relief, 5=values-guided)
**Why it matters:** Primary motivational driver. Determines DBT-first vs. ACT-first emphasis.  
**Evidence for relief-seeking:** "It's the only thing that makes me feel better"  
**Evidence for values-guided:** "I'm doing this for my kids"; intrinsic motivation clearly named

### 6. Lapse → Learn ↔ Lapse → Collapse
**Why it matters:** Predicts post-slip response; determines self-compassion scaffolding need.  
**Evidence for learn:** "Last time I slipped I figured out that [X] was the trigger"  
**Evidence for collapse:** "Every time something goes wrong I give up"; shame spiral language

### 7. Prefers Direct Feedback ↔ Prefers Gentle Support (1=gentle, 5=direct)
**Why it matters:** Directly informs communication style of all future coaching.  
**Evidence for direct:** "Just tell me what to do," "give it to me straight"  
**Evidence for gentle:** Appears sensitive to criticism; shame language; appreciates validation before advice

---

## SECTION 9: STOPPING RULES / EFFICIENCY LOGIC

### Core Principle

The AI should not ask a question if the answer has already been provided. Ask until each domain has enough signal to assign a provisional band + confidence, then move on.

### "Enough Signal" Per Segment

| Segment | Minimum to Move On |
|---------|-------------------|
| Seg 0 (Opening) | User acknowledged and ready |
| Seg 1 (Why now) | 1 stated reason; general goal direction implied |
| Seg 2 (Current use) | Primary substance named; rough frequency; 1 functional impact |
| Seg 3 (Goals) | Goal type assigned (even if "undecided"); ambivalence estimated |
| Seg 4 (Risk map) | 2+ trigger categories; at least 1 high-risk time or situation |
| Seg 5 (Protection) | 1+ protective factor identified |
| Seg 6 (Skills map) | Each of 6 lenses has at least Low/Emerging estimate |
| Seg 7 (Communication) | Style preference assigned |
| Seg 8 (Safety) | Acute risk level assigned (even if "none") |
| Seg 9 (Summary) | Summary delivered; user acknowledged |

### When to Defer to Later Sessions

If a segment hasn't reached enough signal after 2 focused turns:
1. Note domain in `confidence_summary.low_confidence_domains[]`
2. Mark segment as `"partial"` in `segment_coverage`
3. Move on — do not persist with a stuck segment
4. Flag for follow-up in next check-in

### Turn Budget

Target: **12–18 user turns** across all segments

| Segment | Target Turns |
|---------|-------------|
| Seg 0 | 1 |
| Segs 1–3 | 2–3 each |
| Segs 4–5 | 2–3 each |
| Seg 6 | 2–3 (draws from earlier turns) |
| Seg 7 | 1–2 |
| Seg 8 | 0–1 (may already be cleared by earlier flags) |
| Seg 9 | 1–2 |

**Verbose users:** Let them speak. A rich story in 5 turns may cover Segments 1–4. Don't interrupt.  
**Brief users:** Accept lower confidence and move on. Don't pile on follow-ups.

---

## SECTION 10: END-OF-ONBOARDING USER SUMMARY

The summary is delivered conversationally at the end of Segment 9. It is NOT a clinical report — it is a warm, accurate reflection.

### Template

> *"Here's what I'm hearing from you.*
>
> *You've been dealing with [brief honest description of current use — plain language]. You came here because [reason they gave] — and your goal right now is [goal type in plain terms].*
>
> *The toughest times tend to be [1–2 key risk factors, in user's language]. But you've also got [1–2 protective factors — person, routine, or past success].*
>
> *One thing I noticed is that [1 observation about skill strength or gap, framed supportively]. That feels like a good starting point.*
>
> *This is a first pass — I'll get a better picture as we keep talking. Does this feel roughly right, or is there something important I missed?"*

### Rules for the Summary

- Maximum ~100 words spoken; full written summary can be longer
- Uses the user's own language wherever possible
- Reflects BOTH risk and strength — never only one
- Doesn't overclaim: "I'm hearing," "it sounds like," "this feels like a first pass"
- Identifies 1–2 starting points — not a full plan
- Ends with a check-in question
- Zero clinical terms: no "relapse," "disorder," "dependence," "addict"

---

## SECTION 11: SAFETY LAYER

The safety layer runs **in parallel** with the normal flow — always active. When a safety signal appears, it interrupts immediately.

### Suicidal Ideation / Self-Harm Risk

**Triggers:** "I want to die," "I've been thinking about hurting myself," explicit suicidal statements, self-harm disclosure

**Response:**
1. Interrupt all onboarding
2. *"I'm concerned about what you're sharing. It sounds like you're in real pain right now."*
3. *"I'm an AI, and this goes beyond what I can hold alone."*
4. Offer resources as a menu — not demands:
   - 988 Suicide & Crisis Lifeline (call or text)
   - Crisis Text Line: Text HOME to 741741
   - Emergency: 911
5. Do NOT make safety contracts or demand promises
6. Do NOT continue normal onboarding
7. Offer to return only if user indicates acute risk has passed

**System flags:** `safety_flags.suicidal_ideation = true`, `safety_flags.acute_risk_level = "high"`

---

### Overdose Risk

**Triggers:** "I think I took too much," "my friend just passed out," high-dose opioid use with distress

**Response:**
1. Treat as possible medical emergency
2. *"If you or someone with you is having trouble breathing or can't be woken up, call 911 right now."*
3. Naloxone mention if opioid-related: *"If opioids are involved, naloxone can help — it's at many pharmacies without a prescription."*
4. Do NOT continue onboarding

---

### Dangerous Withdrawal Risk

**Triggers:** Stopping alcohol or benzos after heavy daily use; tremors, sweating, shaking when not using; history of withdrawal seizures

**Response:**
1. *"Stopping [alcohol/benzos] suddenly after using heavily every day can sometimes be medically dangerous. It might be worth talking to a doctor before you stop, just to be safe."*
2. Do NOT advise cold turkey
3. Set `safety_flags.withdrawal_risk = true`, `safety_flags.withdrawal_medically_complex = true`
4. Continue onboarding only if user confirms they're not currently in withdrawal

---

### Blackouts

**Triggers:** "I've been blacking out," "I don't remember what happened"

**Response:** *"Blackouts are worth paying attention to — they usually mean the body is dealing with a lot."*  
Set `safety_flags.blackout_risk = true`; continue onboarding

---

### Using Alone

**Triggers:** Using in isolation, mentions of injecting alone

**Response:** For opioid users, briefly: *"It's worth knowing that naloxone is available at many pharmacies — some people keep it as a precaution."*  
Set `safety_flags.using_alone = true`; continue onboarding

---

### Polysubstance / Dangerous Mixing

**Triggers:** Mixing opioids with alcohol or benzos; multiple high-risk substances

**Response:** *"Some combinations carry more risk than using one thing alone. Is that something you've thought about?"*  
Set `safety_flags.polysubstance = true`; continue unless acute danger present

---

### Domestic Violence / Coercive Environment

**Triggers:** Partner control over substance use; using to cope with violence; fear of what happens at home

**Response:** *"It sounds like the home environment adds another layer to all of this."*  
Offer: *"If you ever feel unsafe, the National Domestic Violence Hotline is 1-800-799-7233. You can also text START to 88788."*  
Set `safety_flags.dv_risk = true`; do NOT push them to take action; continue onboarding with sensitivity

---

## SECTION 12: UX / ENGINEERING RECOMMENDATIONS

### Field Tracking

- Each field in `OnboardingFormulation` carries a `ConfidenceLevel`
- Fields are `null` when not yet populated
- A field is "confidently filled" when: non-null AND confidence is `"Medium"` or `"High"`
- The `segment_coverage` object tracks which of 10 segments are `complete` / `partial` / `not_started`

### Avoiding Repetitive Questioning

- Before generating each AI turn, pass current `segment_coverage` state to the system prompt
- The AI is instructed not to ask about domains already marked `"complete"`
- For `"partial"` domains, allow one targeted follow-up only

### Dynamic Next Question Selection

Priority order:
1. Check if any `safety_flags` are unscreened → always prioritize safety
2. Move through segments 0–9 in order; skip `"complete"` segments
3. Within a segment, ask primary question first; follow-ups only if stopping condition not met
4. After Segment 5, draw from organic conversation; only ask what's genuinely missing

### Partial Completion

- If user exits early, save current `OnboardingFormulation` with all `segment_coverage` statuses
- On return: *"We got through most of this last time — let me just fill in a couple things we didn't get to."*
- Do NOT restart for users who completed >50% of segments

### Marking Inferences as Provisional

- `confidence: "Low"` → inferred from context (not explicitly stated)
- `confidence: "Medium"` → clearly implied by multiple signals
- `confidence: "High"` → user explicitly stated the fact
- User-facing summary uses tentative language for Low/Medium confidence inferences

### Refining Formulations Over Time

- Check-in conversations compare current behavior reports against initial formulation; flag divergences
- After 5+ sessions, re-run mapping on accumulated conversation history and update formulation
- `low_confidence_domains` domains are targeted by early check-in questions
- When coach tags a new dimension (e.g., high emotion_regulation gap), update `coach_profiles` band
- `OnboardingFormulation` is versioned by `timestamp` — treat as a living document

---

## SECTION 13: V1 VS LATER PHASES

### V1 — Must Include

| Feature | Notes |
|---------|-------|
| All 10 conversational segments | Full flow |
| `OnboardingFormulation` schema (full) | All typed fields |
| Safety layer (all 7 scenarios) | Always active |
| Branching logic (12+ presentations) | Embedded in system prompt |
| Per-segment stopping rules | Server-side heuristics |
| End-of-onboarding user summary | Natural language |
| Mapping endpoint (transcript → formulation) | Background call to `/api/onboarding/map` |
| Provisional band + confidence output | No fake precision |
| Feature flag protection (`FEATURE_V1`) | Default off |
| Behavioral dimensions (7 dimensions) | Inferred; low confidence initial |
| Communication profile | Adaptive from turn 1 |
| Coach lens skill map (6 lenses) | At least Low/Emerging initial estimates |
| Segment coverage tracking | Powers repetition-avoidance |

### V1 — Explicitly Defer

| Feature | Why Deferred |
|---------|-------------|
| Embedded psychometric micro-items | Legal/clinical scope; requires validation and consent |
| Progressive onboarding across sessions | Requires persistent user identity / auth |
| User-visible formulation dashboard | Risk of over-claiming; UX complexity |
| Automatic passive refinement from logs | Requires persistent event store + versioning |
| Coach handoff logic | Requires Manager AI fully wired to formulation |
| Validated clinical scoring | Clinical validation process required |
| Demographic / cultural adaptation | v2 personalization layer |

### Later Phases

**V1.1:**
- Partial completion recovery (return to onboarding mid-flow)
- Low-confidence domain follow-up questions woven into check-ins
- Formulation refinement after N sessions

**V2:**
- Persistent user profiles with versioned formulations
- Passive pattern refinement through behavior logs
- User-facing strengths and patterns visualization
- True progressive onboarding spread across 3–5 sessions
- Cultural/demographic adaptation layer
- Stronger coach handoff logic driven by formulation
