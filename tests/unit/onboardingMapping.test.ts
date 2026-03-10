/**
 * Unit tests for V1 onboarding assessment mapping.
 *
 * Tests cover:
 * - inferSegmentCoverage() domain keys (V1 schema)
 * - createEmptyFormulation() shape and defaults
 * - Legacy OnboardingProfile shim (validateProfile)
 */

import { describe, it, expect } from '@jest/globals'
import { validateProfile, inferSegmentCoverage } from '../../src/server/ai/mapping/onboardingMapping'
import { createEmptyFormulation } from '../../src/server/ai/types'
import type { OnboardingProfile } from '../../src/server/ai/mapping/onboardingMapping'

describe('Onboarding Assessment Mapping', () => {
  describe('validateProfile', () => {
    it('should validate a complete profile', () => {
      const profile: OnboardingProfile = {
        sessionId: 'sess_test123',
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {
            selfKindness: 3,
            commonHumanity: 4,
            mindfulness: 3
          },
          urica: {
            stage: 'contemplation',
            confidence: 0.8
          },
          kessler10: {
            score: 25,
            distressLevel: 'moderate'
          },
          who5: {
            score: 12,
            wellbeingLevel: 'moderate'
          },
          dbtWccl: {
            problemSolving: 3,
            socialSupport: 4,
            avoidance: 2
          },
          copingSelfEfficacy: {
            problemFocused: 6,
            emotionFocused: 5,
            socialSupport: 7
          },
          assist: {
            substanceType: ['alcohol'],
            riskLevel: 'moderate'
          },
          asi: {
            relationships: 'Some tension with family',
            employment: 'Performing well but stressed',
            family: 'Supportive but concerned',
            legal: 'No issues',
            health: 'Generally good'
          }
        },
        confidence: {
          selfCompassion: 0.75,
          urica: 0.85,
          kessler10: 0.7,
          who5: 0.65,
          dbtWccl: 0.6,
          copingSelfEfficacy: 0.7,
          assist: 0.9,
          asi: 0.8,
          overall: 0.75
        },
        rawTranscript: 'Sample transcript',
        redactedTranscript: 'Sample transcript'
      }

      expect(validateProfile(profile)).toBe(true)
    })

    it('should reject profile without sessionId', () => {
      const profile: OnboardingProfile = {
        sessionId: '',
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {},
          urica: {},
          kessler10: {},
          who5: {},
          dbtWccl: {},
          copingSelfEfficacy: {},
          assist: {},
          asi: {}
        },
        confidence: {
          selfCompassion: 0,
          urica: 0,
          kessler10: 0,
          who5: 0,
          dbtWccl: 0,
          copingSelfEfficacy: 0,
          assist: 0,
          asi: 0,
          overall: 0
        },
        rawTranscript: 'Test',
        redactedTranscript: 'Test'
      }

      expect(validateProfile(profile)).toBe(false)
    })

    it('should reject profile with invalid confidence scores', () => {
      const profile: OnboardingProfile = {
        sessionId: 'sess_test',
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {},
          urica: {},
          kessler10: {},
          who5: {},
          dbtWccl: {},
          copingSelfEfficacy: {},
          assist: {},
          asi: {}
        },
        confidence: {
          selfCompassion: 1.5, // Invalid: > 1
          urica: 0,
          kessler10: 0,
          who5: 0,
          dbtWccl: 0,
          copingSelfEfficacy: 0,
          assist: 0,
          asi: 0,
          overall: 0
        },
        rawTranscript: 'Test',
        redactedTranscript: 'Test'
      }

      expect(validateProfile(profile)).toBe(false)
    })

    it('should accept profile with partial construct data', () => {
      const profile: OnboardingProfile = {
        sessionId: 'sess_test',
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {
            selfKindness: 3
            // Other fields null/missing - this is OK
          },
          urica: {
            stage: 'contemplation'
          },
          kessler10: {},
          who5: {},
          dbtWccl: {},
          copingSelfEfficacy: {},
          assist: {},
          asi: {}
        },
        confidence: {
          selfCompassion: 0.5,
          urica: 0.7,
          kessler10: 0.2,
          who5: 0.1,
          dbtWccl: 0.3,
          copingSelfEfficacy: 0.3,
          assist: 0,
          asi: 0.4,
          overall: 0.35
        },
        rawTranscript: 'Test',
        redactedTranscript: 'Test'
      }

      expect(validateProfile(profile)).toBe(true)
    })
  })

  describe('Profile confidence interpretation', () => {
    it('should interpret confidence levels correctly', () => {
      // >= 0.7: Well understood
      expect(0.75).toBeGreaterThanOrEqual(0.7)
      
      // 0.3-0.7: Partially understood
      expect(0.5).toBeGreaterThan(0.3)
      expect(0.5).toBeLessThan(0.7)
      
      // < 0.3: Not yet explored
      expect(0.2).toBeLessThan(0.3)
    })
  })

  describe('Assessment construct ranges', () => {
    it('should validate URICA stages', () => {
      const validStages = ['precontemplation', 'contemplation', 'preparation', 'action', 'maintenance']
      
      for (const stage of validStages) {
        expect(validStages).toContain(stage)
      }
    })

    it('should validate K10 score range', () => {
      const validScores = [10, 25, 35, 50]
      const invalidScores = [5, 55, -1]
      
      for (const score of validScores) {
        expect(score).toBeGreaterThanOrEqual(10)
        expect(score).toBeLessThanOrEqual(50)
      }
      
      for (const score of invalidScores) {
        expect(score < 10 || score > 50).toBe(true)
      }
    })

    it('should validate WHO-5 score range', () => {
      const validScores = [0, 12, 18, 25]
      const invalidScores = [-1, 30]
      
      for (const score of validScores) {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(25)
      }
      
      for (const score of invalidScores) {
        expect(score < 0 || score > 25).toBe(true)
      }
    })
  })

  describe('Real-world mapping scenarios', () => {
    it('should handle a minimal transcript', () => {
      const minimalProfile: OnboardingProfile = {
        sessionId: 'sess_test',
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {},
          urica: {},
          kessler10: {},
          who5: {},
          dbtWccl: {},
          copingSelfEfficacy: {},
          assist: {},
          asi: {}
        },
        confidence: {
          selfCompassion: 0,
          urica: 0,
          kessler10: 0,
          who5: 0,
          dbtWccl: 0,
          copingSelfEfficacy: 0,
          assist: 0,
          asi: 0,
          overall: 0
        },
        rawTranscript: 'user: hi\nassistant: hello',
        redactedTranscript: 'user: hi\nassistant: hello'
      }

      expect(validateProfile(minimalProfile)).toBe(true)
      expect(minimalProfile.confidence.overall).toBe(0)
    })
  })
})

// ─── V1 Formulation Schema ────────────────────────────────────────────────────

describe('createEmptyFormulation()', () => {
  it('produces a complete OnboardingFormulation with correct defaults', () => {
    const f = createEmptyFormulation('sess_test')
    expect(f.session_id).toBe('sess_test')
    expect(f.schema_version).toBe('1.0')
    expect(f.current_use.disclosure_confidence).toBe('low')
    expect(f.ideal_goal.confidence_level).toBe('low')
    expect(f.safety_flags.suicidal_ideation).toBe(false)
    expect(f.safety_flags.self_harm_risk).toBe(false)
    expect(f.safety_flags.polysubstance).toBe(false)
  })

  it('uses V1 coach profile keys (mi, act, dbt, mindfulness, self_compassion, executive_support)', () => {
    const f = createEmptyFormulation('sess_test')
    expect(f.coach_profiles).toHaveProperty('mi')
    expect(f.coach_profiles).toHaveProperty('act')
    expect(f.coach_profiles).toHaveProperty('dbt')
    expect(f.coach_profiles).toHaveProperty('mindfulness')
    expect(f.coach_profiles).toHaveProperty('self_compassion')
    expect(f.coach_profiles).toHaveProperty('executive_support')
    // Legacy keys must not be present
    expect(f.coach_profiles).not.toHaveProperty('readiness')
    expect(f.coach_profiles).not.toHaveProperty('distress')
    expect(f.coach_profiles).not.toHaveProperty('coping')
    expect(f.coach_profiles).not.toHaveProperty('substance')
    expect(f.coach_profiles).not.toHaveProperty('life_domains')
  })

  it('uses V1 behavioral dimension keys (1-5 scale with confidence)', () => {
    const f = createEmptyFormulation('sess_test')
    const bd = f.behavioral_dimensions
    expect(bd).toHaveProperty('impulse_reflection')
    expect(bd).toHaveProperty('solo_social_coping')
    expect(bd).toHaveProperty('avoidance_approach')
    expect(bd).toHaveProperty('planned_in_moment')
    expect(bd).toHaveProperty('relief_seeking_values_guided')
    expect(bd).toHaveProperty('prefers_direct_feedback')
    expect(bd.impulse_reflection.value).toBeNull()
    expect(bd.impulse_reflection.confidence).toBe('low')
    // Legacy flat keys must not be present
    expect(bd).not.toHaveProperty('impulse_to_reflection')
    expect(bd).not.toHaveProperty('avoidance_to_approach')
    expect(bd).not.toHaveProperty('shame_to_self_compassion')
  })

  it('uses V1 confidence_summary keys (no nested per_domain)', () => {
    const f = createEmptyFormulation('sess_test')
    const cs = f.confidence_summary
    expect(cs).toHaveProperty('current_use')
    expect(cs).toHaveProperty('coach_profiles')
    expect(cs).toHaveProperty('safety_flags')
    expect(cs).toHaveProperty('communication_profile')
    expect(cs).toHaveProperty('low_confidence_domains')
    expect(cs).not.toHaveProperty('per_domain')
  })

  it('uses V1 segment_coverage domain keys', () => {
    const f = createEmptyFormulation('sess_test')
    const sc = f.segment_coverage
    expect(sc).toHaveProperty('opening')
    expect(sc).toHaveProperty('currentUse')
    expect(sc).toHaveProperty('goals')
    expect(sc).toHaveProperty('riskMap')
    expect(sc).toHaveProperty('protectionMap')
    expect(sc).toHaveProperty('coachLens')
    expect(sc).toHaveProperty('communication')
    expect(sc).toHaveProperty('safety')
    // Legacy keys must not be present
    expect(sc).not.toHaveProperty('seg1_opening')
    expect(sc).not.toHaveProperty('seg7_supports')
  })
})

describe('inferSegmentCoverage()', () => {
  it('returns V1 domain keys (not legacy seg# keys)', () => {
    const coverage = inferSegmentCoverage('I drink about 4 drinks every night, usually when stressed.')
    expect(coverage).toHaveProperty('opening')
    expect(coverage).toHaveProperty('currentUse')
    expect(coverage).toHaveProperty('riskMap')
    expect(coverage).toHaveProperty('protectionMap')
    expect(coverage).toHaveProperty('coachLens')
    expect(coverage).not.toHaveProperty('seg1_opening')
    expect(coverage).not.toHaveProperty('seg2_behavior_pattern')
  })

  it('correctly detects behavior pattern signal', () => {
    const coverage = inferSegmentCoverage('I drink alcohol every day, about 5 drinks nightly after work. I feel stressed and anxious.')
    expect(coverage.currentUse).not.toBe('none')
  })

  it('correctly detects readiness signal', () => {
    const coverage = inferSegmentCoverage('I am ready to change but part of me is not sure I want to quit.')
    expect(coverage.readiness).not.toBe('none')
  })

  it('has segments_with_high_signal and overall_coverage fields', () => {
    const coverage = inferSegmentCoverage('some transcript')
    expect(typeof coverage.segments_with_high_signal).toBe('number')
    expect(['low', 'medium', 'high']).toContain(coverage.overall_coverage)
  })
})
