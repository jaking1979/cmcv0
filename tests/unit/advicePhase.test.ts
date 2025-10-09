// Unit tests for advice phase logic (from existing advice page)

// Mock the inferPhase function from advice page
function inferPhase(
  history: { role: 'user'|'assistant'; text: string; kind?: 'FOLLOWUP'|'ADVICE' }[],
  incoming: string
): 'NEED_CONTEXT' | 'CLARIFY_GOAL' | 'SUMMARY_PERMISSION' | 'AWAIT_PERMISSION' | 'SUGGEST_OPTIONS' {
  const last = history[history.length - 1]
  const msg = (incoming || '').trim()

  if (!history.length) return 'NEED_CONTEXT'

  if (last?.role === 'assistant' && /would it be ok|would it be okay|is it ok if i|share (a|some) options|offer options|share a few/i.test(last.text)) {
    return /\b(yes|yep|yeah|ok(ay)?|sure|please|sounds good|do it|go ahead)\b/i.test(msg) ? 'SUGGEST_OPTIONS' : 'AWAIT_PERMISSION'
  }

  if (last?.role === 'assistant' && (last.kind === 'FOLLOWUP' || /\?\s*$/.test(last.text))) {
    const goalMentioned = /(abstain|avoid(ing)?|quit|stop|not drink|cut\s*down|reduce|moderate|stay sober|skip(\s+it)?)/i
    if (msg.length < 120 || !goalMentioned.test(msg)) return 'CLARIFY_GOAL'
    return 'SUMMARY_PERMISSION'
  }

  if (last?.role === 'user') {
    const goalMentioned = /(abstain|avoid(ing)?|quit|stop|not drink|cut\s*down|reduce|moderate|stay sober|skip(\s+it)?)/i
    if (msg.length < 120 || !goalMentioned.test(msg)) return 'NEED_CONTEXT'
    return 'SUMMARY_PERMISSION'
  }

  return 'NEED_CONTEXT'
}

describe('Advice Phase Logic', () => {
  test('should return NEED_CONTEXT for empty history', () => {
    const phase = inferPhase([], "I need help")
    expect(phase).toBe('NEED_CONTEXT')
  })

  test('should detect permission request and user consent', () => {
    const history = [
      { role: 'assistant' as const, text: "Would it be okay if I share a few options you can try right now?" }
    ]
    const phase = inferPhase(history, "Yes, please share options")
    expect(phase).toBe('SUGGEST_OPTIONS')
  })

  test('should detect permission request and user decline', () => {
    const history = [
      { role: 'assistant' as const, text: "Would it be okay if I share a few options you can try right now?" }
    ]
    const phase = inferPhase(history, "Not right now")
    expect(phase).toBe('AWAIT_PERMISSION')
  })

  test('should detect follow-up question and short response', () => {
    const history = [
      { role: 'assistant' as const, text: "What's been going on lately?", kind: 'FOLLOWUP' as const }
    ]
    const phase = inferPhase(history, "Not much")
    expect(phase).toBe('CLARIFY_GOAL')
  })

  test('should detect follow-up question with goal mention', () => {
    const history = [
      { role: 'assistant' as const, text: "What's been going on lately?", kind: 'FOLLOWUP' as const }
    ]
    const phase = inferPhase(history, "I've been trying to cut down on drinking but it's been really hard and I keep relapsing")
    expect(phase).toBe('SUMMARY_PERMISSION')
  })

  test('should detect user message with goal mention', () => {
    const history = [
      { role: 'user' as const, text: "I want to stop drinking" }
    ]
    const phase = inferPhase(history, "I've been drinking every day for months and I really want to quit but I don't know how to start")
    expect(phase).toBe('SUMMARY_PERMISSION')
  })

  test('should detect user message without goal mention', () => {
    const history = [
      { role: 'user' as const, text: "I'm having a hard time" }
    ]
    const phase = inferPhase(history, "Things are just really stressful")
    expect(phase).toBe('NEED_CONTEXT')
  })

  test('should handle question mark detection', () => {
    const history = [
      { role: 'assistant' as const, text: "How are you feeling about that?" }
    ]
    const phase = inferPhase(history, "I'm not sure")
    expect(phase).toBe('CLARIFY_GOAL')
  })

  test('should handle various goal-related terms', () => {
    const goalTerms = [
      "I want to abstain from alcohol",
      "I'm trying to avoid drinking",
      "I need to quit smoking",
      "I want to stop using drugs",
      "I'm cutting down on my drinking",
      "I want to reduce my alcohol use",
      "I'm trying to moderate my drinking",
      "I want to stay sober",
      "I'm trying to be sober",
      "I want to skip the party"
    ]

    goalTerms.forEach(goalText => {
      const history = [
        { role: 'assistant' as const, text: "What's been going on?", kind: 'FOLLOWUP' as const }
      ]
      const phase = inferPhase(history, goalText)
      expect(phase).toBe('SUMMARY_PERMISSION')
    })
  })

  test('should handle various consent responses', () => {
    const consentResponses = [
      "yes",
      "yep", 
      "yeah",
      "ok",
      "okay",
      "sure",
      "please",
      "sounds good",
      "do it",
      "go ahead"
    ]

    consentResponses.forEach(response => {
      const history = [
        { role: 'assistant' as const, text: "Would it be okay if I share some options?" }
      ]
      const phase = inferPhase(history, response)
      expect(phase).toBe('SUGGEST_OPTIONS')
    })
  })
})




