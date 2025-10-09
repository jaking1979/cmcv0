/**
 * Unit tests for coach modules
 */

import { describe, it, expect } from '@jest/globals'
import type { CoachMessage } from '../../src/server/ai/types'
import { analyzeForDBT, shouldActivateDBT } from '../../src/server/ai/coaches/dbtCoach'
import { analyzeForSelfCompassion, shouldActivateSelfCompassion } from '../../src/server/ai/coaches/selfCompassionCoach'
import { analyzeForCBT, shouldActivateCBT } from '../../src/server/ai/coaches/cbtCoach'

describe('DBT Coach', () => {
  describe('analyzeForDBT', () => {
    it('should detect distress tolerance needs', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I can't handle this overwhelming feeling" },
      ]

      const analysis = analyzeForDBT(messages)
      
      expect(analysis.coachType).toBe('dbt')
      expect(analysis.signals).toContain('distress-tolerance')
      expect(analysis.confidence).toBeGreaterThan(0.5)
    })

    it('should detect emotion dysregulation', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I have such intense mood swings lately" },
      ]

      const analysis = analyzeForDBT(messages)
      
      expect(analysis.signals).toContain('emotion-regulation')
      expect(analysis.confidence).toBeGreaterThan(0)
    })

    it('should detect interpersonal challenges', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I'm having conflicts with my family and don't know how to communicate" },
      ]

      const analysis = analyzeForDBT(messages)
      
      expect(analysis.signals).toContain('interpersonal')
    })

    it('should have low confidence for irrelevant messages', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "What's the weather like today?" },
      ]

      const analysis = analyzeForDBT(messages)
      
      expect(analysis.confidence).toBeLessThan(0.3)
    })
  })

  describe('shouldActivateDBT', () => {
    it('should activate for high-distress situations', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I'm at my breaking point and feel like I'm losing control" },
      ]

      expect(shouldActivateDBT(messages)).toBe(true)
    })

    it('should not activate for low-relevance conversations', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I had a good day at work today" },
      ]

      expect(shouldActivateDBT(messages)).toBe(false)
    })
  })
})

describe('Self-Compassion Coach', () => {
  describe('analyzeForSelfCompassion', () => {
    it('should detect self-criticism', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I'm such a failure. I can't do anything right." },
      ]

      const analysis = analyzeForSelfCompassion(messages)
      
      expect(analysis.coachType).toBe('self-compassion')
      expect(analysis.signals).toContain('self-criticism')
      expect(analysis.confidence).toBeGreaterThan(0.6)
    })

    it('should detect shame', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I feel so ashamed of what I did" },
      ]

      const analysis = analyzeForSelfCompassion(messages)
      
      expect(analysis.signals).toContain('shame')
      expect(analysis.confidence).toBeGreaterThan(0.5)
    })

    it('should detect isolation feelings', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I'm the only one who struggles with this. Nobody else understands." },
      ]

      const analysis = analyzeForSelfCompassion(messages)
      
      expect(analysis.signals).toContain('isolation')
    })

    it('should detect over-identification', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I am my addiction. That's just who I am." },
      ]

      const analysis = analyzeForSelfCompassion(messages)
      
      expect(analysis.signals).toContain('over-identification')
    })

    it('should recognize positive self-compassion', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I'm trying to be kind to myself and remember everyone makes mistakes" },
      ]

      const analysis = analyzeForSelfCompassion(messages)
      
      expect(analysis.signals).toContain('self-kindness')
    })
  })

  describe('shouldActivateSelfCompassion', () => {
    it('should activate for harsh self-judgment', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I hate myself for relapsing. I'm such a terrible person." },
      ]

      expect(shouldActivateSelfCompassion(messages)).toBe(true)
    })
  })
})

describe('CBT Coach', () => {
  describe('analyzeForCBT', () => {
    it('should detect all-or-nothing thinking', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I always mess things up. I never get anything right." },
      ]

      const analysis = analyzeForCBT(messages)
      
      expect(analysis.coachType).toBe('cbt')
      expect(analysis.signals).toContain('all-or-nothing')
    })

    it('should detect catastrophizing', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "This is a disaster. Everything is going to fall apart." },
      ]

      const analysis = analyzeForCBT(messages)
      
      expect(analysis.signals).toContain('catastrophizing')
      expect(analysis.confidence).toBeGreaterThan(0.5)
    })

    it('should detect should statements', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I should have known better. I must stop making these mistakes." },
      ]

      const analysis = analyzeForCBT(messages)
      
      expect(analysis.signals).toContain('should-statements')
    })

    it('should detect behavioral activation needs', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I have no motivation and don't want to do anything" },
      ]

      const analysis = analyzeForCBT(messages)
      
      expect(analysis.signals).toContain('behavioral-activation')
    })

    it('should detect avoidance patterns', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I keep putting things off because I can't bring myself to deal with it" },
      ]

      const analysis = analyzeForCBT(messages)
      
      expect(analysis.signals).toContain('avoidance')
    })

    it('should detect mind reading', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "I know they think I'm a failure" },
      ]

      const analysis = analyzeForCBT(messages)
      
      expect(analysis.signals).toContain('mind-reading')
    })
  })

  describe('shouldActivateCBT', () => {
    it('should activate for cognitive distortions', () => {
      const messages: CoachMessage[] = [
        { role: 'user', content: "It's going to be a complete disaster and everything will be ruined" },
      ]

      expect(shouldActivateCBT(messages)).toBe(true)
    })
  })
})

describe('Cross-coach analysis', () => {
  it('should detect multiple coach signals in complex messages', () => {
    const messages: CoachMessage[] = [
      { 
        role: 'user', 
        content: "I'm such a failure (self-compassion). I always mess everything up (CBT all-or-nothing). I can't handle this overwhelming feeling (DBT distress tolerance)." 
      },
    ]

    const dbtAnalysis = analyzeForDBT(messages)
    const scAnalysis = analyzeForSelfCompassion(messages)
    const cbtAnalysis = analyzeForCBT(messages)

    // All coaches should have reasonable confidence
    expect(dbtAnalysis.confidence).toBeGreaterThan(0)
    expect(scAnalysis.confidence).toBeGreaterThan(0)
    expect(cbtAnalysis.confidence).toBeGreaterThan(0)
  })
})


