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

// ─── V1 OnboardingFormulation ────────────────────────────────────────────────
// The authoritative typed schema produced by the v1 onboarding flow.
// All fields are provisional and heuristic — not validated clinical scores.
// See docs/v1_onboarding_spec.md for the full specification.

export type ProfileBand = 'Low' | 'Emerging' | 'Moderate' | 'Strong'
export type ConfidenceLevel = 'Low' | 'Medium' | 'High'
export type CoverageStatus = 'not_started' | 'partial' | 'complete'

export interface SubstanceEntry {
  name: string
  frequency: string | null
  amount_description: string | null
  route: string | null
}

export interface CurrentUse {
  substances: SubstanceEntry[]
  pattern_consistency: 'daily' | 'heavy_episodic' | 'irregular' | 'unknown' | null
  recent_change_direction: 'increasing' | 'decreasing' | 'stable' | 'unknown' | null
  functional_impact: string | null
  disclosure_confidence: ConfidenceLevel
}

export interface IdealGoal {
  goal_type: 'abstinence' | 'moderation' | 'reduction' | 'harm_reduction' | 'undecided' | null
  goal_specificity: 'clear' | 'vague' | 'none' | null
  user_stated_goal: string | null
  moderation_vision: string | null
  ambivalence_level: ProfileBand
  values_signals: string[]
  prior_attempts: boolean | null
  prior_attempt_description: string | null
}

export interface TriggerEntry {
  category: 'emotional' | 'situational' | 'relational' | 'sensory' | 'temporal'
  description: string
}

export interface RiskMap {
  triggers: TriggerEntry[]
  high_risk_times: string[]
  high_risk_places: string[]
  emotional_drivers: string[]
  social_risk_factors: string[]
  craving_pattern: 'sudden' | 'gradual' | 'situational' | 'mixed' | null
  habitual_pattern: boolean
  recent_high_risk_event: boolean
}

export interface ProtectionMap {
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

export interface MIProfile {
  motivation_level: ProfileBand
  readiness: ProfileBand
  ambivalence_tolerance: ProfileBand
  confidence: ConfidenceLevel
}

export interface ACTProfile {
  values_clarity: ProfileBand
  psychological_flexibility: ProfileBand
  experiential_avoidance: ProfileBand
  confidence: ConfidenceLevel
}

export interface DBTProfile {
  distress_tolerance: ProfileBand
  emotion_regulation: ProfileBand
  interpersonal_effectiveness: ProfileBand
  mindfulness_skills: ProfileBand
  confidence: ConfidenceLevel
}

export interface MindfulnessProfile {
  interoceptive_awareness: ProfileBand
  present_moment_attention: ProfileBand
  nonjudgmental_stance: ProfileBand
  confidence: ConfidenceLevel
}

export interface SelfCompassionProfile {
  self_kindness: ProfileBand
  common_humanity: ProfileBand
  lapse_recover_style: 'learn' | 'collapse' | 'mixed' | null
  inner_critic_intensity: ProfileBand
  confidence: ConfidenceLevel
}

export interface ExecutiveSupportProfile {
  planning_capacity: ProfileBand
  follow_through: ProfileBand
  impulse_gap: ProfileBand
  structure_need: ProfileBand
  confidence: ConfidenceLevel
}

export interface CoachProfiles {
  mi: MIProfile
  act: ACTProfile
  dbt: DBTProfile
  mindfulness: MindfulnessProfile
  self_compassion: SelfCompassionProfile
  executive_support: ExecutiveSupportProfile
}

export interface CommunicationProfile {
  style: 'direct' | 'reflective' | 'mixed' | null
  preferred_depth: 'surface' | 'moderate' | 'deep' | null
  verbosity: 'brief' | 'moderate' | 'verbose' | null
  help_seeking_style: 'instrumental' | 'exploratory' | 'mixed' | null
  challenge_tolerance: 'low' | 'moderate' | 'high' | null
  shame_sensitivity: 'low' | 'moderate' | 'high' | null
  engagement_level: 'low' | 'moderate' | 'high' | null
}

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
  acute_risk_level: 'none' | 'low' | 'moderate' | 'high'
  safety_notes: string | null
}

export interface ConfidenceSummary {
  current_use: ConfidenceLevel
  ideal_goal: ConfidenceLevel
  risk_map: ConfidenceLevel
  protection_map: ConfidenceLevel
  coach_profiles: ConfidenceLevel
  communication_profile: ConfidenceLevel
  safety_flags: ConfidenceLevel
  overall: ConfidenceLevel
  low_confidence_domains: string[]
}

export interface DimensionScore {
  value: number | null  // 1–5 scale
  confidence: ConfidenceLevel
}

export interface BehavioralDimensions {
  impulse_reflection: DimensionScore         // 1=impulse, 5=reflection
  solo_social_coping: DimensionScore         // 1=solo, 5=social
  avoidance_approach: DimensionScore         // 1=avoidance, 5=approach
  planned_in_moment: DimensionScore          // 1=in-the-moment, 5=planned
  relief_seeking_values_guided: DimensionScore // 1=relief, 5=values-guided
  lapse_recovery_style: 'learn' | 'collapse' | 'mixed' | null
  prefers_direct_feedback: DimensionScore    // 1=gentle, 5=direct
  confidence: ConfidenceLevel
}

export interface SegmentCoverage {
  seg0_opening: CoverageStatus
  seg1_why_now: CoverageStatus
  seg2_current_use: CoverageStatus
  seg3_goals: CoverageStatus
  seg4_risk_map: CoverageStatus
  seg5_protection_map: CoverageStatus
  seg6_skills_map: CoverageStatus
  seg7_communication: CoverageStatus
  seg8_safety: CoverageStatus
  seg9_summary: CoverageStatus
}

export interface OnboardingFormulation {
  session_id: string
  timestamp: number
  schema_version: string  // "1.0"
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

/** Build a blank OnboardingFormulation with all fields at defaults/null */
export function createEmptyFormulation(session_id: string): OnboardingFormulation {
  const defaultBand: ProfileBand = 'Low'
  const defaultConf: ConfidenceLevel = 'Low'
  const defaultDim: DimensionScore = { value: null, confidence: 'Low' }
  return {
    session_id,
    timestamp: Date.now(),
    schema_version: '1.0',
    current_use: {
      substances: [], pattern_consistency: null,
      recent_change_direction: null, functional_impact: null,
      disclosure_confidence: 'Low',
    },
    ideal_goal: {
      goal_type: null, goal_specificity: null, user_stated_goal: null,
      moderation_vision: null, ambivalence_level: defaultBand,
      values_signals: [], prior_attempts: null, prior_attempt_description: null,
    },
    risk_map: {
      triggers: [], high_risk_times: [], high_risk_places: [],
      emotional_drivers: [], social_risk_factors: [],
      craving_pattern: null, habitual_pattern: false, recent_high_risk_event: false,
    },
    protection_map: {
      supportive_people: [], supportive_places: [], protective_routines: [],
      emotional_anchors: [], prior_successes: [], prior_attempts_failed: false,
      coping_resources_present: false, professional_support_current: false,
      professional_support_type: null,
    },
    coach_profiles: {
      mi: { motivation_level: defaultBand, readiness: defaultBand, ambivalence_tolerance: defaultBand, confidence: defaultConf },
      act: { values_clarity: defaultBand, psychological_flexibility: defaultBand, experiential_avoidance: defaultBand, confidence: defaultConf },
      dbt: { distress_tolerance: defaultBand, emotion_regulation: defaultBand, interpersonal_effectiveness: defaultBand, mindfulness_skills: defaultBand, confidence: defaultConf },
      mindfulness: { interoceptive_awareness: defaultBand, present_moment_attention: defaultBand, nonjudgmental_stance: defaultBand, confidence: defaultConf },
      self_compassion: { self_kindness: defaultBand, common_humanity: defaultBand, lapse_recover_style: null, inner_critic_intensity: defaultBand, confidence: defaultConf },
      executive_support: { planning_capacity: defaultBand, follow_through: defaultBand, impulse_gap: defaultBand, structure_need: defaultBand, confidence: defaultConf },
    },
    communication_profile: {
      style: null, preferred_depth: null, verbosity: null,
      help_seeking_style: null, challenge_tolerance: null,
      shame_sensitivity: null, engagement_level: null,
    },
    safety_flags: {
      suicidal_ideation: false, self_harm_risk: false,
      overdose_history: false, overdose_recent: false,
      withdrawal_risk: false, withdrawal_medically_complex: false,
      blackout_risk: false, using_alone: false, polysubstance: false, dv_risk: false,
      acute_risk_level: 'none', safety_notes: null,
    },
    confidence_summary: {
      current_use: defaultConf, ideal_goal: defaultConf, risk_map: defaultConf,
      protection_map: defaultConf, coach_profiles: defaultConf,
      communication_profile: defaultConf, safety_flags: defaultConf,
      overall: defaultConf, low_confidence_domains: [],
    },
    behavioral_dimensions: {
      impulse_reflection: defaultDim, solo_social_coping: defaultDim,
      avoidance_approach: defaultDim, planned_in_moment: defaultDim,
      relief_seeking_values_guided: defaultDim, lapse_recovery_style: null,
      prefers_direct_feedback: defaultDim, confidence: defaultConf,
    },
    segment_coverage: {
      seg0_opening: 'not_started', seg1_why_now: 'not_started',
      seg2_current_use: 'not_started', seg3_goals: 'not_started',
      seg4_risk_map: 'not_started', seg5_protection_map: 'not_started',
      seg6_skills_map: 'not_started', seg7_communication: 'not_started',
      seg8_safety: 'not_started', seg9_summary: 'not_started',
    },
  }
}

// ── V1 OnboardingFormulation — Canonical Typed Schema ────────────────────────
//
// Replaces/extends the loose OnboardingProfile with a fully structured
// formulation aligned to the 10-segment ITC onboarding flow.

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

