/**
 * Onboarding Assessment Mapping — V1
 *
 * Maps a natural-conversation transcript to the OnboardingFormulation schema.
 * The AI mapping call does the heavy lifting; this module builds the prompt,
 * calls the API, and assembles the typed result.
 */

import type {
  OnboardingFormulation,
  CurrentUse,
  IdealGoal,
  RiskMap,
  ProtectionMap,
  CoachProfiles,
  CommunicationProfile,
  SafetyFlags,
  ConfidenceSummary,
  BehavioralDimensions,
  SegmentCoverage,
  ReadinessProfile,
  SelfCompassionProfile,
  DistressProfile,
  CopingProfile,
  SubstanceProfile,
  LifeDomainsProfile,
  ConfidenceLevel,
  ProfileBand,
  SegmentSignalLevel,
} from '../types'
import { CRISIS_AND_SCOPE_GUARDRAILS } from '../promptFragments'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// ── Helpers ───────────────────────────────────────────────────────────────────

function cl(val: unknown, fallback: ConfidenceLevel = 'low'): ConfidenceLevel {
  if (val === 'low' || val === 'medium' || val === 'high') return val
  return fallback
}

function pb(val: unknown): ProfileBand | undefined {
  if (val === 'low' || val === 'emerging' || val === 'moderate' || val === 'strong') return val
  return undefined
}

function ssl(val: unknown): SegmentSignalLevel {
  if (val === 'none' || val === 'low_confidence' || val === 'medium' || val === 'high') return val
  return 'none'
}

function bool(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val
  return fallback
}

function strArr(val: unknown): string[] | undefined {
  if (Array.isArray(val) && val.every(v => typeof v === 'string')) return val
  return undefined
}

function str(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim()) return val.trim()
  return undefined
}

function numOrNull(val: unknown): -2 | -1 | 0 | 1 | 2 | null {
  if (val === null) return null
  const n = Number(val)
  if ([-2, -1, 0, 1, 2].includes(n)) return n as -2 | -1 | 0 | 1 | 2
  return null
}

// ── Default builders ──────────────────────────────────────────────────────────

function defaultCurrentUse(): CurrentUse {
  return { substances: [], confidence: 'low' }
}

function defaultIdealGoal(): IdealGoal {
  return { confidence_level: 'low' }
}

function defaultRiskMap(): RiskMap {
  return { severity_band: 'low', harm_domains: {}, confidence: 'low' }
}

function defaultProtectionMap(): ProtectionMap {
  return { confidence: 'low' }
}

function defaultReadiness(): ReadinessProfile {
  return { ambivalence_present: false, change_talk_present: false, sustain_talk_present: false, confidence: 'low' }
}

function defaultSelfCompassion(): SelfCompassionProfile {
  return { critical_self_talk_present: false, shame_language_present: false, confidence: 'low' }
}

function defaultDistress(): DistressProfile {
  return { confidence: 'low' }
}

function defaultCoping(): CopingProfile {
  return { avoidance_present: false, confidence: 'low' }
}

function defaultSubstance(): SubstanceProfile {
  return { poly_substance: false, confidence: 'low' }
}

function defaultLifeDomains(): LifeDomainsProfile {
  return { confidence: 'low' }
}

function defaultCoachProfiles(): CoachProfiles {
  return {
    readiness: defaultReadiness(),
    self_compassion: defaultSelfCompassion(),
    distress: defaultDistress(),
    coping: defaultCoping(),
    substance: defaultSubstance(),
    life_domains: defaultLifeDomains(),
  }
}

function defaultCommunicationProfile(): CommunicationProfile {
  return { confidence: 'low' }
}

function defaultSafetyFlags(): SafetyFlags {
  return {
    suicidality: false,
    self_harm: false,
    overdose_risk: false,
    withdrawal_risk: false,
    blackout_pattern: false,
    poly_substance: false,
    domestic_violence: false,
    medical_urgency: false,
  }
}

function defaultConfidenceSummary(): ConfidenceSummary {
  return {
    overall: 'low',
    per_domain: {
      current_use: 'low', ideal_goal: 'low', risk_map: 'low',
      protection_map: 'low', readiness: 'low', self_compassion: 'low',
      distress: 'low', coping: 'low', substance: 'low',
      life_domains: 'low', communication: 'low', safety: 'low',
    },
    missing_domains: [],
  }
}

function defaultBehavioralDimensions(): BehavioralDimensions {
  return {
    impulse_to_reflection: null,
    avoidance_to_approach: null,
    isolation_to_connection: null,
    rigidity_to_flexibility: null,
    shame_to_self_compassion: null,
    confidence: 'low',
  }
}

function defaultSegmentCoverage(): SegmentCoverage {
  return {
    seg1_opening: 'none', seg2_behavior_pattern: 'none', seg3_function: 'none',
    seg4_costs: 'none', seg5_motivation: 'none', seg6_identity: 'none',
    seg7_supports: 'none', seg8_strengths: 'none', seg9_readiness: 'none',
    seg10_closing: 'none', segments_with_high_signal: 0, overall_coverage: 'low',
  }
}

// ── Assembler — safely coerces raw AI JSON → typed OnboardingFormulation ─────

function assembleFormulation(sessionId: string, raw: Record<string, unknown>): OnboardingFormulation {
  const cu = (raw.current_use as Record<string, unknown>) || {}
  const ig = (raw.ideal_goal as Record<string, unknown>) || {}
  const rm = (raw.risk_map as Record<string, unknown>) || {}
  const pm = (raw.protection_map as Record<string, unknown>) || {}
  const cp = (raw.coach_profiles as Record<string, unknown>) || {}
  const comm = (raw.communication_profile as Record<string, unknown>) || {}
  const sf = (raw.safety_flags as Record<string, unknown>) || {}
  const cs = (raw.confidence_summary as Record<string, unknown>) || {}
  const bd = (raw.behavioral_dimensions as Record<string, unknown>) || {}
  const sc = (raw.segment_coverage as Record<string, unknown>) || {}

  // coach_profiles sub-objects
  const readRaw = (cp.readiness as Record<string, unknown>) || {}
  const scRaw   = (cp.self_compassion as Record<string, unknown>) || {}
  const distRaw = (cp.distress as Record<string, unknown>) || {}
  const copRaw  = (cp.coping as Record<string, unknown>) || {}
  const subRaw  = (cp.substance as Record<string, unknown>) || {}
  const ldRaw   = (cp.life_domains as Record<string, unknown>) || {}

  const harm = (rm.harm_domains as Record<string, unknown>) || {}

  // confidence_summary.per_domain
  const pd = (cs.per_domain as Record<string, unknown>) || {}

  // segment coverage — count highs
  const segKeys: Array<keyof SegmentCoverage> = [
    'seg1_opening', 'seg2_behavior_pattern', 'seg3_function', 'seg4_costs',
    'seg5_motivation', 'seg6_identity', 'seg7_supports', 'seg8_strengths',
    'seg9_readiness', 'seg10_closing',
  ]
  const segMap: Partial<SegmentCoverage> = {}
  let highCount = 0
  for (const k of segKeys) {
    const v = ssl(sc[k])
    ;(segMap as Record<string, SegmentSignalLevel>)[k] = v
    if (v === 'high') highCount++
  }

  const overallCoverage: ConfidenceLevel =
    highCount >= 7 ? 'high' : highCount >= 4 ? 'medium' : 'low'

  return {
    session_id: sessionId,
    timestamp: Date.now(),
    schema_version: '1.0',

    current_use: {
      substances: strArr(cu.substances) || [],
      primary_substance: str(cu.primary_substance),
      frequency: str(cu.frequency),
      quantity_per_occasion: str(cu.quantity_per_occasion),
      context_patterns: strArr(cu.context_patterns),
      use_trajectory: (['increasing','stable','decreasing','variable'].includes(cu.use_trajectory as string)
        ? cu.use_trajectory : null) as CurrentUse['use_trajectory'],
      confidence: cl(cu.confidence),
    },

    ideal_goal: {
      stated_goal: (['abstain','reduce','moderate','maintain','explore','undecided'].includes(ig.stated_goal as string)
        ? ig.stated_goal : undefined) as IdealGoal['stated_goal'],
      user_language: str(ig.user_language),
      timeframe: str(ig.timeframe),
      self_efficacy: typeof ig.self_efficacy === 'number' ? ig.self_efficacy : undefined,
      confidence_level: cl(ig.confidence_level),
    },

    risk_map: {
      severity_band: pb(rm.severity_band) || 'low',
      harm_domains: {
        health: str(harm.health),
        relationships: str(harm.relationships),
        work_legal: str(harm.work_legal),
        financial: str(harm.financial),
        safety: str(harm.safety),
      },
      escalation_risk: (['low','moderate','high'].includes(rm.escalation_risk as string)
        ? rm.escalation_risk : null) as RiskMap['escalation_risk'],
      confidence: cl(rm.confidence),
    },

    protection_map: {
      social_supports: strArr(pm.social_supports),
      internal_strengths: strArr(pm.internal_strengths),
      external_resources: strArr(pm.external_resources),
      prior_successes: strArr(pm.prior_successes),
      confidence: cl(pm.confidence),
    },

    coach_profiles: {
      readiness: {
        stage: (['precontemplation','contemplation','preparation','action','maintenance']
          .includes(readRaw.stage as string) ? readRaw.stage : undefined) as ReadinessProfile['stage'],
        ambivalence_present: bool(readRaw.ambivalence_present),
        change_talk_present: bool(readRaw.change_talk_present),
        sustain_talk_present: bool(readRaw.sustain_talk_present),
        confidence: cl(readRaw.confidence),
      },
      self_compassion: {
        self_kindness_band: pb(scRaw.self_kindness_band),
        common_humanity_band: pb(scRaw.common_humanity_band),
        mindfulness_band: pb(scRaw.mindfulness_band),
        critical_self_talk_present: bool(scRaw.critical_self_talk_present),
        shame_language_present: bool(scRaw.shame_language_present),
        confidence: cl(scRaw.confidence),
      },
      distress: {
        k10_estimated_band: (['low','moderate','high','very_high'].includes(distRaw.k10_estimated_band as string)
          ? distRaw.k10_estimated_band : undefined) as DistressProfile['k10_estimated_band'],
        who5_estimated_band: (['poor','moderate','good','excellent'].includes(distRaw.who5_estimated_band as string)
          ? distRaw.who5_estimated_band : undefined) as DistressProfile['who5_estimated_band'],
        distress_themes: strArr(distRaw.distress_themes),
        confidence: cl(distRaw.confidence),
      },
      coping: {
        primary_strategies: strArr(copRaw.primary_strategies),
        avoidance_present: bool(copRaw.avoidance_present),
        emotion_focused_capacity: pb(copRaw.emotion_focused_capacity),
        problem_focused_capacity: pb(copRaw.problem_focused_capacity),
        coping_self_efficacy_band: pb(copRaw.coping_self_efficacy_band),
        confidence: cl(copRaw.confidence),
      },
      substance: {
        risk_level: (['low','moderate','high'].includes(subRaw.risk_level as string)
          ? subRaw.risk_level : undefined) as SubstanceProfile['risk_level'],
        poly_substance: bool(subRaw.poly_substance),
        withdrawal_risk: typeof subRaw.withdrawal_risk === 'boolean' ? subRaw.withdrawal_risk : undefined,
        blackout_pattern: typeof subRaw.blackout_pattern === 'boolean' ? subRaw.blackout_pattern : undefined,
        confidence: cl(subRaw.confidence),
      },
      life_domains: {
        relationships: str(ldRaw.relationships),
        employment: str(ldRaw.employment),
        family: str(ldRaw.family),
        legal: str(ldRaw.legal),
        health: str(ldRaw.health),
        financial: str(ldRaw.financial),
        confidence: cl(ldRaw.confidence),
      },
    },

    communication_profile: {
      pace_preference: (['slow','moderate','direct'].includes(comm.pace_preference as string)
        ? comm.pace_preference : undefined) as CommunicationProfile['pace_preference'],
      language_style: (['clinical','casual','narrative','mixed'].includes(comm.language_style as string)
        ? comm.language_style : undefined) as CommunicationProfile['language_style'],
      reflection_openness: pb(comm.reflection_openness),
      engagement_pattern: (['open','guarded','task-focused','story-driven'].includes(comm.engagement_pattern as string)
        ? comm.engagement_pattern : undefined) as CommunicationProfile['engagement_pattern'],
      help_seeking_style: (['independent','collaborative','directive-seeking'].includes(comm.help_seeking_style as string)
        ? comm.help_seeking_style : undefined) as CommunicationProfile['help_seeking_style'],
      confidence: cl(comm.confidence),
    },

    safety_flags: {
      suicidality: bool(sf.suicidality),
      self_harm: bool(sf.self_harm),
      overdose_risk: bool(sf.overdose_risk),
      withdrawal_risk: bool(sf.withdrawal_risk),
      blackout_pattern: bool(sf.blackout_pattern),
      poly_substance: bool(sf.poly_substance),
      domestic_violence: bool(sf.domestic_violence),
      medical_urgency: bool(sf.medical_urgency),
      flag_details: str(sf.flag_details),
    },

    confidence_summary: {
      overall: cl(cs.overall),
      per_domain: {
        current_use: cl(pd.current_use),
        ideal_goal: cl(pd.ideal_goal),
        risk_map: cl(pd.risk_map),
        protection_map: cl(pd.protection_map),
        readiness: cl(pd.readiness),
        self_compassion: cl(pd.self_compassion),
        distress: cl(pd.distress),
        coping: cl(pd.coping),
        substance: cl(pd.substance),
        life_domains: cl(pd.life_domains),
        communication: cl(pd.communication),
        safety: cl(pd.safety),
      },
      missing_domains: strArr(cs.missing_domains) || [],
    },

    behavioral_dimensions: {
      impulse_to_reflection: numOrNull(bd.impulse_to_reflection),
      avoidance_to_approach: numOrNull(bd.avoidance_to_approach),
      isolation_to_connection: numOrNull(bd.isolation_to_connection),
      rigidity_to_flexibility: numOrNull(bd.rigidity_to_flexibility),
      shame_to_self_compassion: numOrNull(bd.shame_to_self_compassion),
      confidence: cl(bd.confidence),
    },

    segment_coverage: {
      ...segMap,
      segments_with_high_signal: highCount,
      overall_coverage: overallCoverage,
    } as SegmentCoverage,
  }
}

// ── Mapping prompt ────────────────────────────────────────────────────────────

function buildMappingPrompt(): string {
  return `${CRISIS_AND_SCOPE_GUARDRAILS}

You are an assessment mapping specialist for the CMC / Invitation to Change coaching platform. Your job is to analyze a natural intake-conversation transcript and populate the OnboardingFormulation schema with as much evidence-grounded signal as the transcript supports.

CRITICAL GROUND RULES
- Only populate fields where you have clear evidence from the conversation.
- Never fabricate, infer beyond what was said, or fill gaps with assumptions.
- Use null for missing fields. Use "low" confidence for weak signal, "medium" for implied, "high" for explicit.
- This is NOT a clinical diagnosis — it is a coaching formulation used to personalize support.
- Honor the ITC stance: no pathologizing, no moralizing, no labeling.

SCHEMA TO POPULATE
Return a valid JSON object matching this structure exactly. All fields shown; set to null/false/[] if absent.

{
  "current_use": {
    "substances": ["list", "of", "substances"],
    "primary_substance": "string or null",
    "frequency": "plain language string or null",
    "quantity_per_occasion": "plain language string or null",
    "context_patterns": ["list of context strings"] or null,
    "use_trajectory": "increasing|stable|decreasing|variable or null",
    "confidence": "low|medium|high"
  },

  "ideal_goal": {
    "stated_goal": "abstain|reduce|moderate|maintain|explore|undecided or null",
    "user_language": "verbatim goal phrase or null",
    "timeframe": "string or null",
    "self_efficacy": 0.0-1.0 or null,
    "confidence_level": "low|medium|high"
  },

  "risk_map": {
    "severity_band": "low|emerging|moderate|strong",
    "harm_domains": {
      "health": "one-line observation or null",
      "relationships": "one-line observation or null",
      "work_legal": "one-line observation or null",
      "financial": "one-line observation or null",
      "safety": "one-line observation or null"
    },
    "escalation_risk": "low|moderate|high or null",
    "confidence": "low|medium|high"
  },

  "protection_map": {
    "social_supports": ["list"] or null,
    "internal_strengths": ["list"] or null,
    "external_resources": ["list"] or null,
    "prior_successes": ["list"] or null,
    "confidence": "low|medium|high"
  },

  "coach_profiles": {
    "readiness": {
      "stage": "precontemplation|contemplation|preparation|action|maintenance or null",
      "ambivalence_present": true|false,
      "change_talk_present": true|false,
      "sustain_talk_present": true|false,
      "confidence": "low|medium|high"
    },
    "self_compassion": {
      "self_kindness_band": "low|emerging|moderate|strong or null",
      "common_humanity_band": "low|emerging|moderate|strong or null",
      "mindfulness_band": "low|emerging|moderate|strong or null",
      "critical_self_talk_present": true|false,
      "shame_language_present": true|false,
      "confidence": "low|medium|high"
    },
    "distress": {
      "k10_estimated_band": "low|moderate|high|very_high or null",
      "who5_estimated_band": "poor|moderate|good|excellent or null",
      "distress_themes": ["list"] or null,
      "confidence": "low|medium|high"
    },
    "coping": {
      "primary_strategies": ["list"] or null,
      "avoidance_present": true|false,
      "emotion_focused_capacity": "low|emerging|moderate|strong or null",
      "problem_focused_capacity": "low|emerging|moderate|strong or null",
      "coping_self_efficacy_band": "low|emerging|moderate|strong or null",
      "confidence": "low|medium|high"
    },
    "substance": {
      "risk_level": "low|moderate|high or null",
      "poly_substance": true|false,
      "withdrawal_risk": true|false or null,
      "blackout_pattern": true|false or null,
      "confidence": "low|medium|high"
    },
    "life_domains": {
      "relationships": "one-line observation or null",
      "employment": "one-line observation or null",
      "family": "one-line observation or null",
      "legal": "one-line observation or null",
      "health": "one-line observation or null",
      "financial": "one-line observation or null",
      "confidence": "low|medium|high"
    }
  },

  "communication_profile": {
    "pace_preference": "slow|moderate|direct or null",
    "language_style": "clinical|casual|narrative|mixed or null",
    "reflection_openness": "low|emerging|moderate|strong or null",
    "engagement_pattern": "open|guarded|task-focused|story-driven or null",
    "help_seeking_style": "independent|collaborative|directive-seeking or null",
    "confidence": "low|medium|high"
  },

  "safety_flags": {
    "suicidality": false,
    "self_harm": false,
    "overdose_risk": false,
    "withdrawal_risk": false,
    "blackout_pattern": false,
    "poly_substance": false,
    "domestic_violence": false,
    "medical_urgency": false,
    "flag_details": "brief note if any flag is true, else null"
  },

  "confidence_summary": {
    "overall": "low|medium|high",
    "per_domain": {
      "current_use": "low|medium|high",
      "ideal_goal": "low|medium|high",
      "risk_map": "low|medium|high",
      "protection_map": "low|medium|high",
      "readiness": "low|medium|high",
      "self_compassion": "low|medium|high",
      "distress": "low|medium|high",
      "coping": "low|medium|high",
      "substance": "low|medium|high",
      "life_domains": "low|medium|high",
      "communication": "low|medium|high",
      "safety": "low|medium|high"
    },
    "missing_domains": ["list of domain names where confidence is low"]
  },

  "behavioral_dimensions": {
    "impulse_to_reflection": -2 to 2 or null,
    "avoidance_to_approach": -2 to 2 or null,
    "isolation_to_connection": -2 to 2 or null,
    "rigidity_to_flexibility": -2 to 2 or null,
    "shame_to_self_compassion": -2 to 2 or null,
    "confidence": "low|medium|high"
  },

  "segment_coverage": {
    "seg1_opening": "none|low_confidence|medium|high",
    "seg2_behavior_pattern": "none|low_confidence|medium|high",
    "seg3_function": "none|low_confidence|medium|high",
    "seg4_costs": "none|low_confidence|medium|high",
    "seg5_motivation": "none|low_confidence|medium|high",
    "seg6_identity": "none|low_confidence|medium|high",
    "seg7_supports": "none|low_confidence|medium|high",
    "seg8_strengths": "none|low_confidence|medium|high",
    "seg9_readiness": "none|low_confidence|medium|high",
    "seg10_closing": "none|low_confidence|medium|high"
  }
}

DOMAIN GUIDANCE FOR MAPPING

current_use: Infer substances from any mention (alcohol, cannabis, opioids, stimulants, etc.).
  Frequency from: "every day", "weekends", "nightly", "a few times a week", etc.
  Trajectory from: "I've been drinking more lately", "it's about the same", "I've cut back".

ideal_goal: Stated or implied: "I want to quit", "just cut back a bit", "I'm not sure what I want yet".
  self_efficacy: If they rate their confidence ("I think I could do it / I don't think I can").

risk_map: severity_band — 'low' if minimal impact; 'emerging' if some early signs; 'moderate' if clear impact
  in 2+ domains; 'strong' if severe, pervasive, or escalating harm. Harm domains: quote brief observations.

protection_map: People, programs, routines, values, skills, past wins — anything that cushions risk.

readiness (URICA stage):
  Precontemplation = no current intention to change ("I don't really see a problem")
  Contemplation = aware of problem, ambivalent ("I know I should but...")
  Preparation = planning to change soon ("I'm going to try next month")
  Action = actively making changes ("I've stopped / cut back and I'm doing it")
  Maintenance = sustaining established change ("I've been sober X months")

self_compassion: critical_self_talk = harsh self-judgment, "I'm such a failure", "I hate myself".
  shame_language = "I'm disgusting", "I'm weak", "I should be ashamed".
  Bands: 'low' = high self-criticism; 'strong' = warm, forgiving self-talk.

distress (K10/WHO-5): Estimate band from emotional tone and content:
  K10 low = calm, functional; moderate = stressed, anxious; high = significantly impaired; very_high = severe.
  WHO-5 poor = flat, no pleasure, low energy; excellent = positive mood, energy, interest.

coping: What they do when stressed or triggered — avoid, reach out, problem-solve, use substances, exercise, etc.
  Avoidance includes: "I just don't think about it", "I leave", "I shut down", substance use as escape.

substance risk_level:
  low = minimal frequency/quantity, no significant consequences
  moderate = regular use with some consequences, some loss of control
  high = heavy/daily use, significant consequences, possible dependence signs

behavioral_dimensions (each -2 to +2):
  impulse_to_reflection: -2 = acts without thinking; +2 = pauses, reflects, plans
  avoidance_to_approach: -2 = avoids all discomfort; +2 = actively faces/approaches
  isolation_to_connection: -2 = no support, handles alone; +2 = rich social support
  rigidity_to_flexibility: -2 = fixed patterns, all-or-nothing; +2 = adaptive, flexible
  shame_to_self_compassion: -2 = dominated by shame; +2 = genuine self-compassion

segment_coverage: Rate each of the 10 onboarding domains based on how much signal the transcript provides:
  none = topic never came up
  low_confidence = briefly touched on, ambiguous
  medium = discussed with some depth
  high = clear, substantive signal that informs coaching

Segments:
  seg1_opening = why they came, their framing of the situation
  seg2_behavior_pattern = what/when/how much/where
  seg3_function = what the behavior gives them in the short term
  seg4_costs = consequences they named in their own words
  seg5_motivation = what they hope for; their version of a good outcome
  seg6_identity = who they are, who they want to be, what this means to their sense of self
  seg7_supports = who or what helps them
  seg8_strengths = past efforts, resilience, values, capacities
  seg9_readiness = where they are right now re: readiness/ambivalence
  seg10_closing = communication preferences, what feels most useful to them
`.trim()
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Map a conversation transcript to a typed OnboardingFormulation.
 * This is called by /api/onboarding/map after the conversation is complete.
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
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this intake conversation and return a populated OnboardingFormulation JSON object. Ground every field in what was actually said.\n\nTRANSCRIPT:\n${transcript}`,
        },
      ],
      temperature: 0.2, // Low temperature for consistent, conservative mapping
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  let raw: Record<string, unknown> = {}
  try {
    raw = JSON.parse(data.choices[0]?.message?.content || '{}')
  } catch {
    console.error('[onboardingMapping] Failed to parse AI JSON response')
  }

  return assembleFormulation(sessionId, raw)
}

/**
 * Validate a formulation has required fields and valid confidence scores.
 */
export function validateFormulation(formulation: OnboardingFormulation): boolean {
  if (!formulation.session_id || !formulation.timestamp) return false
  if (formulation.schema_version !== '1.0') return false

  // All confidence fields must be valid ConfidenceLevels
  const validLevels = new Set(['low', 'medium', 'high'])
  const check = (v: unknown) => validLevels.has(v as string)

  const pd = formulation.confidence_summary.per_domain
  return (
    check(formulation.confidence_summary.overall) &&
    check(pd.current_use) &&
    check(pd.ideal_goal) &&
    check(pd.risk_map) &&
    check(pd.protection_map) &&
    check(pd.readiness) &&
    check(pd.self_compassion) &&
    check(pd.distress) &&
    check(pd.coping) &&
    check(pd.substance) &&
    check(pd.life_domains) &&
    check(pd.communication) &&
    check(pd.safety)
  )
}

// ── Backward-compat shim ──────────────────────────────────────────────────────
// Keep the old export name available so any existing callers don't break
// while the codebase migrates to mapTranscriptToFormulation.

export { mapTranscriptToFormulation as mapTranscriptToProfile }
