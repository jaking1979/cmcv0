/**
 * App Stage
 *
 * Explicit state machine for the first-run and ongoing chat experience.
 * The current stage is persisted in localStorage so the user resumes where
 * they left off on the next visit.
 *
 * Stage flow:
 *
 *   PRE_CONSENT
 *     → (user clicks "I'm OK with this!")
 *   POST_CONSENT_NAME
 *     → (user submits their preferred name)
 *   FIRST_RUN_CHOICE
 *     → "Start onboarding"      → ONBOARDING
 *     → "Start talking now"     → LIGHT_CHAT
 *     → "Meet your team"        → TEAM_INTRO
 *
 *   TEAM_INTRO
 *     → (tap a coach)           → COACH_LENS
 *     → "Start chatting"        → LIGHT_CHAT
 *
 *   COACH_LENS
 *     → "← Back"               → TEAM_INTRO
 *
 *   ONBOARDING    (scaffold — entry point only for now)
 *     → (proceed)               → LIGHT_CHAT
 *
 *   LIGHT_CHAT    — active coaching, generic (no full onboarding completed)
 *   PERSONALIZED_CHAT — active coaching, fully personalized (onboarding done)
 */

export type AppStage =
  | 'PRE_CONSENT'
  | 'POST_CONSENT_NAME'
  | 'FIRST_RUN_CHOICE'
  | 'ONBOARDING'
  | 'LIGHT_CHAT'
  | 'TEAM_INTRO'
  | 'COACH_LENS'
  | 'PERSONALIZED_CHAT'

const APP_STAGE_KEY = 'cmc_app_stage'

const VALID_STAGES: ReadonlySet<string> = new Set<AppStage>([
  'PRE_CONSENT',
  'POST_CONSENT_NAME',
  'FIRST_RUN_CHOICE',
  'ONBOARDING',
  'LIGHT_CHAT',
  'TEAM_INTRO',
  'COACH_LENS',
  'PERSONALIZED_CHAT',
])

/** Load the persisted app stage, defaulting to PRE_CONSENT for first-time users. */
export function loadAppStage(): AppStage {
  if (typeof window === 'undefined') return 'PRE_CONSENT'
  try {
    const raw = localStorage.getItem(APP_STAGE_KEY)
    if (raw && VALID_STAGES.has(raw)) return raw as AppStage
  } catch { /* ignore */ }
  return 'PRE_CONSENT'
}

/** Persist the app stage to localStorage. */
export function saveAppStage(stage: AppStage): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(APP_STAGE_KEY, stage)
  } catch { /* ignore */ }
}

/** Remove the persisted app stage (e.g., full reset). */
export function clearAppStage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(APP_STAGE_KEY)
  } catch { /* ignore */ }
}

/** Returns true when the user is in an active coaching conversation. */
export function isActiveChatStage(stage: AppStage): boolean {
  return stage === 'LIGHT_CHAT' || stage === 'PERSONALIZED_CHAT'
}

/** Returns true when the user has passed the first-run orientation screens. */
export function hasCompletedConsent(stage: AppStage): boolean {
  return stage !== 'PRE_CONSENT' && stage !== 'POST_CONSENT_NAME'
}

/** Returns true when the stage should show the first-run UI instead of the normal chat. */
export function isFirstRunStage(stage: AppStage): boolean {
  return !isActiveChatStage(stage) && stage !== 'ONBOARDING'
}
