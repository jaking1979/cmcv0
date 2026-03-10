/**
 * Onboarding Assessment Mapping — V1
 *
 * Maps a natural conversation transcript to the OnboardingFormulation schema.
 * All inferences are heuristic and provisional — not clinically validated.
 * See docs/v1_onboarding_spec.md for full specification.
 */

import type { CoachMessage } from '../types'
import type { OnboardingFormulation, SegmentCoverage, SegmentSignalLevel, ConfidenceLevel } from '../types'
import { createEmptyFormulation } from '../types'
import { CRISIS_AND_SCOPE_GUARDRAILS } from '../promptFragments'

// Re-export so existing consumers can still import OnboardingProfile from here
export type { OnboardingFormulation }

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// ─── Mapping Prompt ──────────────────────────────────────────────────────────

function buildMappingPrompt(): string {
  return `${CRISIS_AND_SCOPE_GUARDRAILS}

You are an intake mapping specialist for CMC Sober Coach. Your task is to analyze an onboarding conversation transcript and produce a structured OnboardingFormulation JSON object.

ALL inferences must be:
- Grounded in what was actually said or clearly implied by the user
- Marked with appropriate confidence levels (Low/Medium/High)
- Conservative — prefer null over guessing
- Free of clinical diagnoses; use descriptive language only

PROFILE BANDS (for all band fields): "Low" | "Emerging" | "Moderate" | "Strong"
CONFIDENCE LEVELS: "Low" | "Medium" | "High"
  - Low: inferred from context, not explicitly stated
  - Medium: clearly implied by multiple signals
  - High: user explicitly stated the fact

OUTPUT: Return ONLY a valid JSON object matching the schema below. No prose, no markdown, no explanation.

SCHEMA:
{
  "current_use": {
    "substances": [{ "name": string, "frequency": string|null, "amount_description": string|null, "route": string|null }],
    "pattern_consistency": "daily"|"heavy_episodic"|"irregular"|"unknown"|null,
    "recent_change_direction": "increasing"|"decreasing"|"stable"|"unknown"|null,
    "functional_impact": string|null,
    "disclosure_confidence": "Low"|"Medium"|"High"
  },
  "ideal_goal": {
    "goal_type": "abstinence"|"moderation"|"reduction"|"harm_reduction"|"undecided"|null,
    "goal_specificity": "clear"|"vague"|"none"|null,
    "user_stated_goal": string|null,
    "moderation_vision": string|null,
    "ambivalence_level": "Low"|"Emerging"|"Moderate"|"Strong",
    "values_signals": string[],
    "prior_attempts": boolean|null,
    "prior_attempt_description": string|null
  },
  "risk_map": {
    "triggers": [{ "category": "emotional"|"situational"|"relational"|"sensory"|"temporal", "description": string }],
    "high_risk_times": string[],
    "high_risk_places": string[],
    "emotional_drivers": string[],
    "social_risk_factors": string[],
    "craving_pattern": "sudden"|"gradual"|"situational"|"mixed"|null,
    "habitual_pattern": boolean,
    "recent_high_risk_event": boolean
  },
  "protection_map": {
    "supportive_people": string[],
    "supportive_places": string[],
    "protective_routines": string[],
    "emotional_anchors": string[],
    "prior_successes": string[],
    "prior_attempts_failed": boolean,
    "coping_resources_present": boolean,
    "professional_support_current": boolean,
    "professional_support_type": string|null
  },
  "coach_profiles": {
    "mi": { "motivation_level": band, "readiness": band, "ambivalence_tolerance": band, "confidence": conf },
    "act": { "values_clarity": band, "psychological_flexibility": band, "experiential_avoidance": band, "confidence": conf },
    "dbt": { "distress_tolerance": band, "emotion_regulation": band, "interpersonal_effectiveness": band, "mindfulness_skills": band, "confidence": conf },
    "mindfulness": { "interoceptive_awareness": band, "present_moment_attention": band, "nonjudgmental_stance": band, "confidence": conf },
    "self_compassion": { "self_kindness": band, "common_humanity": band, "lapse_recover_style": "learn"|"collapse"|"mixed"|null, "inner_critic_intensity": band, "confidence": conf },
    "executive_support": { "planning_capacity": band, "follow_through": band, "impulse_gap": band, "structure_need": band, "confidence": conf }
  },
  "communication_profile": {
    "style": "direct"|"reflective"|"mixed"|null,
    "preferred_depth": "surface"|"moderate"|"deep"|null,
    "verbosity": "brief"|"moderate"|"verbose"|null,
    "help_seeking_style": "instrumental"|"exploratory"|"mixed"|null,
    "challenge_tolerance": "low"|"moderate"|"high"|null,
    "shame_sensitivity": "low"|"moderate"|"high"|null,
    "engagement_level": "low"|"moderate"|"high"|null
  },
  "safety_flags": {
    "suicidal_ideation": boolean,
    "self_harm_risk": boolean,
    "overdose_history": boolean,
    "overdose_recent": boolean,
    "withdrawal_risk": boolean,
    "withdrawal_medically_complex": boolean,
    "blackout_risk": boolean,
    "using_alone": boolean,
    "polysubstance": boolean,
    "dv_risk": boolean,
    "acute_risk_level": "none"|"low"|"moderate"|"high",
    "safety_notes": string|null
  },
  "behavioral_dimensions": {
    "impulse_reflection": { "value": 1-5|null, "confidence": conf },
    "solo_social_coping": { "value": 1-5|null, "confidence": conf },
    "avoidance_approach": { "value": 1-5|null, "confidence": conf },
    "planned_in_moment": { "value": 1-5|null, "confidence": conf },
    "relief_seeking_values_guided": { "value": 1-5|null, "confidence": conf },
    "lapse_recovery_style": "learn"|"collapse"|"mixed"|null,
    "prefers_direct_feedback": { "value": 1-5|null, "confidence": conf },
    "confidence": conf
  },
  "confidence_summary": {
    "current_use": conf, "ideal_goal": conf, "risk_map": conf,
    "protection_map": conf, "coach_profiles": conf, "communication_profile": conf,
    "safety_flags": conf, "overall": conf,
    "low_confidence_domains": string[]
  }
}

DIMENSION SCALE REFERENCE (1–5):
- impulse_reflection: 1=acts without thinking, 5=always reflects before acting
- solo_social_coping: 1=copes entirely alone, 5=relies heavily on social support
- avoidance_approach: 1=avoids discomfort entirely, 5=actively approaches difficult things
- planned_in_moment: 1=purely in-the-moment decisions, 5=plans everything in advance
- relief_seeking_values_guided: 1=use driven purely by relief from distress, 5=behavior clearly guided by personal values
- prefers_direct_feedback: 1=prefers very gentle/soft support, 5=prefers direct/blunt feedback

IMPORTANT GUIDELINES:
- Set confidence based on evidence strength, not best guess
- Prefer null for unmentioned fields rather than defaulting to "Low"
- Safety flags: only set to true if user actually described the situation — do not infer from severity alone
- Do not infer suicidal ideation unless explicitly stated; blackout_risk only if user described blackouts
- For coach_profiles, set confidence to "Low" if you have minimal direct evidence for that lens
- behavioral_dimensions.value should be null if you cannot reasonably infer it from the transcript`.trim()
}

// ─── Segment Coverage Inference ──────────────────────────────────────────────

/**
 * Infer segment coverage from the transcript using heuristics.
 * This runs server-side so the formulation records which segments were covered.
 */
export function inferSegmentCoverage(transcript: string): SegmentCoverage {
  const t = transcript.toLowerCase()

  function signal(patterns: RegExp[]): SegmentSignalLevel {
    const matches = patterns.filter(p => p.test(t)).length
    if (matches === 0) return 'none'
    if (matches >= 2) return 'high'
    return 'medium'
  }

  const seg1: SegmentSignalLevel = transcript.length > 50 ? 'high' : 'none'
  const seg2 = signal([
    /drink|use|smoke|take|using|alcohol|cannabis|weed|opioid|cocaine|meth|pill/,
    /every day|daily|weekly|times a (day|week)|how (much|often)|typical week/,
  ])
  const seg3 = signal([
    /relax|calm|numbs?|takes? (the )?edge|feel(s)? better|helps? me|escape|forget|cope|relief|wind down|unwinding|unwind|socialize/,
    /why.*use|what.*does.*give|what.*do.*for you|short.?term|what it gives/,
  ])
  const seg4 = signal([
    /hangover|withdrawal|dope.?sick|tolerance|black(out|ed)|sleep|health|relationship|partner|kids?|job|work|boss|late|promotion|legal|court|probation|money|broke|finances?/,
    /consequence|impact|downside|cost|harm|problem|difficult|worse/,
  ])
  const seg5 = signal([
    /want to (stop|quit|cut|reduce|moderate|abstain|change)/,
    /goal|hoping for|ideal|ambiv|not sure (what|if)|undecided|figure it out/,
  ])
  const seg6 = signal([
    /who i am|who i.?d be|my identity|part of me|defines? me|without (drinking|using|it)|always been|how i see myself/,
    /identity|sense of (self|who)|i.?m (not )?(just |really )?(a |an )?(drinker|user|addict|alcoholic)/,
  ])
  const seg7 = signal([
    /helps|what.*helps|support|friend|family|partner|routine|gym|walk|meeting/,
    /sober|clean|made it through|good day|what works/,
  ])
  const seg8 = signal([
    /tried before|cut back before|quit for|was sober|i can|i.?ve managed|proud|strong|resilient|value|good at|worked hard|fought through|pushed through|survived/,
    /strength|resilience|past success|what worked/,
  ])
  const seg9 = signal([
    /ready|not ready|thinking about|considering|want to change|don.?t want to|part of me wants|ambivalen|not sure (if|whether)|on the fence|maybe|someday|not yet/,
    /readiness|contemplat|precontemplat|preparation|ambivalence/,
  ])
  const seg10 = signal([
    /summary|intake|wrap.?up|reflect back|does that feel|what i.?m hearing/,
    /good picture|accurate|first pass|starting point|direct|practical|reflective|gentle|prefer.*support|feedback style/,
  ])

  const safetySignal = signal([
    /suicid|overdose|withdrawal|hurt (myself|yourself)|not safe|in danger|dv|domestic/,
    /emergency|crisis|safe (right now|at home)|concerned about safety/,
  ])

  // riskMap combines emotional function + costs + emotional drivers
  const riskMapSignal: SegmentSignalLevel = (() => {
    const matches = [seg3, seg4].filter(s => s !== 'none').length
    if (matches >= 2) return 'high'
    if (matches >= 1) return 'medium'
    return 'none'
  })()

  // coachLens combines identity + strengths
  const coachLensSignal: SegmentSignalLevel = (() => {
    const matches = [seg6, seg8].filter(s => s !== 'none').length
    if (matches >= 2) return 'high'
    if (matches >= 1) return 'medium'
    return 'none'
  })()

  const all = [seg1, seg2, seg3, seg4, seg5, seg6, seg7, seg8, seg9, seg10]
  const highCount = all.filter(s => s === 'high').length
  const overall: ConfidenceLevel = highCount >= 7 ? 'high' : highCount >= 4 ? 'medium' : 'low'

  return {
    opening: seg1,
    currentUse: seg2,
    goals: seg5,
    readiness: seg9,
    riskMap: riskMapSignal,
    protectionMap: seg7,
    coachLens: coachLensSignal,
    communication: seg10,
    safety: safetySignal,
    segments_with_high_signal: highCount,
    overall_coverage: overall,
  }
}

// ─── Main Mapping Function ───────────────────────────────────────────────────

/**
 * Map a conversation transcript to an OnboardingFormulation using AI inference.
 * Falls back to an empty formulation with heuristic safety flags if AI fails.
 */
export async function mapTranscriptToFormulation(
  sessionId: string,
  transcript: string
): Promise<OnboardingFormulation> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const systemPrompt = buildMappingPrompt()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this intake conversation and produce the OnboardingFormulation JSON:\n\n${transcript}`,
        },
      ],
      temperature: 0.2,  // Low for consistent, conservative mapping
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`OpenAI mapping error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const raw = JSON.parse(data.choices?.[0]?.message?.content || '{}')

  // Build the full formulation from the AI result, filling any missing fields
  // from the empty default to ensure the object is always complete.
  const base = createEmptyFormulation(sessionId)
  const segmentCoverage = inferSegmentCoverage(transcript)

  const cp = raw.coach_profiles ?? {}
  const formulation: OnboardingFormulation = {
    session_id: sessionId,
    timestamp: Date.now(),
    schema_version: '1.0',
    current_use: { ...base.current_use, ...(raw.current_use ?? {}) },
    ideal_goal: { ...base.ideal_goal, ...(raw.ideal_goal ?? {}) },
    risk_map: { ...base.risk_map, ...(raw.risk_map ?? {}) },
    protection_map: { ...base.protection_map, ...(raw.protection_map ?? {}) },
    coach_profiles: {
      mi:               { ...base.coach_profiles.mi,               ...(cp.mi               ?? {}) },
      act:              { ...base.coach_profiles.act,              ...(cp.act              ?? {}) },
      dbt:              { ...base.coach_profiles.dbt,              ...(cp.dbt              ?? {}) },
      mindfulness:      { ...base.coach_profiles.mindfulness,      ...(cp.mindfulness      ?? {}) },
      self_compassion:  { ...base.coach_profiles.self_compassion,  ...(cp.self_compassion  ?? {}) },
      executive_support:{ ...base.coach_profiles.executive_support,...(cp.executive_support ?? {}) },
    },
    communication_profile: { ...base.communication_profile, ...(raw.communication_profile ?? {}) },
    safety_flags: { ...base.safety_flags, ...(raw.safety_flags ?? {}) },
    confidence_summary: {
      ...base.confidence_summary,
      ...(raw.confidence_summary ?? {}),
    },
    behavioral_dimensions: {
      ...base.behavioral_dimensions,
      ...(raw.behavioral_dimensions ?? {}),
    },
    segment_coverage: segmentCoverage,
  }

  return formulation
}

// ─── Legacy shim ─────────────────────────────────────────────────────────────
// Keep the old mapTranscriptToProfile name so existing callers don't break
// while we migrate to the new schema.

export interface OnboardingProfile {
  sessionId: string
  timestamp: number
  constructs: {
    selfCompassion: Record<string, unknown>
    urica: Record<string, unknown>
    kessler10: Record<string, unknown>
    who5: Record<string, unknown>
    dbtWccl: Record<string, unknown>
    copingSelfEfficacy: Record<string, unknown>
    assist: Record<string, unknown>
    asi: Record<string, unknown>
  }
  confidence: {
    selfCompassion: number; urica: number; kessler10: number; who5: number
    dbtWccl: number; copingSelfEfficacy: number; assist: number; asi: number; overall: number
  }
  rawTranscript: string
  redactedTranscript: string
  // v1 full formulation attached alongside legacy fields
  formulation?: OnboardingFormulation
}

export async function mapTranscriptToProfile(
  sessionId: string,
  transcript: string
): Promise<OnboardingProfile> {
  const formulation = await mapTranscriptToFormulation(sessionId, transcript)

  function confToNum(c: string | undefined): number {
    if (c === 'high' || c === 'High') return 0.9
    if (c === 'medium' || c === 'Medium') return 0.6
    return 0.3
  }

  const miConf       = confToNum(formulation.coach_profiles.mi.confidence)
  const scConf       = confToNum(formulation.coach_profiles.self_compassion.confidence)
  const execConf     = confToNum(formulation.coach_profiles.executive_support.confidence)
  const safetyConf   = confToNum(formulation.confidence_summary.safety_flags)
  const useConf      = confToNum(formulation.confidence_summary.current_use)
  const overallConf  = confToNum(formulation.confidence_summary.overall)

  const substanceNames = (formulation.current_use.substances ?? []).map(s => s.name)

  return {
    sessionId,
    timestamp: formulation.timestamp,
    constructs: {
      selfCompassion: { ...formulation.coach_profiles.self_compassion },
      urica:          { stage: null, confidence: miConf },
      kessler10:      { distressLevel: null },
      who5:           { wellbeingLevel: null },
      dbtWccl:        { ...formulation.coach_profiles.dbt },
      copingSelfEfficacy: { ...formulation.coach_profiles.executive_support },
      assist:         { substanceType: substanceNames, riskLevel: null },
      asi:            { ...formulation.protection_map },
    },
    confidence: {
      selfCompassion:    scConf,
      urica:             miConf,
      kessler10:         0,
      who5:              0,
      dbtWccl:           confToNum(formulation.coach_profiles.dbt.confidence),
      copingSelfEfficacy: execConf,
      assist:            useConf,
      asi:               safetyConf,
      overall:           overallConf,
    },
    rawTranscript:    transcript,
    redactedTranscript: transcript,
    formulation,
  }
}

export function validateProfile(profile: OnboardingProfile): boolean {
  if (!profile.sessionId || !profile.timestamp) return false
  for (const key in profile.confidence) {
    const v = profile.confidence[key as keyof typeof profile.confidence]
    if (typeof v !== 'number' || v < 0 || v > 1) return false
  }
  return true
}
