// AI Coach Types for v1 Multi-Agent Architecture

export interface CoachEvent {
  id: string
  sessionId: string
  timestamp: number
  coachType: CoachType
  messageId: string
  tags: CoachTag[]
  confidence: number
  metadata?: Record<string, any>
}

export type CoachType = 'dbt' | 'self-compassion' | 'cbt' | 'manager'

export interface CoachTag {
  type: TagType
  value: string
  confidence: number
  context?: string
}

export type TagType = 
  | 'emotion' | 'behavior' | 'trigger' | 'coping-strategy' 
  | 'values' | 'goals' | 'barriers' | 'strengths'
  | 'crisis-signal' | 'motivation' | 'readiness'

export interface PersonalizedPlan {
  id: string
  sessionId: string
  timestamp: number
  summary: string
  actions: PlanAction[]
  rationale: string
  confidence: number
  eventsAnalyzed?: number
}

export interface PlanAction {
  id: string
  title: string
  description: string
  category: 'immediate' | 'short-term' | 'long-term'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime?: string
}

export interface ConversationSlice {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
  sessionId: string
  context?: {
    phase?: string
    scenarioId?: string
  }
}

export interface OnboardingProfile {
  sessionId: string
  timestamp: number
  constructs: {
    selfCompassion?: number
    urica?: string
    kessler10?: number
    who5?: number
    dbtWccl?: number
    copingSelfEfficacy?: number
    assist?: Record<string, number>
    asi?: Record<string, any>
  }
  confidence: Record<string, number>
  rawTranscript: string
}

// ─── V1 OnboardingFormulation — Canonical Typed Schema ───────────────────────
// Authoritative schema produced by the v1 onboarding flow.
// All fields are provisional and heuristic — not clinically validated.
// See docs/v1_onboarding_spec.md for the full specification.

export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type ProfileBand = 'low' | 'emerging' | 'moderate' | 'strong'
export type SegmentSignalLevel = 'none' | 'low_confidence' | 'medium' | 'high'
export type BehavioralDimensionScore = -2 | -1 | 0 | 1 | 2 | null

export interface CurrentUse {
  substances: string[]               // e.g. ['alcohol', 'cannabis']
  primary_substance?: string
  frequency?: string                 // plain language: 'daily', 'most weekends'
  quantity_per_occasion?: string     // plain language: '4-6 drinks', 'a few hits'
  context_patterns?: string[]        // e.g. ['evenings alone', 'after work stress']
  use_trajectory?: 'increasing' | 'stable' | 'decreasing' | 'variable' | null
  confidence: ConfidenceLevel
}

export interface IdealGoal {
  stated_goal?: 'abstain' | 'reduce' | 'moderate' | 'maintain' | 'explore' | 'undecided'
  user_language?: string             // verbatim goal phrasing
  timeframe?: string                 // e.g. 'soon', 'someday', 'right now'
  self_efficacy?: number             // 0-1 if user mentioned confidence level
  confidence_level: ConfidenceLevel
}

export interface RiskMap {
  severity_band: ProfileBand
  harm_domains: {
    health?: string
    relationships?: string
    work_legal?: string
    financial?: string
    safety?: string
  }
  escalation_risk?: 'low' | 'moderate' | 'high' | null
  confidence: ConfidenceLevel
}

export interface ProtectionMap {
  social_supports?: string[]         // named/described people or groups
  internal_strengths?: string[]      // values, capacities, coping skills
  external_resources?: string[]      // programs, community, structure
  prior_successes?: string[]         // past change efforts or meaningful wins
  confidence: ConfidenceLevel
}

export interface ReadinessProfile {
  stage?: 'precontemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance'
  ambivalence_present: boolean
  change_talk_present: boolean
  sustain_talk_present: boolean
  confidence: ConfidenceLevel
}

export interface SelfCompassionProfile {
  self_kindness_band?: ProfileBand
  common_humanity_band?: ProfileBand
  mindfulness_band?: ProfileBand
  critical_self_talk_present: boolean
  shame_language_present: boolean
  confidence: ConfidenceLevel
}

export interface DistressProfile {
  k10_estimated_band?: 'low' | 'moderate' | 'high' | 'very_high'
  who5_estimated_band?: 'poor' | 'moderate' | 'good' | 'excellent'
  distress_themes?: string[]         // e.g. ['anxiety', 'hopelessness', 'low energy']
  confidence: ConfidenceLevel
}

export interface CopingProfile {
  primary_strategies?: string[]      // e.g. ['avoidance', 'social support', 'problem-solving']
  avoidance_present: boolean
  emotion_focused_capacity?: ProfileBand
  problem_focused_capacity?: ProfileBand
  coping_self_efficacy_band?: ProfileBand
  confidence: ConfidenceLevel
}

export interface SubstanceProfile {
  risk_level?: 'low' | 'moderate' | 'high'
  poly_substance: boolean
  withdrawal_risk?: boolean
  blackout_pattern?: boolean
  confidence: ConfidenceLevel
}

export interface LifeDomainsProfile {
  relationships?: string             // one-line observation grounded in transcript
  employment?: string
  family?: string
  legal?: string
  health?: string
  financial?: string
  confidence: ConfidenceLevel
}

export interface CoachProfiles {
  readiness: ReadinessProfile
  self_compassion: SelfCompassionProfile
  distress: DistressProfile
  coping: CopingProfile
  substance: SubstanceProfile
  life_domains: LifeDomainsProfile
}

export interface CommunicationProfile {
  pace_preference?: 'slow' | 'moderate' | 'direct'
  language_style?: 'clinical' | 'casual' | 'narrative' | 'mixed'
  reflection_openness?: ProfileBand
  engagement_pattern?: 'open' | 'guarded' | 'task-focused' | 'story-driven'
  help_seeking_style?: 'independent' | 'collaborative' | 'directive-seeking'
  confidence: ConfidenceLevel
}

export interface SafetyFlags {
  suicidality: boolean
  self_harm: boolean
  overdose_risk: boolean
  withdrawal_risk: boolean
  blackout_pattern: boolean
  poly_substance: boolean
  domestic_violence: boolean
  medical_urgency: boolean
  flag_details?: string              // brief free-text note if any flag is true
}

export interface ConfidenceSummary {
  overall: ConfidenceLevel
  per_domain: {
    current_use: ConfidenceLevel
    ideal_goal: ConfidenceLevel
    risk_map: ConfidenceLevel
    protection_map: ConfidenceLevel
    readiness: ConfidenceLevel
    self_compassion: ConfidenceLevel
    distress: ConfidenceLevel
    coping: ConfidenceLevel
    substance: ConfidenceLevel
    life_domains: ConfidenceLevel
    communication: ConfidenceLevel
    safety: ConfidenceLevel
  }
  missing_domains: string[]          // domain names where confidence is 'low'
}

export interface BehavioralDimensions {
  // Each dimension: -2 (left pole) → +2 (right pole); null if not enough signal
  impulse_to_reflection: BehavioralDimensionScore       // -2 = highly impulsive, +2 = highly reflective
  avoidance_to_approach: BehavioralDimensionScore       // -2 = high avoidance, +2 = active approach
  isolation_to_connection: BehavioralDimensionScore     // -2 = isolated, +2 = well-connected
  rigidity_to_flexibility: BehavioralDimensionScore     // -2 = rigid patterns, +2 = flexible
  shame_to_self_compassion: BehavioralDimensionScore    // -2 = high shame, +2 = self-compassionate
  confidence: ConfidenceLevel
}

export interface SegmentCoverage {
  seg1_opening: SegmentSignalLevel
  seg2_behavior_pattern: SegmentSignalLevel
  seg3_function: SegmentSignalLevel
  seg4_costs: SegmentSignalLevel
  seg5_motivation: SegmentSignalLevel
  seg6_identity: SegmentSignalLevel
  seg7_supports: SegmentSignalLevel
  seg8_strengths: SegmentSignalLevel
  seg9_readiness: SegmentSignalLevel
  seg10_closing: SegmentSignalLevel
  segments_with_high_signal: number  // count of domains at 'high'
  overall_coverage: ConfidenceLevel
}

export interface OnboardingFormulation {
  session_id: string
  timestamp: number
  schema_version: string             // "1.0"
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

/** Build a blank OnboardingFormulation with all fields at safe defaults. */
export function createEmptyFormulation(session_id: string): OnboardingFormulation {
  const c: ConfidenceLevel = 'low'
  const b: ProfileBand = 'low'
  return {
    session_id,
    timestamp: Date.now(),
    schema_version: '1.0',
    current_use: { substances: [], confidence: c },
    ideal_goal: { confidence_level: c },
    risk_map: { severity_band: b, harm_domains: {}, confidence: c },
    protection_map: { confidence: c },
    coach_profiles: {
      readiness: { ambivalence_present: false, change_talk_present: false, sustain_talk_present: false, confidence: c },
      self_compassion: { critical_self_talk_present: false, shame_language_present: false, confidence: c },
      distress: { confidence: c },
      coping: { avoidance_present: false, confidence: c },
      substance: { poly_substance: false, confidence: c },
      life_domains: { confidence: c },
    },
    communication_profile: { confidence: c },
    safety_flags: {
      suicidality: false, self_harm: false, overdose_risk: false,
      withdrawal_risk: false, blackout_pattern: false, poly_substance: false,
      domestic_violence: false, medical_urgency: false,
    },
    confidence_summary: {
      overall: c,
      per_domain: {
        current_use: c, ideal_goal: c, risk_map: c, protection_map: c,
        readiness: c, self_compassion: c, distress: c, coping: c,
        substance: c, life_domains: c, communication: c, safety: c,
      },
      missing_domains: [],
    },
    behavioral_dimensions: {
      impulse_to_reflection: null, avoidance_to_approach: null,
      isolation_to_connection: null, rigidity_to_flexibility: null,
      shame_to_self_compassion: null, confidence: c,
    },
    segment_coverage: {
      seg1_opening: 'none', seg2_behavior_pattern: 'none', seg3_function: 'none',
      seg4_costs: 'none', seg5_motivation: 'none', seg6_identity: 'none',
      seg7_supports: 'none', seg8_strengths: 'none', seg9_readiness: 'none',
      seg10_closing: 'none', segments_with_high_signal: 0, overall_coverage: 'low',
    },
  }
}

// ── Feature flag types ────────────────────────────────────────────────────────
// Feature flag types
export interface FeatureFlags {
  v1: boolean
  coaches: boolean
  plan: boolean
  onboardingMap: boolean
  pwa: boolean
  push: boolean
  roleplays: boolean
}

// Session management
export interface SessionInfo {
  id: string
  createdAt: number
  lastActivity: number
  userAgent?: string
  ipAddress?: string
}

// Coach message for analysis
export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

// Coach analysis result
export interface CoachAnalysis {
  coachType: CoachType
  tags: CoachTag[]
  signals: string[]
  confidence: number
  suggestedResponse?: string
}

// Phase detection
export type ConversationPhase = 
  | 'initial-rapport' 
  | 'exploration' 
  | 'skill-building' 
  | 'planning' 
  | 'reflection'
  | 'crisis'

export interface PhaseInfo {
  current: ConversationPhase
  confidence: number
  triggers: string[]
}

