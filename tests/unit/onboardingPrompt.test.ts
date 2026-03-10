/**
 * Static prompt composition tests for the onboarding system prompt.
 *
 * These tests catch regressions where:
 * - ITC_MASTER_PROMPT is dropped from the onboarding system prompt
 * - Legacy conflicting instructions (assessment mapping, targeted questioning)
 *   are re-added after ONBOARDING_V1_PROMPT
 * - Hard guardrails are removed from ONBOARDING_V1_PROMPT
 *
 * No network calls. Runs against the compiled prompt constants only.
 */

import { describe, it, expect } from '@jest/globals'
import {
  ITC_MASTER_PROMPT,
  CRISIS_AND_SCOPE_GUARDRAILS,
  ONBOARDING_V1_PROMPT,
} from '../../src/server/ai/promptFragments'

// Mirror the composition logic in src/app/api/onboarding/route.ts.
// If the route changes how it composes SYSTEM_PROMPT_V1, update this too.
const SYSTEM_PROMPT_V1 = [
  ITC_MASTER_PROMPT,
  '',
  CRISIS_AND_SCOPE_GUARDRAILS,
  '',
  ONBOARDING_V1_PROMPT,
].join('\n').trim()

// ─── ITC_MASTER_PROMPT presence ───────────────────────────────────────────────

describe('SYSTEM_PROMPT_V1 composition', () => {
  it('starts with ITC_MASTER_PROMPT content before any other layer', () => {
    // ITC_MASTER_PROMPT must be the first substantive block
    const itcStart = SYSTEM_PROMPT_V1.indexOf('INVITATION TO CHANGE')
    const guardrailsStart = SYSTEM_PROMPT_V1.indexOf('CRITICAL SAFETY AND SCOPE GUIDELINES')
    const onboardingStart = SYSTEM_PROMPT_V1.indexOf('FOUNDATIONAL STANCE')

    expect(itcStart).toBeGreaterThanOrEqual(0)
    expect(itcStart).toBeLessThan(guardrailsStart)
    expect(guardrailsStart).toBeLessThan(onboardingStart)
  })

  it('contains ITC righting-reflex prohibition', () => {
    // A unique phrase from ITC_MASTER_PROMPT — if this is missing, the ITC layer was dropped
    expect(SYSTEM_PROMPT_V1).toMatch(/righting reflex/i)
  })

  it('contains CRISIS_AND_SCOPE_GUARDRAILS', () => {
    expect(SYSTEM_PROMPT_V1).toContain('CRITICAL SAFETY AND SCOPE GUIDELINES')
  })

  it('contains ONBOARDING_V1_PROMPT 10-domain flow (not 11)', () => {
    expect(SYSTEM_PROMPT_V1).toContain('10-DOMAIN FLOW')
    expect(SYSTEM_PROMPT_V1).not.toContain('11-DOMAIN FLOW')
  })

  // ─── Forbidden phrases — legacy instructions that were removed ─────────────

  it('does NOT contain clinical stage ladder language', () => {
    // From the retired "Assessment Mapping Focus" block
    expect(SYSTEM_PROMPT_V1).not.toContain('precontemplation to maintenance')
  })

  it('does NOT contain "Targeted questioning mode"', () => {
    // From the retired "Targeted questioning mode" block — contradicts the one-question guardrail
    expect(SYSTEM_PROMPT_V1).not.toContain('Targeted questioning mode')
  })

  it('does NOT contain scale instructions ("scales (1-10)")', () => {
    // From the retired "Targeted questioning mode" block
    expect(SYSTEM_PROMPT_V1).not.toContain('scales (1-10)')
  })

  it('does NOT contain "Assessment Mapping Focus" header', () => {
    expect(SYSTEM_PROMPT_V1).not.toContain('Assessment Mapping Focus')
  })
})

// ─── ONBOARDING_V1_PROMPT guardrails ─────────────────────────────────────────

describe('ONBOARDING_V1_PROMPT hard guardrails', () => {
  it('requires exactly one question per turn', () => {
    expect(ONBOARDING_V1_PROMPT).toContain('One question per turn')
  })

  it('prohibits advice and skills during onboarding', () => {
    expect(ONBOARDING_V1_PROMPT).toMatch(/No advice, skills, or coping strategies during onboarding/i)
  })

  it('includes REFLECTION DISCIPLINE with banned openers', () => {
    expect(ONBOARDING_V1_PROMPT).toContain('REFLECTION DISCIPLINE')
    expect(ONBOARDING_V1_PROMPT).toMatch(/BANNED OPENERS/i)
  })

  it('includes TURN SHAPE VARIETY section', () => {
    expect(ONBOARDING_V1_PROMPT).toContain('TURN SHAPE VARIETY')
    expect(ONBOARDING_V1_PROMPT).toMatch(/Reflection only/i)
    expect(ONBOARDING_V1_PROMPT).toMatch(/Recap \+ redirect/i)
  })

  it('enforces response word limit', () => {
    // The ≤160 word limit is a hard guardrail
    expect(ONBOARDING_V1_PROMPT).toMatch(/≤160 words/i)
  })

  it('prohibits clinical or diagnostic language', () => {
    expect(ONBOARDING_V1_PROMPT).toMatch(/Do not use clinical or diagnostic language/i)
  })

  it('includes a pre-response self-check', () => {
    expect(ONBOARDING_V1_PROMPT).toContain('PRE-RESPONSE CHECK')
  })

  it('includes safety interrupt instructions', () => {
    expect(ONBOARDING_V1_PROMPT).toContain('SAFETY INTERRUPT')
  })

  it('COMPLETION REQUIREMENT includes all 9 required signals (including safety)', () => {
    expect(ONBOARDING_V1_PROMPT).toContain('COMPLETION REQUIREMENT')
    // Protection map requires concrete positive framing — not just a mention
    expect(ONBOARDING_V1_PROMPT).toMatch(/framed as helpful/i)
    // Communication style requires usable signal — not just "I don't know"
    expect(ONBOARDING_V1_PROMPT).toMatch(/not just.*I don.?t know/i)
    // Safety must be explicitly included in completion requirements
    expect(ONBOARDING_V1_PROMPT).toMatch(/Safety.*acute risk/i)
  })

  it('Emotional Drivers are folded into Domain 2 (not a separate Domain 3.5)', () => {
    expect(ONBOARDING_V1_PROMPT).toMatch(/DOMAIN 2.*EMOTIONAL DRIVERS/i)
    expect(ONBOARDING_V1_PROMPT).not.toContain('DOMAIN 3.5')
  })
})

// ─── ITC_MASTER_PROMPT standalone checks ─────────────────────────────────────

describe('ITC_MASTER_PROMPT content', () => {
  it('is non-empty', () => {
    expect(ITC_MASTER_PROMPT.length).toBeGreaterThan(500)
  })

  it('prohibits diagnosing or labeling', () => {
    expect(ITC_MASTER_PROMPT).toMatch(/does not diagnose|never assigns diagnoses/i)
  })

  it('requires preserving autonomy and dignity', () => {
    expect(ITC_MASTER_PROMPT).toMatch(/autonomy|dignity/i)
  })
})
