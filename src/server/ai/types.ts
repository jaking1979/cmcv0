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
//
// Field names intentionally match the buildMappingPrompt() JSON schema so that
// the AI output can be spread-merged into these types without key mismatches.

export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type ProfileBand = 'Low' | 'Emerging' | 'Moderate' | 'Strong'
export type SegmentSignalLevel = 'none' | 'low_confidence' | 'medium' | 'high'

// ── Current Use ──────────────────────────────────────────────────────────────

export interface CurrentUse {
  substances?: Array<{
    name: string
    frequency: string | null
    amount_description: string | null
    route: string | null
  }>
  pattern_consistency?: 'daily' | 'heavy_episodic' | 'irregular' | 'unknown' | null
  recent_change_direction?: 'increasing' | 'decreasing' | 'stable' | 'unknown' | null
  functional_impact?: string | null
  disclosure_confidence: ConfidenceLevel
}

// ── Ideal Goal ───────────────────────────────────────────────────────────────

export interface IdealGoal {
  goal_type?: 'abstinence' | 'moderation' | 'reduction' | 'harm_reduction' | 'undecided' | null
  goal_specificity?: 'clear' | 'vague' | 'none' | null
  user_stated_goal?: string | null
  moderation_vision?: string | null
  ambivalence_level?: ProfileBand
  values_signals?: string[]
  prior_attempts?: boolean | null
  prior_attempt_description?: string | null
  confidence_level: ConfidenceLevel
}

// ── Risk Map ─────────────────────────────────────────────────────────────────

export interface RiskMap {
  triggers?: Array<{
    category: 'emotional' | 'situational' | 'relational' | 'sensory' | 'temporal'
    description: string
  }>
  high_risk_times?: string[]
  high_risk_places?: string[]
  emotional_drivers?: string[]
  social_risk_factors?: string[]
  craving_pattern?: 'sudden' | 'gradual' | 'situational' | 'mixed' | null
  habitual_pattern?: boolean
  recent_high_risk_event?: boolean
  confidence: ConfidenceLevel
}

// ── Protection Map ───────────────────────────────────────────────────────────

export interface ProtectionMap {
  supportive_people?: string[]
  supportive_places?: string[]
  protective_routines?: string[]
  emotional_anchors?: string[]
  prior_successes?: string[]
  prior_attempts_failed?: boolean
  coping_resources_present?: boolean
  professional_support_current?: boolean
  professional_support_type?: string | null
  confidence: ConfidenceLevel
}

// ── Coach Profiles — aligned to the 6 V1 coaching lenses ────────────────────

export interface MiProfile {
  motivation_level?: ProfileBand
  readiness?: ProfileBand
  ambivalence_tolerance?: ProfileBand
  confidence: ConfidenceLevel
}

export interface ActProfile {
  values_clarity?: ProfileBand
  psychological_flexibility?: ProfileBand
  experiential_avoidance?: ProfileBand
  confidence: ConfidenceLevel
}

export interface DbtProfile {
  distress_tolerance?: ProfileBand
  emotion_regulation?: ProfileBand
  interpersonal_effectiveness?: ProfileBand
  mindfulness_skills?: ProfileBand
  confidence: ConfidenceLevel
}

export interface MindfulnessProfile {
  interoceptive_awareness?: ProfileBand
  present_moment_attention?: ProfileBand
  nonjudgmental_stance?: ProfileBand
  confidence: ConfidenceLevel
}

export interface SelfCompassionLensProfile {
  self_kindness?: ProfileBand
  common_humanity?: ProfileBand
  lapse_recover_style?: 'learn' | 'collapse' | 'mixed' | null
  inner_critic_intensity?: ProfileBand
  confidence: ConfidenceLevel
}

export interface ExecutiveSupportProfile {
  planning_capacity?: ProfileBand
  follow_through?: ProfileBand
  impulse_gap?: ProfileBand
  structure_need?: ProfileBand
  confidence: ConfidenceLevel
}

export interface CoachProfiles {
  mi: MiProfile
  act: ActProfile
  dbt: DbtProfile
  mindfulness: MindfulnessProfile
  self_compassion: SelfCompassionLensProfile
  executive_support: ExecutiveSupportProfile
}

// ── Communication Profile ────────────────────────────────────────────────────

export interface CommunicationProfile {
  style?: 'direct' | 'reflective' | 'mixed' | null
  preferred_depth?: 'surface' | 'moderate' | 'deep' | null
  verbosity?: 'brief' | 'moderate' | 'verbose' | null
  help_seeking_style?: 'instrumental' | 'exploratory' | 'mixed' | null
  challenge_tolerance?: 'low' | 'moderate' | 'high' | null
  shame_sensitivity?: 'low' | 'moderate' | 'high' | null
  engagement_level?: 'low' | 'moderate' | 'high' | null
  confidence: ConfidenceLevel
}

// ── Safety Flags — aligned to mapping prompt field names ────────────────────

export interface SafetyFlags {
  suicidal_ideation: boolean
  self_harm_risk: boolean
  overdose_history: boolean
  overdose_recent: boolean
  withdrawal_risk: boolean
  withdrawal_medically_complex: boolean
  blackout_risk: boolean
  using_alone: boolean
  polysubstance: boolean
  dv_risk: boolean
  medical_urgency: boolean
  acute_risk_level?: 'none' | 'low' | 'moderate' | 'high'
  safety_notes?: string | null
}

// ── Confidence Summary — aligned to mapping prompt output ───────────────────

export interface ConfidenceSummary {
  overall: ConfidenceLevel
  current_use: ConfidenceLevel
  ideal_goal: ConfidenceLevel
  risk_map: ConfidenceLevel
  protection_map: ConfidenceLevel
  coach_profiles: ConfidenceLevel
  communication_profile: ConfidenceLevel
  safety_flags: ConfidenceLevel
  low_confidence_domains: string[]
}

// ── Behavioral Dimensions — 1–5 scale with per-dimension confidence ──────────

export interface BehavioralDimensionValue {
  value: 1 | 2 | 3 | 4 | 5 | null
  confidence: ConfidenceLevel
}

export interface BehavioralDimensions {
  // 1 = impulsive, 5 = reflects before acting
  impulse_reflection: BehavioralDimensionValue
  // 1 = copes entirely alone, 5 = relies heavily on social support
  solo_social_coping: BehavioralDimensionValue
  // 1 = avoids discomfort, 5 = actively approaches difficult things
  avoidance_approach: BehavioralDimensionValue
  // 1 = purely in-the-moment, 5 = plans everything in advance
  planned_in_moment: BehavioralDimensionValue
  // 1 = use driven by relief from distress, 5 = behavior guided by personal values
  relief_seeking_values_guided: BehavioralDimensionValue
  // 1 = prefers very gentle support, 5 = prefers direct/blunt feedback
  prefers_direct_feedback: BehavioralDimensionValue
  lapse_recovery_style?: 'learn' | 'collapse' | 'mixed' | null
  confidence: ConfidenceLevel
}

// ── Segment Coverage — keyed by V1 spec domain names ────────────────────────

export interface SegmentCoverage {
  opening: SegmentSignalLevel
  currentUse: SegmentSignalLevel
  goals: SegmentSignalLevel
  readiness: SegmentSignalLevel
  riskMap: SegmentSignalLevel
  protectionMap: SegmentSignalLevel
  coachLens: SegmentSignalLevel
  communication: SegmentSignalLevel
  safety: SegmentSignalLevel
  segments_with_high_signal: number
  overall_coverage: ConfidenceLevel
}

// ── Full Formulation ─────────────────────────────────────────────────────────

export interface OnboardingFormulation {
  session_id: string
  timestamp: number
  schema_version: string
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

const emptyDimension: BehavioralDimensionValue = { value: null, confidence: 'low' }

/** Build a blank OnboardingFormulation with all fields at safe defaults. */
export function createEmptyFormulation(session_id: string): OnboardingFormulation {
  const c: ConfidenceLevel = 'low'
  return {
    session_id,
    timestamp: Date.now(),
    schema_version: '1.0',
    current_use: { disclosure_confidence: c },
    ideal_goal: { confidence_level: c },
    risk_map: { confidence: c },
    protection_map: { confidence: c },
    coach_profiles: {
      mi: { confidence: c },
      act: { confidence: c },
      dbt: { confidence: c },
      mindfulness: { confidence: c },
      self_compassion: { confidence: c },
      executive_support: { confidence: c },
    },
    communication_profile: { confidence: c },
    safety_flags: {
      suicidal_ideation: false, self_harm_risk: false,
      overdose_history: false, overdose_recent: false,
      withdrawal_risk: false, withdrawal_medically_complex: false,
      blackout_risk: false, using_alone: false,
      polysubstance: false, dv_risk: false, medical_urgency: false,
    },
    confidence_summary: {
      overall: c,
      current_use: c, ideal_goal: c, risk_map: c, protection_map: c,
      coach_profiles: c, communication_profile: c, safety_flags: c,
      low_confidence_domains: [],
    },
    behavioral_dimensions: {
      impulse_reflection: { ...emptyDimension },
      solo_social_coping: { ...emptyDimension },
      avoidance_approach: { ...emptyDimension },
      planned_in_moment: { ...emptyDimension },
      relief_seeking_values_guided: { ...emptyDimension },
      prefers_direct_feedback: { ...emptyDimension },
      lapse_recovery_style: null,
      confidence: c,
    },
    segment_coverage: {
      opening: 'none', currentUse: 'none', goals: 'none', readiness: 'none',
      riskMap: 'none', protectionMap: 'none', coachLens: 'none',
      communication: 'none', safety: 'none',
      segments_with_high_signal: 0, overall_coverage: 'low',
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

