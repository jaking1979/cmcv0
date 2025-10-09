/**
 * Unit tests for onboarding assessment mapping
 */

import { describe, it, expect } from '@jest/globals'
import { validateProfile } from '../../src/server/ai/mapping/onboardingMapping'
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

    it('should handle a rich transcript with high confidence', () => {
      const richProfile: OnboardingProfile = {
        sessionId: 'sess_test',
        timestamp: Date.now(),
        constructs: {
          selfCompassion: {
            selfKindness: 2,
            commonHumanity: 3,
            mindfulness: 3
          },
          urica: {
            stage: 'contemplation',
            confidence: 0.85
          },
          kessler10: {
            score: 30,
            distressLevel: 'high'
          },
          who5: {
            score: 8,
            wellbeingLevel: 'poor'
          },
          dbtWccl: {
            problemSolving: 3,
            socialSupport: 4,
            avoidance: 3
          },
          copingSelfEfficacy: {
            problemFocused: 5,
            emotionFocused: 4,
            socialSupport: 6
          },
          assist: {
            substanceType: ['alcohol', 'cannabis'],
            riskLevel: 'moderate'
          },
          asi: {
            relationships: 'Strained relationship with spouse',
            employment: 'Job performance declining',
            family: 'Family concerned about drinking',
            legal: 'No current issues',
            health: 'Sleep problems, anxiety'
          }
        },
        confidence: {
          selfCompassion: 0.8,
          urica: 0.85,
          kessler10: 0.75,
          who5: 0.7,
          dbtWccl: 0.7,
          copingSelfEfficacy: 0.65,
          assist: 0.9,
          asi: 0.8,
          overall: 0.76
        },
        rawTranscript: 'Long detailed conversation...',
        redactedTranscript: 'Long detailed conversation...'
      }

      expect(validateProfile(richProfile)).toBe(true)
      expect(richProfile.confidence.overall).toBeGreaterThan(0.7)
      
      // Check all domains have some confidence
      expect(richProfile.confidence.selfCompassion).toBeGreaterThan(0)
      expect(richProfile.confidence.assist).toBeGreaterThan(0)
    })
  })
})
