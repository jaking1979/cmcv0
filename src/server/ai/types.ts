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

