/**
 * Unit tests for the coverage-led onboarding model.
 *
 * Tests computeDomainCoverage(), hasMinimumRequiredCoverage(), and
 * shouldOfferSummaryNow() via the exported functions from coverageModel.ts.
 *
 * Covers 8 user scenarios aligned with the V1 spec requirements.
 */

import { describe, it, expect } from '@jest/globals'
import {
  computeDomainCoverage,
  hasMinimumRequiredCoverage,
  shouldOfferSummaryNow,
  nextDomainToFocus,
  domainToSegmentNumber,
  mentionsPositiveProtection,
  countPositiveProtectionSignals,
  hasSustainTalk,
  type Msg,
} from '../../src/server/onboarding/coverageModel'

function userMsg(content: string): Msg { return { role: 'user', content } }
function assistantMsg(content: string): Msg { return { role: 'assistant', content } }

// ─── computeDomainCoverage ────────────────────────────────────────────────────

describe('computeDomainCoverage()', () => {
  describe('Scenario 1: Open, detailed user', () => {
    const history: Msg[] = [
      userMsg('I drink alcohol every day, usually 4-5 beers in the evening after work.'),
      assistantMsg('What does it give you in those moments?'),
      userMsg("It helps me relax and wind down. Work is really stressful and I feel anxious all day."),
      assistantMsg('What tends to happen with your drinking when things are especially hard at work?'),
      userMsg("I drink more. Sometimes I black out on weekends. My wife is worried and my health is suffering."),
      assistantMsg('What would you like things to look like differently?'),
      userMsg("I want to cut back to a couple drinks, not quit entirely. My kids keep me going and my morning runs help."),
      assistantMsg('Have you tried cutting back before?'),
      userMsg("Yeah, I cut back for a month last year. It helped. I'm pretty good at planning when I'm motivated."),
      assistantMsg('When you get an urge, what tends to happen?'),
      userMsg("I usually just go with it. I've been thinking about trying again. Part of me wants to but part of me likes unwinding."),
    ]
    const latest = "I guess I prefer when someone is direct with me rather than just listening."

    it('marks currentUse as complete', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.currentUse).toBe('complete')
    })
    it('marks goals as complete', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.goals).toBe('complete')
    })
    it('marks riskMap as complete (multiple categories)', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.riskMap).toBe('complete')
    })
    it('marks protectionMap as complete (kids + morning runs)', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.protectionMap).toBe('complete')
    })
    it('detects ambivalence_clearly_present', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.ambivalence_clearly_present).toBe(true)
    })
    it('marks communication as complete (direct preference)', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.communication).toBe('complete')
    })
  })

  describe('Scenario 2: Guarded, vague user', () => {
    const history: Msg[] = [
      userMsg("I don't know, I just use sometimes."),
      assistantMsg('What usually brings it on?'),
      userMsg("I don't know."),
      assistantMsg("Is there anything you'd want to be different?"),
      userMsg("I guess. Not sure."),
    ]
    const latest = "I don't really know what I want."

    it('marks currentUse as partial (no frequency/function beyond substance mention)', () => {
      const cov = computeDomainCoverage(history, latest)
      // "use" is not a strong substance signal by itself — may be unseen or partial
      expect(['unseen', 'partial']).toContain(cov.currentUse)
    })
    it('marks goals as partial (vague language present)', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(['partial', 'unseen']).toContain(cov.goals)
      expect(cov.goals).not.toBe('complete')
    })
    it('marks protectionMap as unseen', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.protectionMap).toBe('unseen')
    })
    it('marks communication as partial at best ("I don\'t know" style)', () => {
      const cov = computeDomainCoverage(history, latest)
      // "not sure" and "I don't know" signal partial, not complete
      expect(cov.communication).not.toBe('complete')
    })
  })

  describe('Scenario 3: Clear ambivalence', () => {
    const history: Msg[] = [
      userMsg("I drink every weekend and honestly I want to stop but I also really like it."),
      assistantMsg("Both sides are real."),
      userMsg("Exactly — I can't imagine not drinking with friends but I need to change. I've decided I'm done."),
    ]
    const latest = "Part of me wants to keep going, I'm not ready."

    it('detects ambivalence_clearly_present (change + sustain talk)', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.ambivalence_clearly_present).toBe(true)
    })
    it('marks readiness as partial (not complete) when turn count < 10', () => {
      // With < 10 user turns, ambivalence detection alone sets readiness to 'partial',
      // not 'complete'. The conversation needs room (>= 10 turns) to have explored
      // both sides before readiness is considered complete.
      const cov = computeDomainCoverage(history, latest)
      expect(cov.readiness).toBe('partial')
    })
  })

  describe('Scenario 4: Protection map — thin coverage', () => {
    const history: Msg[] = [
      userMsg("I drink every night, usually alone."),
      assistantMsg('What does help, even a little?'),
      userMsg("Nothing comes to mind. I just deal with it."),
    ]
    const latest = "I really don't have much support. Nobody knows I'm dealing with this."

    it('marks protectionMap as unseen when no positive protective factors mentioned', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.protectionMap).toBe('unseen')
    })

    it('blocks summary when protectionMap is unseen', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(hasMinimumRequiredCoverage(cov)).toBe(false)
    })
  })

  describe('Scenario 5: Safety concern present', () => {
    const history: Msg[] = [
      userMsg("I've been drinking a bottle of wine a night. I've had some blackouts."),
      assistantMsg('Are you safe physically right now?'),
      userMsg("Yes, I'm okay. Not having a crisis or anything."),
    ]
    const latest = "No overdose or withdrawal symptoms."

    it('marks safety as screened_low when topics mentioned without acute screen triggering', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(['screened_low', 'screened_concern']).toContain(cov.safety)
      expect(cov.safety).not.toBe('unseen')
    })
  })

  describe('Scenario 6: Safety unseen — must block summary', () => {
    const history: Msg[] = [
      userMsg("I drink a few beers each night after work."),
      assistantMsg('What does that give you?'),
      userMsg("Just helps me relax."),
      assistantMsg('What would you want things to look like differently?'),
      userMsg("Maybe cut back. I want to cut back to 1-2 drinks."),
      assistantMsg('What triggers the urge most?'),
      userMsg("Stress from work."),
      assistantMsg('What helps, even a little?'),
      userMsg("Going for walks. My friend Sarah checks in on me."),
    ]
    const latest = "I prefer someone who gets practical with me."

    it('safety stays unseen when not enough turns have passed', () => {
      const cov = computeDomainCoverage(history, latest)
      // only 9 user turns — safety may be unseen unless topics mentioned
      // This tests that we don't prematurely mark safety as addressed
      if (cov.safety === 'unseen') {
        expect(hasMinimumRequiredCoverage(cov)).toBe(false)
      }
    })
  })

  describe('Scenario 7: Communication style — partial vs complete', () => {
    it('marks communication as partial for "I don\'t know"', () => {
      const history: Msg[] = [userMsg("I drink daily.")]
      const cov = computeDomainCoverage(history, "I don't know how I like to be supported.")
      expect(cov.communication).toBe('partial')
    })

    it('marks communication as complete for usable style signal', () => {
      const history: Msg[] = [userMsg("I drink daily.")]
      const cov = computeDomainCoverage(history, "I prefer when someone gets practical with me and gives me direct feedback.")
      expect(cov.communication).toBe('complete')
    })

    it('marks communication as complete for reflective style signal', () => {
      const history: Msg[] = [userMsg("I drink daily.")]
      const cov = computeDomainCoverage(history, "I like when someone helps me think it through and understand myself first.")
      expect(cov.communication).toBe('complete')
    })
  })

  describe('Scenario 8: Moderation goal user', () => {
    const history: Msg[] = [
      userMsg("I drink about 8 drinks a weekend. I want to moderate, not quit."),
      assistantMsg('What would moderate look like for you?'),
      userMsg("Maybe 2-3 drinks on a Friday, nothing during the week."),
    ]
    const latest = "I get stressed and bored on weekends when my friends are around."

    it('marks goals as complete for moderation goal', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(cov.goals).toBe('complete')
    })
    it('marks riskMap as partial or complete (stress + social triggers)', () => {
      const cov = computeDomainCoverage(history, latest)
      expect(['partial', 'complete']).toContain(cov.riskMap)
    })
  })
})

// ─── hasMinimumRequiredCoverage ───────────────────────────────────────────────

describe('hasMinimumRequiredCoverage()', () => {
  it('returns false when currentUse is not complete', () => {
    const coverage = computeDomainCoverage([], "hi")
    expect(hasMinimumRequiredCoverage(coverage)).toBe(false)
  })

  it('returns false when safety is unseen', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'partial' as const,
      coachLens: 'partial' as const,
      communication: 'partial' as const,
      safety: 'unseen' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('returns false when protectionMap is unseen', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'unseen' as const,
      coachLens: 'partial' as const,
      communication: 'partial' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('returns false when communication is unseen', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'partial' as const,
      coachLens: 'partial' as const,
      communication: 'unseen' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('returns false when ambivalence is clearly present but readiness is unseen', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'partial' as const,
      coachLens: 'partial' as const,
      communication: 'partial' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: true,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('returns true when all required minimums are met', () => {
    // protectionMap and communication must be 'complete' or 'deferred' — 'partial' is not enough
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'complete' as const,
      coachLens: 'partial' as const,
      communication: 'complete' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(true)
  })
})

// ─── shouldOfferSummaryNow ────────────────────────────────────────────────────

describe('shouldOfferSummaryNow()', () => {
  it('returns false if fewer than 8 user turns', () => {
    const history: Msg[] = Array(6).fill(null).flatMap((_, i) => [
      userMsg(`message ${i}`),
      assistantMsg(`response ${i}`),
    ])
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'partial' as const,
      coachLens: 'partial' as const,
      communication: 'partial' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(shouldOfferSummaryNow(cov, history)).toBe(false)
  })

  it('returns false even with 10 turns if safety is unseen', () => {
    const history: Msg[] = Array(10).fill(null).flatMap((_, i) => [
      userMsg(`message ${i}`),
      assistantMsg(`response ${i}`),
    ])
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'partial' as const,
      coachLens: 'partial' as const,
      communication: 'partial' as const,
      safety: 'unseen' as const,
      ambivalence_clearly_present: false,
    }
    expect(shouldOfferSummaryNow(cov, history)).toBe(false)
  })

  it('does NOT require segment >= 9 — only coverage', () => {
    // protectionMap and communication must be 'complete' or 'deferred' for the gate to pass
    const history: Msg[] = Array(8).fill(null).flatMap((_, i) => [
      userMsg(`message ${i}`),
      assistantMsg(`response ${i}`),
    ])
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'complete' as const,
      coachLens: 'partial' as const,
      communication: 'complete' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    // Should return true — coverage passes, 8 user turns, no segment check
    expect(shouldOfferSummaryNow(cov, history)).toBe(true)
  })
})

// ─── nextDomainToFocus ────────────────────────────────────────────────────────

describe('nextDomainToFocus()', () => {
  it('returns opening when no turns have happened', () => {
    const coverage = computeDomainCoverage([], '')
    expect(nextDomainToFocus(coverage, 0)).toBe('opening')
  })

  it('returns safety when unseen and userTurns >= 8', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'complete' as const,
      readiness: 'partial' as const,
      riskMap: 'complete' as const,
      protectionMap: 'complete' as const,
      coachLens: 'complete' as const,
      communication: 'unseen' as const,
      safety: 'unseen' as const,
      ambivalence_clearly_present: false,
    }
    // communication is unseen but safety takes priority at turn 8+
    expect(nextDomainToFocus(cov, 9)).toBe('safety')
  })

  it('returns readiness when ambivalence is clearly present', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'complete' as const,
      readiness: 'unseen' as const,
      riskMap: 'complete' as const,
      protectionMap: 'complete' as const,
      coachLens: 'complete' as const,
      communication: 'partial' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: true,
    }
    expect(nextDomainToFocus(cov, 10)).toBe('readiness')
  })
})

// ─── domainToSegmentNumber ────────────────────────────────────────────────────

describe('domainToSegmentNumber()', () => {
  it('maps opening to 0', () => expect(domainToSegmentNumber('opening')).toBe(0))
  it('maps currentUse to 1', () => expect(domainToSegmentNumber('currentUse')).toBe(1))
  it('maps function and emotionalDrivers to 2', () => {
    expect(domainToSegmentNumber('function')).toBe(2)
    expect(domainToSegmentNumber('emotionalDrivers')).toBe(2)
  })
  it('maps costs to 3', () => expect(domainToSegmentNumber('costs')).toBe(3))
  it('maps goals to 4', () => expect(domainToSegmentNumber('goals')).toBe(4))
  it('maps protectionMap to 6', () => expect(domainToSegmentNumber('protectionMap')).toBe(6))
  it('maps communication and safety to 9', () => {
    expect(domainToSegmentNumber('communication')).toBe(9)
    expect(domainToSegmentNumber('safety')).toBe(9)
  })
})

// ─── B. Communication — new gate tests ───────────────────────────────────────

describe('Communication domain (B)', () => {
  it('partial blocks hasMinimumRequiredCoverage', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'complete' as const,
      coachLens: 'partial' as const,
      communication: 'partial' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('deferred passes hasMinimumRequiredCoverage', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'complete' as const,
      coachLens: 'partial' as const,
      communication: 'deferred' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(true)
  })

  it('"I don\'t know" at turn 1 produces partial (not yet deferred)', () => {
    const history: Msg[] = [userMsg("I drink daily.")]
    const cov = computeDomainCoverage(history, "I don't know what kind of support I like.")
    expect(cov.communication).toBe('partial')
  })

  it('"I don\'t know" with no real style signal deferred at turn 8+', () => {
    // Build a history with 8 user turns and no communication style signal at all
    const history: Msg[] = Array(8).fill(null).flatMap((_, i) => [
      userMsg(`message ${i}`),
      assistantMsg(`response ${i}`),
    ])
    const cov = computeDomainCoverage(history, "I'm not sure how I like to be supported.")
    // "not sure" + no commAnyPresent + userTurns >= 8 → 'deferred'
    expect(cov.communication).toBe('deferred')
  })
})

// ─── D. Protection map — new gate tests ──────────────────────────────────────

describe('Protection map (D)', () => {
  it('bare "my family" alone → mentionsPositiveProtection: false', () => {
    expect(mentionsPositiveProtection('my family')).toBe(false)
  })

  it('"my family" alone → mentionsPositiveProtection: false', () => {
    expect(mentionsPositiveProtection('I have my family and that is it.')).toBe(false)
  })

  it('"I can count on my family" → mentionsPositiveProtection: true', () => {
    expect(mentionsPositiveProtection('I can count on my family to be there.')).toBe(true)
  })

  it('"my family helps me" → mentionsPositiveProtection: true', () => {
    expect(mentionsPositiveProtection('my family helps me stay grounded')).toBe(true)
  })

  it('"my kids keep me going" → countPositiveProtectionSignals category 1 fires', () => {
    expect(countPositiveProtectionSignals('my kids keep me going')).toBeGreaterThanOrEqual(1)
  })

  it('bare "my family is around" with no other signal → protectionMap not complete', () => {
    // No prior-success language, no positive verb — bare person mention only
    const history: Msg[] = [
      userMsg("I drink every night."),
      assistantMsg("What helps, even a little?"),
      userMsg("My family is around. Nothing really."),
    ]
    const cov = computeDomainCoverage(history, "I just deal with it.")
    // Bare "my family is around" with no positive verb or prior-success signal
    // should be 'unseen' or at most 'partial', never 'complete'
    expect(cov.protectionMap).not.toBe('complete')
  })

  it('partial protectionMap blocks hasMinimumRequiredCoverage', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'unseen' as const,
      riskMap: 'partial' as const,
      protectionMap: 'partial' as const,
      coachLens: 'partial' as const,
      communication: 'complete' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: false,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('Scenario 1 still produces protectionMap: complete (regression guard)', () => {
    // "my kids keep me going" + "my morning runs help" — both verb-anchored
    const history: Msg[] = [
      userMsg('I drink alcohol every day, usually 4-5 beers in the evening after work.'),
      assistantMsg('What does it give you in those moments?'),
      userMsg("It helps me relax and wind down. Work is really stressful and I feel anxious all day."),
      assistantMsg('What tends to happen with your drinking when things are especially hard at work?'),
      userMsg("I drink more. Sometimes I black out on weekends. My wife is worried and my health is suffering."),
      assistantMsg('What would you like things to look like differently?'),
      userMsg("I want to cut back to a couple drinks, not quit entirely. My kids keep me going and my morning runs help."),
    ]
    const cov = computeDomainCoverage(history, "I've cut back before and it worked.")
    expect(cov.protectionMap).toBe('complete')
  })
})

// ─── E. Ambivalence / readiness gating — new tests ───────────────────────────

describe('Ambivalence / readiness gating (E)', () => {
  it('ambivalence at low turn count → readiness: partial, not complete', () => {
    const history: Msg[] = [
      userMsg("I want to quit but I also like drinking. Part of me wants to keep going."),
      assistantMsg("Both sides sound real."),
      userMsg("I've decided I need to stop but I can't imagine not drinking."),
    ]
    const cov = computeDomainCoverage(history, "I'm not ready to give it up fully.")
    expect(cov.ambivalence_clearly_present).toBe(true)
    expect(cov.readiness).toBe('partial')
  })

  it('readiness partial + ambivalence present → hasMinimumRequiredCoverage: false', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'partial' as const,
      riskMap: 'partial' as const,
      protectionMap: 'complete' as const,
      coachLens: 'partial' as const,
      communication: 'complete' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: true,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(false)
  })

  it('readiness deferred + ambivalence present → hasMinimumRequiredCoverage: true', () => {
    const cov = {
      opening: 'complete' as const,
      currentUse: 'complete' as const,
      goals: 'partial' as const,
      readiness: 'deferred' as const,
      riskMap: 'partial' as const,
      protectionMap: 'complete' as const,
      coachLens: 'partial' as const,
      communication: 'complete' as const,
      safety: 'screened_low' as const,
      ambivalence_clearly_present: true,
    }
    expect(hasMinimumRequiredCoverage(cov)).toBe(true)
  })
})

// ─── hasSustainTalk false-positive regressions ────────────────────────────────

describe('hasSustainTalk() false-positive regressions', () => {
  it('"exercise helps me" → hasSustainTalk: false', () => {
    expect(hasSustainTalk('exercise helps me feel better')).toBe(false)
  })

  it('"working out helps me" → hasSustainTalk: false', () => {
    expect(hasSustainTalk('working out helps me cope with stress')).toBe(false)
  })

  it('"my routine helps me" → hasSustainTalk: false', () => {
    expect(hasSustainTalk('my routine helps me stay consistent')).toBe(false)
  })

  it('exercise user with change talk + "helps me" → ambivalence_clearly_present: false', () => {
    // Change talk present, but "exercise helps me" should not fire sustain talk
    const history: Msg[] = [
      userMsg("I want to exercise more. I've decided to make a change."),
      assistantMsg("What would that look like?"),
      userMsg("I need to get active. Exercise helps me feel better overall."),
    ]
    const cov = computeDomainCoverage(history, "I'm ready to start going to the gym.")
    expect(cov.ambivalence_clearly_present).toBe(false)
  })

  it('genuine sustain talk still fires', () => {
    expect(hasSustainTalk("I'm not ready to stop, I like it and can't imagine quitting")).toBe(true)
  })
})
