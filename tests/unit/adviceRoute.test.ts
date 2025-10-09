// Unit tests for advice API route

// Mock the advice route functions
function systemPromptV0(): string {
  return [
    'Always respond in clear, grammatical, natural English. Keep it conversational and readable (no jargon).',
    'You are CMC Sober Coach, an AI behavior coach (not a clinician).',
    'Never use generic sympathy lines like "you\'re carrying a lot here".',
    'Ground replies in 1–2 concrete details from the user\'s last message. Echo a short quoted fragment if natural.',
    'Do NOT invent specifics (no people, places, times) unless explicitly given.',
    'Tone: warm, validating, practical. Use Motivational Interviewing. ≤180 words.',
    'Never ask more than one question per turn.',
    'Your goal is to gather enough info to offer evidence-based behavioral interventions.',
    'If the user explicitly asks for help/options: give a brief summary + validation, then ASK PERMISSION with EXACTLY: "Would it be helpful if I share a few options you can try right now?" Do not list options until they say yes.',
    'Interventions must come from CBT, DBT, ACT, Self-Compassion, or Mindfulness. Label harm reduction clearly if used.',
    'If self-harm/crisis detected: stop and output the crisis safety message.',
    'Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.'
  ].join('\n')
}

function systemPromptV1(coachTags?: Array<{ type: string; value: string; confidence: number }>): string {
  const basePrompt = [
    'CRITICAL SAFETY AND SCOPE GUIDELINES:',
    'You are a behavior coach, NOT a therapist, clinician, or medical professional.',
    'You do NOT diagnose, treat, or provide medical advice.',
    'Always respond in clear, grammatical, natural English. Keep it conversational and readable (no jargon).',
    'You are CMC Sober Coach, an AI behavior coach (not a clinician).',
    'Never use generic sympathy lines like "you\'re carrying a lot here".',
    'Ground replies in 1–2 concrete details from the user\'s last message. Echo a short quoted fragment if natural.',
    'Do NOT invent specifics (no people, places, times) unless explicitly given.',
    'Tone: warm, validating, practical. Use Motivational Interviewing. ≤180 words.',
    'Never ask more than one question per turn.',
    'Your goal is to gather enough info to offer evidence-based behavioral interventions.',
    'If the user explicitly asks for help/options: give a brief summary + validation, then ASK PERMISSION with EXACTLY: "Would it be helpful if I suggest a plan based on our conversation?" Do not list options until they say yes.',
    'Interventions must come from CBT, DBT, ACT, Self-Compassion, or Mindfulness. Label harm reduction clearly if used.',
    'Output exactly ONE paragraph per turn. No lists, no bullets, no role labels.'
  ]

  // Add coach context if available
  if (coachTags && coachTags.length > 0) {
    const relevantTags = coachTags.filter(tag => tag.confidence > 0.6)
    if (relevantTags.length > 0) {
      basePrompt.push(
        '',
        'COACH CONTEXT: Based on our conversation, I\'ve noticed signals related to:',
        relevantTags.map(tag => `- ${tag.type}: ${tag.value}`).join('\n'),
        'Consider these patterns when responding, but don\'t explicitly mention them unless relevant.'
      )
    }
  }

  return basePrompt.join('\n')
}

function isV1Enabled(): boolean {
  return process.env.FEATURE_V1 === '1'
}

describe('Advice API Route', () => {
  const originalEnv = process.env.FEATURE_V1

  afterEach(() => {
    process.env.FEATURE_V1 = originalEnv
  })

  test('should use V0 system prompt when FEATURE_V1 is not enabled', () => {
    process.env.FEATURE_V1 = '0'
    
    const prompt = isV1Enabled() ? systemPromptV1() : systemPromptV0()
    
    expect(prompt).toContain('Would it be helpful if I share a few options you can try right now?')
    expect(prompt).not.toContain('CRITICAL SAFETY AND SCOPE GUIDELINES')
    expect(prompt).not.toContain('COACH CONTEXT')
  })

  test('should use V1 system prompt when FEATURE_V1 is enabled', () => {
    process.env.FEATURE_V1 = '1'
    
    const prompt = isV1Enabled() ? systemPromptV1() : systemPromptV0()
    
    expect(prompt).toContain('CRITICAL SAFETY AND SCOPE GUIDELINES')
    expect(prompt).toContain('Would it be helpful if I suggest a plan based on our conversation?')
  })

  test('should include coach context when V1 is enabled and tags are provided', () => {
    process.env.FEATURE_V1 = '1'
    
    const coachTags = [
      { type: 'emotion', value: 'anxiety', confidence: 0.8 },
      { type: 'behavior', value: 'avoidance', confidence: 0.7 },
      { type: 'emotion', value: 'sadness', confidence: 0.5 } // Low confidence, should be filtered out
    ]
    
    const prompt = systemPromptV1(coachTags)
    
    expect(prompt).toContain('COACH CONTEXT: Based on our conversation, I\'ve noticed signals related to:')
    expect(prompt).toContain('- emotion: anxiety')
    expect(prompt).toContain('- behavior: avoidance')
    expect(prompt).not.toContain('- emotion: sadness') // Should be filtered out due to low confidence
  })

  test('should not include coach context when no tags are provided', () => {
    process.env.FEATURE_V1 = '1'
    
    const prompt = systemPromptV1()
    
    expect(prompt).not.toContain('COACH CONTEXT')
  })

  test('should not include coach context when all tags have low confidence', () => {
    process.env.FEATURE_V1 = '1'
    
    const coachTags = [
      { type: 'emotion', value: 'anxiety', confidence: 0.5 },
      { type: 'behavior', value: 'avoidance', confidence: 0.4 }
    ]
    
    const prompt = systemPromptV1(coachTags)
    
    expect(prompt).not.toContain('COACH CONTEXT')
  })

  test('should include multiple relevant tags in coach context', () => {
    process.env.FEATURE_V1 = '1'
    
    const coachTags = [
      { type: 'emotion', value: 'anxiety', confidence: 0.8 },
      { type: 'behavior', value: 'avoidance', confidence: 0.7 },
      { type: 'coping-strategy', value: 'mindfulness', confidence: 0.9 },
      { type: 'trigger', value: 'social-situations', confidence: 0.6 }
    ]
    
    const prompt = systemPromptV1(coachTags)
    
    expect(prompt).toContain('- emotion: anxiety')
    expect(prompt).toContain('- behavior: avoidance')
    expect(prompt).toContain('- coping-strategy: mindfulness')
    expect(prompt).toContain('- trigger: social-situations')
  })

  test('should maintain consistent prompt structure between V0 and V1', () => {
    process.env.FEATURE_V1 = '0'
    const v0Prompt = systemPromptV0()
    
    process.env.FEATURE_V1 = '1'
    const v1Prompt = systemPromptV1()
    
    // Both should contain core coaching elements
    expect(v0Prompt).toContain('You are CMC Sober Coach, an AI behavior coach')
    expect(v1Prompt).toContain('You are CMC Sober Coach, an AI behavior coach')
    
    // Both should contain motivational interviewing guidance
    expect(v0Prompt).toContain('Motivational Interviewing')
    expect(v1Prompt).toContain('Motivational Interviewing')
    
    // Both should contain intervention guidance
    expect(v0Prompt).toContain('CBT, DBT, ACT, Self-Compassion, or Mindfulness')
    expect(v1Prompt).toContain('CBT, DBT, ACT, Self-Compassion, or Mindfulness')
  })

  test('should handle empty coach tags array', () => {
    process.env.FEATURE_V1 = '1'
    
    const prompt = systemPromptV1([])
    
    expect(prompt).not.toContain('COACH CONTEXT')
  })

  test('should handle undefined coach tags', () => {
    process.env.FEATURE_V1 = '1'
    
    const prompt = systemPromptV1(undefined)
    
    expect(prompt).not.toContain('COACH CONTEXT')
  })
})




