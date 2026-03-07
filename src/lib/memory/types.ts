/**
 * UserMemory
 *
 * Key-point memory about a user — not full transcripts.
 * Stores what Kato needs to give personalized, contextually-aware coaching.
 * This grows over time as the user interacts with the app.
 *
 * Fields are optional — unknown fields are explicitly tracked so the
 * system knows what it doesn't know yet (epistemic honesty).
 */

import type { AppStage } from '../appState'

export interface UserMemory {
  // ── Identity ────────────────────────────────────────────────────────────
  userId: string
  preferredName: string | null

  // ── First-run status ────────────────────────────────────────────────────
  consentAccepted: boolean
  appStage: AppStage
  onboardingStarted: boolean
  onboardingComplete: boolean
  firstRunChoiceMade: 'onboarding' | 'talk-now' | 'team-intro' | null

  // ── Goals & substance context ───────────────────────────────────────────
  goals: string[]
  substances: string[]           // substances or behaviors they want to change
  changeGoal: 'abstain' | 'reduce' | 'moderate' | 'undecided' | null

  // ── Motivations, barriers, triggers ────────────────────────────────────
  motivations: string[]
  barriers: string[]
  triggers: string[]
  strengths: string[]

  // ── Coaching preferences ────────────────────────────────────────────────
  preferredCoachingStyle: string | null
  tonePreferences: string | null

  // ── Skills tracking ─────────────────────────────────────────────────────
  helpfulSkills: string[]
  unhelpfulSkills: string[]

  // ── Working formulation ─────────────────────────────────────────────────
  // A short narrative of key patterns / themes. Updated over time.
  workingFormulation: string | null

  // ── Epistemics ──────────────────────────────────────────────────────────
  // What the system knows vs what it still needs to learn.
  knownFields: string[]
  unknownFields: string[]

  // ── Timestamps ─────────────────────────────────────────────────────────
  createdAt: number
  lastUpdated: number
}

/** Create a blank UserMemory for a new user. */
export function createEmptyMemory(userId: string): UserMemory {
  return {
    userId,
    preferredName: null,

    consentAccepted: false,
    appStage: 'PRE_CONSENT',
    onboardingStarted: false,
    onboardingComplete: false,
    firstRunChoiceMade: null,

    goals: [],
    substances: [],
    changeGoal: null,

    motivations: [],
    barriers: [],
    triggers: [],
    strengths: [],

    preferredCoachingStyle: null,
    tonePreferences: null,

    helpfulSkills: [],
    unhelpfulSkills: [],

    workingFormulation: null,

    knownFields: [],
    unknownFields: [
      'preferredName',
      'goals',
      'substances',
      'changeGoal',
      'motivations',
      'barriers',
      'triggers',
      'strengths',
      'preferredCoachingStyle',
      'workingFormulation',
    ],

    createdAt: Date.now(),
    lastUpdated: Date.now(),
  }
}

/**
 * Build a short plaintext summary of known memory fields
 * to inject into the API system prompt.
 */
export function buildMemorySummary(memory: UserMemory): string | undefined {
  const parts: string[] = []

  if (memory.preferredName) parts.push(`Preferred name: ${memory.preferredName}`)
  if (memory.goals.length) parts.push(`Goals: ${memory.goals.join(', ')}`)
  if (memory.substances.length) parts.push(`Substances/behaviors to change: ${memory.substances.join(', ')}`)
  if (memory.changeGoal) parts.push(`Change goal: ${memory.changeGoal}`)
  if (memory.motivations.length) parts.push(`Motivations: ${memory.motivations.join(', ')}`)
  if (memory.barriers.length) parts.push(`Barriers: ${memory.barriers.join(', ')}`)
  if (memory.triggers.length) parts.push(`Triggers: ${memory.triggers.join(', ')}`)
  if (memory.strengths.length) parts.push(`Strengths: ${memory.strengths.join(', ')}`)
  if (memory.preferredCoachingStyle) parts.push(`Coaching style preference: ${memory.preferredCoachingStyle}`)
  if (memory.workingFormulation) parts.push(`Working formulation: ${memory.workingFormulation}`)

  return parts.length > 0 ? parts.join('\n') : undefined
}
