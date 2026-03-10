/**
 * Route-level behavioral tests for the onboarding POST handler.
 *
 * Tests the decision tree directly:
 * - closePhase.writtenDone hard gate → coaching bridge, not summary
 * - Thin coverage → regular turn (no premature summary)
 * - Full coverage → spoken summary offered (X-Spoken-Summary: 1)
 * - No double-summary: hasOfferedSummaryRecently blocks a repeated offer
 * - User says yes after spoken summary → written summary (X-Summary-Complete: 1)
 * - finalize: true → calls mapTranscriptToFormulation, returns X-Summary-Complete: 1
 * - protectionMap unseen → spoken summary blocked; protection hint injected
 * - Safety unseen at turn threshold → safety hint injected, no spoken summary
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

// ── Mock prompt fragments — content is verified in onboardingPrompt.test.ts ──
jest.mock('@/server/ai/promptFragments', () => ({
  ITC_MASTER_PROMPT: 'ITC_MASTER_PROMPT',
  CRISIS_AND_SCOPE_GUARDRAILS: 'CRISIS_AND_SCOPE_GUARDRAILS',
  ONBOARDING_V1_PROMPT: 'ONBOARDING_V1_PROMPT',
}))

// ── Mock onboarding mapping — avoid real OpenAI calls for formulation ─────────
jest.mock('@/server/ai/mapping/onboardingMapping', () => ({
  mapTranscriptToFormulation: jest.fn(),
  buildMappingPrompt: jest.fn().mockReturnValue('mock mapping prompt'),
}))

// Route import must come AFTER jest.mock declarations (jest.mock is hoisted)
import { POST } from '../../src/app/api/onboarding/route'
import { mapTranscriptToFormulation } from '@/server/ai/mapping/onboardingMapping'

// ─── Types ────────────────────────────────────────────────────────────────────

type Msg = { role: 'user' | 'assistant'; content: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Minimal mock of an OpenAI chat completions response. */
function mockOpenAISuccess(content: string): Response {
  return {
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content } }] }),
    text: () => Promise.resolve(''),
  } as unknown as Response
}

/** Extract all messages arrays that callOpenAI sent to fetch, for inspection. */
function capturedMessages(): Array<Array<{ role: string; content: string }>> {
  const mockFetch = global.fetch as ReturnType<typeof jest.fn>
  return mockFetch.mock.calls.map(call => {
    const opts = call[1] as { body: string }
    return JSON.parse(opts.body).messages as Array<{ role: string; content: string }>
  })
}

// ─── Test data ────────────────────────────────────────────────────────────────

// Thin: only 2 user turns, effectively no coverage signal
const THIN_HISTORY: Msg[] = [
  { role: 'user', content: 'I want some help.' },
  { role: 'assistant', content: 'What brought you here today?' },
]

// Full-coverage: 8 user turns, all required domains covered
// currentUse: complete  (alcohol + daily + anxious/relax)
// goals:       complete  (cut back)
// riskMap:     complete  (stress + anxiety = trigger + emotional)
// protectionMap: complete (morning runs help me + can count on Tim = 2 categories)
// safety:      screened_low ("unsafe" in user text → mentionsSafetyTopics)
// communication: complete (direct / give it to me straight)
const FULL_COVERAGE_HISTORY: Msg[] = [
  { role: 'user',      content: 'I drink alcohol every day, usually 4-5 beers in the evening.' },
  { role: 'assistant', content: 'What does it do for you?' },
  { role: 'user',      content: 'It helps me relax. Work is really stressful and I feel anxious all day.' },
  { role: 'assistant', content: 'What tends to trigger it?' },
  { role: 'user',      content: 'Stress at work and fights with my partner. I want to cut back to weekends.' },
  { role: 'assistant', content: 'Who or what helps, even a little?' },
  { role: 'user',      content: 'My morning runs help me stay grounded. Tim is someone I can count on.' },
  { role: 'assistant', content: 'How are things on the safety side?' },
  { role: 'user',      content: "I'm not physically unsafe. No major safety concerns." },
  { role: 'assistant', content: 'How do you prefer I support you?' },
  { role: 'user',      content: 'Just be direct with me, give it to me straight.' },
  { role: 'assistant', content: 'Got it.' },
  { role: 'user',      content: 'I tried cutting back before and it worked for a while.' },
  { role: 'assistant', content: 'That was real effort.' },
  { role: 'user',      content: "I'm ready to try something different." },
  { role: 'assistant', content: 'Starting to get a real picture of where you are.' },
]
// ↑ 8 user turns in history → userTurns = 8 in shouldOfferSummaryNow ✓

// No protection: 8 user turns, no positive protective factors — only isolation language.
// Deliberately avoids "helps me" phrasing in substance context (which would falsely
// trigger mentionsPositiveProtection). protectionMap stays 'unseen'.
// → hasMinimumRequiredCoverage returns false
const NO_PROTECTION_HISTORY: Msg[] = [
  { role: 'user',      content: 'I drink alcohol every day, usually 4-5 beers.' },
  { role: 'assistant', content: 'What does it give you?' },
  { role: 'user',      content: 'Drinking lets me stop thinking for a while. Work stress and anxiety are constant.' },
  { role: 'assistant', content: 'What triggers it?' },
  { role: 'user',      content: 'Work pressure mostly. I want to quit entirely.' },
  { role: 'assistant', content: 'Any safety concerns?' },
  { role: 'user',      content: "I'm not unsafe. No safety issues." },
  { role: 'assistant', content: 'How do you prefer support?' },
  { role: 'user',      content: 'Be direct with me, give it to me straight.' },
  { role: 'assistant', content: '...' },
  { role: 'user',      content: "Nobody in my life really understands what I'm going through." },
  { role: 'assistant', content: '...' },
  { role: 'user',      content: "I'm quite isolated to be honest." },
  { role: 'assistant', content: '...' },
  { role: 'user',      content: "I've been navigating this completely alone." },
  { role: 'assistant', content: '...' },
]
// ↑ 8 user turns, isolation language only — mentionsPositiveProtection = false

// No safety: 8 user turns, all other domains covered, safety = 'unseen'
// (no safety topics mentioned, userTurns < 10 so deferred_low_signal doesn't apply)
const NO_SAFETY_HISTORY: Msg[] = [
  { role: 'user',      content: 'I drink alcohol every day, usually 4-5 beers.' },
  { role: 'assistant', content: 'What does it give you?' },
  { role: 'user',      content: 'It helps me relax. Work stress and constant anxiety wear me down.' },
  { role: 'assistant', content: 'What triggers it?' },
  { role: 'user',      content: 'Work pressure. I want to cut back.' },
  { role: 'assistant', content: 'Who or what helps?' },
  { role: 'user',      content: 'My morning runs help me. My partner is someone I can count on.' },
  { role: 'assistant', content: 'How do you prefer support?' },
  { role: 'user',      content: 'Be direct with me, give it to me straight.' },
  { role: 'assistant', content: '...' },
  { role: 'user',      content: 'I tried cutting back for a month last year and it worked.' },
  { role: 'assistant', content: '...' },
  { role: 'user',      content: "I'm ready to put in the work." },
  { role: 'assistant', content: '...' },
  { role: 'user',      content: "I feel more motivated than I have in years." },
  { role: 'assistant', content: '...' },
]
// ↑ 8 user turns, no safety topics → safety = 'unseen' → hasMinimumRequiredCoverage false
// nextDomainToFocus(coverage, 8) → 'safety' (unseen && userTurns >= 8)

// ─── Exercise onboarding scenario (non-substance) ─────────────────────────────
// This history simulates a user who wants to exercise more — no substance content.
// Used to detect H-A (hasGoal false), H-B (currentUse stuck 'unseen'), H-C (drink hints).
const EXERCISE_HISTORY: Msg[] = [
  { role: 'user',      content: 'I want to exercise more. I have a desk job and I feel tired all the time.' },
  { role: 'assistant', content: 'What feels like the hardest part about getting started?' },
  { role: 'user',      content: 'I dread it. I feel like a failure when I try and quit. I get about 6000 steps a day now.' },
  { role: 'assistant', content: 'What would be different if things went better?' },
  { role: 'user',      content: 'Even doing it once would be better than now. I want to feel stronger and look better.' },
  { role: 'assistant', content: 'Have you tried anything before?' },
  { role: 'user',      content: "I've tried gyms, trainers, classes. None of them stuck. My friends go to the gym but it's intimidating." },
  { role: 'assistant', content: 'What gets in the way — is it the schedule, tiredness, or something else?' },
  { role: 'user',      content: "I'm already tired after work. I don't know what to do. I'm worried I might get depressed this summer." },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/onboarding — route decision tree', () => {
  const mapMock = jest.mocked(mapTranscriptToFormulation)

  beforeEach(() => {
    // Reset all mocks and re-install the fetch mock before every test
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue(mockOpenAISuccess('A helpful coaching response.'))
    mapMock.mockResolvedValue({ mock: 'formulation' } as ReturnType<typeof mapTranscriptToFormulation> extends Promise<infer T> ? T : never)
    process.env.OPENAI_API_KEY = 'test-key'
  })

  // ── 1. closePhase.writtenDone: true → coaching bridge ─────────────────────
  describe('closePhase.writtenDone hard gate', () => {
    it('returns a regular response, not a summary, when writtenDone is true', async () => {
      const req = makeRequest({
        input: 'What should we work on?',
        history: FULL_COVERAGE_HISTORY,
        closePhase: { spokenDone: true, writtenDone: true },
      })
      const res = await POST(req)
      expect(res.headers.get('X-Summary-Complete')).toBeNull()
      expect(res.headers.get('X-Spoken-Summary')).toBeNull()
    })

    it('returns X-Onboarding-Segment: 9 when writtenDone is true', async () => {
      const req = makeRequest({
        input: 'What should we work on?',
        history: FULL_COVERAGE_HISTORY,
        closePhase: { spokenDone: true, writtenDone: true },
      })
      const res = await POST(req)
      expect(res.headers.get('X-Onboarding-Segment')).toBe('9')
    })

    it('injects the CLOSE PHASE COMPLETE instruction into the messages', async () => {
      const req = makeRequest({
        input: 'What now?',
        history: THIN_HISTORY,
        closePhase: { spokenDone: true, writtenDone: true },
      })
      await POST(req)
      const calls = capturedMessages()
      expect(calls.length).toBeGreaterThan(0)
      const systemContents = calls[0]
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join(' ')
      expect(systemContents).toMatch(/CLOSE PHASE COMPLETE/i)
    })
  })

  // ── 2. Thin coverage → no premature summary ────────────────────────────────
  describe('no premature summary', () => {
    it('does not return X-Spoken-Summary when coverage is thin', async () => {
      const req = makeRequest({ input: 'I just want some general help.', history: THIN_HISTORY })
      const res = await POST(req)
      expect(res.headers.get('X-Spoken-Summary')).toBeNull()
    })

    it('does not return X-Summary-Complete when coverage is thin', async () => {
      const req = makeRequest({ input: 'I just want some general help.', history: THIN_HISTORY })
      const res = await POST(req)
      expect(res.headers.get('X-Summary-Complete')).toBeNull()
    })

    it('returns a regular conversational response on a thin turn', async () => {
      const req = makeRequest({ input: 'I just want some general help.', history: THIN_HISTORY })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.text()
      expect(body).toContain('A helpful coaching response.')
    })
  })

  // ── 3. Full coverage → spoken summary offered ──────────────────────────────
  describe('spoken summary gate (full coverage)', () => {
    it('returns X-Spoken-Summary: 1 when all required domains are covered', async () => {
      const req = makeRequest({ input: 'I think that covers it.', history: FULL_COVERAGE_HISTORY })
      const res = await POST(req)
      expect(res.headers.get('X-Spoken-Summary')).toBe('1')
    })

    it('does not return X-Summary-Complete when offering the spoken summary', async () => {
      const req = makeRequest({ input: 'I think that covers it.', history: FULL_COVERAGE_HISTORY })
      const res = await POST(req)
      expect(res.headers.get('X-Summary-Complete')).toBeNull()
    })
  })

  // ── 4. No double-summary: hasOfferedSummaryRecently blocks a second offer ──
  describe('no repeated spoken summary', () => {
    it('does not re-offer the spoken summary when one was recently offered', async () => {
      const historyWithRecentOffer: Msg[] = [
        ...FULL_COVERAGE_HISTORY,
        {
          role: 'assistant',
          content: "Here's what I'm hearing from you. Would you like me to write up a fuller version?",
        },
      ]
      const req = makeRequest({
        input: 'Hmm, let me think about that.',
        history: historyWithRecentOffer,
      })
      const res = await POST(req)
      // hasOfferedSummaryRecently() should block another spoken summary offer
      expect(res.headers.get('X-Spoken-Summary')).toBeNull()
    })
  })

  // ── 5. User says yes after offer → written summary ─────────────────────────
  describe('written summary from spoken summary acceptance', () => {
    it('returns X-Summary-Complete: 1 when user consents after the summary offer', async () => {
      const historyWithOffer: Msg[] = [
        ...FULL_COVERAGE_HISTORY.slice(0, -1), // trim last assistant turn
        {
          role: 'assistant',
          content:
            "Here's what I'm hearing from you. Would you like me to write up a fuller version of this?",
        },
      ]
      const req = makeRequest({ input: 'Yes please.', history: historyWithOffer })
      const res = await POST(req)
      expect(res.headers.get('X-Summary-Complete')).toBe('1')
    })

    it('calls mapTranscriptToFormulation before generating the written summary', async () => {
      const historyWithOffer: Msg[] = [
        ...FULL_COVERAGE_HISTORY.slice(0, -1),
        {
          role: 'assistant',
          content: "Would you like me to write up a fuller version of what I'm hearing?",
        },
      ]
      const req = makeRequest({ input: 'Yes, please do.', history: historyWithOffer })
      await POST(req)
      expect(mapMock).toHaveBeenCalledTimes(1)
    })
  })

  // ── 6. finalize: true → mapTranscriptToFormulation called ─────────────────
  describe('finalize: true path', () => {
    it('returns X-Summary-Complete: 1 when finalize flag is set', async () => {
      const req = makeRequest({ input: '', history: THIN_HISTORY, finalize: true })
      const res = await POST(req)
      expect(res.headers.get('X-Summary-Complete')).toBe('1')
    })

    it('calls mapTranscriptToFormulation even when coverage is thin', async () => {
      const req = makeRequest({ input: '', history: THIN_HISTORY, finalize: true })
      await POST(req)
      expect(mapMock).toHaveBeenCalledTimes(1)
    })

    it('injects formulation context and a coverage warning when protectionMap is unseen', async () => {
      // Thin history has unseen protectionMap, safety, and communication — coverage warning should be injected
      const req = makeRequest({ input: '', history: THIN_HISTORY, finalize: true })
      await POST(req)
      const calls = capturedMessages()
      expect(calls.length).toBeGreaterThan(0)
      const systemContents = calls[0]
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n')
      expect(systemContents).toMatch(/COVERAGE NOTE/i)
    })
  })

  // ── 7. protectionMap unseen → spoken summary blocked ──────────────────────
  describe('protection map gate', () => {
    it('does not offer the spoken summary when protectionMap is unseen', async () => {
      const req = makeRequest({
        input: 'I think I told you everything.',
        history: NO_PROTECTION_HISTORY,
      })
      const res = await POST(req)
      expect(res.headers.get('X-Spoken-Summary')).toBeNull()
    })

    it('injects the protectionMap domain hint when protectionMap is unseen', async () => {
      const req = makeRequest({
        input: 'I think I told you everything.',
        history: NO_PROTECTION_HISTORY,
      })
      await POST(req)
      const calls = capturedMessages()
      expect(calls.length).toBeGreaterThan(0)
      const systemContents = calls[0]
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n')
      expect(systemContents).toMatch(/Supports and Resources/i)
    })
  })

  // ── 8. Safety unseen at turn threshold → safety hint injected ─────────────
  describe('safety hint injection', () => {
    it('does not offer the spoken summary when safety is unseen', async () => {
      const req = makeRequest({
        input: 'I feel ready to move forward.',
        history: NO_SAFETY_HISTORY,
      })
      const res = await POST(req)
      expect(res.headers.get('X-Spoken-Summary')).toBeNull()
    })

    it('injects the safety domain hint when safety is unseen and enough turns have passed', async () => {
      const req = makeRequest({
        input: 'I feel ready to move forward.',
        history: NO_SAFETY_HISTORY,
      })
      await POST(req)
      const calls = capturedMessages()
      expect(calls.length).toBeGreaterThan(0)
      const systemContents = calls[0]
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n')
      // nextDomainToFocus returns 'safety' → DOMAIN_HINTS['safety'] injected
      expect(systemContents).toMatch(/Safety Screen/i)
    })
  })

  // ── 9. Exercise onboarding — QA failure case regression ───────────────────
  // These tests ASSERT the failure conditions from the QA failure case.
  // They are EXPECTED TO FAIL until the fixes are implemented — that is the point.
  // Each test documents a confirmed bug and will pass once the fix is in place.
  describe('exercise onboarding — non-substance case (QA failure regression)', () => {
    it('[H-C] domain hint for exercise user must NOT contain substance-use wording like "drink"', async () => {
      const req = makeRequest({
        input: 'I already told you about my schedule.',
        history: EXERCISE_HISTORY,
      })
      await POST(req)
      const calls = capturedMessages()
      expect(calls.length).toBeGreaterThan(0)
      const allSystemContent = calls[0]
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n')
      // FAIL until H-C is fixed: domain hints contain "drink"/"drinking"
      expect(allSystemContent).not.toMatch(/\bdrink(ing)?\b/i)
    })

    it('[H-A] skillsIntercept must NOT return substance-specific goal question for exercise user', async () => {
      const req = makeRequest({
        input: 'Can you give me some strategies to help?',
        history: EXERCISE_HISTORY,
      })
      const res = await POST(req)
      const body = await res.text()
      // FAIL until H-A is fixed: intercept returns "cutting back, stopping, or deciding later"
      expect(body).not.toMatch(/cutting back|stopping|deciding later what change looks like/i)
    })
  })
})
