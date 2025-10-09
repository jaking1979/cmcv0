/**
 * Onboarding Assessment Mapping
 * Maps natural conversation to standardized assessment constructs
 */

import type { CoachMessage } from '../types'
import { CRISIS_AND_SCOPE_GUARDRAILS } from '../promptFragments'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export interface OnboardingProfile {
  sessionId: string
  timestamp: number
  constructs: {
    selfCompassion: {
      selfKindness?: number
      commonHumanity?: number
      mindfulness?: number
    }
    urica: {
      stage?: 'precontemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance'
      confidence?: number
    }
    kessler10: {
      score?: number
      distressLevel?: 'low' | 'moderate' | 'high' | 'very-high'
    }
    who5: {
      score?: number
      wellbeingLevel?: 'poor' | 'moderate' | 'good' | 'excellent'
    }
    dbtWccl: {
      problemSolving?: number
      socialSupport?: number
      avoidance?: number
    }
    copingSelfEfficacy: {
      problemFocused?: number
      emotionFocused?: number
      socialSupport?: number
    }
    assist: {
      substanceType?: string[]
      riskLevel?: 'low' | 'moderate' | 'high'
    }
    asi: {
      relationships?: string
      employment?: string
      family?: string
      legal?: string
      health?: string
    }
  }
  confidence: {
    selfCompassion: number
    urica: number
    kessler10: number
    who5: number
    dbtWccl: number
    copingSelfEfficacy: number
    assist: number
    asi: number
    overall: number
  }
  rawTranscript: string
  redactedTranscript: string
}

/**
 * Map conversation transcript to assessment constructs using AI
 */
export async function mapTranscriptToProfile(
  sessionId: string,
  transcript: string
): Promise<OnboardingProfile> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const systemPrompt = buildMappingPrompt()
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this intake conversation and map it to assessment constructs:\n\n${transcript}` }
      ],
      temperature: 0.3, // Low temperature for consistent mapping
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const mappingResult = JSON.parse(data.choices[0]?.message?.content || '{}')

  // Build profile from AI response
  const profile: OnboardingProfile = {
    sessionId,
    timestamp: Date.now(),
    constructs: mappingResult.constructs || getDefaultConstructs(),
    confidence: mappingResult.confidence || getDefaultConfidence(),
    rawTranscript: transcript,
    redactedTranscript: transcript, // PII already redacted by caller
  }

  return profile
}

/**
 * Build the mapping prompt for the AI
 */
function buildMappingPrompt(): string {
  return `${CRISIS_AND_SCOPE_GUARDRAILS}

You are an assessment mapping specialist for CMC Sober Coach. Your job is to analyze intake conversation transcripts and infer standardized assessment construct values WITHOUT asking verbatim assessment questions.

**Your Task:**
Analyze the conversation and map observations to these 8 assessment domains:

1. **Self-Compassion Scale (SCS)** - How they treat themselves during difficulty
   - Self-kindness vs. self-judgment
   - Common humanity vs. isolation
   - Mindfulness vs. over-identification

2. **URICA (Stages of Change)** - Readiness for behavior change
   - Precontemplation: Not considering change
   - Contemplation: Thinking about change
   - Preparation: Planning to change soon
   - Action: Actively making changes
   - Maintenance: Sustaining changes

3. **Kessler 10 (K10)** - Psychological distress
   - Anxiety, depression, nervousness, hopelessness
   - Score range: 10-50 (10=no distress, 50=severe)

4. **WHO-5** - Emotional wellbeing
   - Positive mood, energy, interest in activities
   - Score range: 0-25 (higher = better wellbeing)

5. **DBT-WCCL** - Coping strategies
   - Problem-solving, social support, avoidance

6. **Coping Self-Efficacy (CSE)** - Confidence in handling challenges
   - Problem-focused coping ability
   - Emotion-focused coping ability
   - Social support seeking ability

7. **ASSIST** - Substance use patterns
   - Type(s) of substances
   - Risk level: low/moderate/high

8. **ASI (Addiction Severity Index)** - Life areas affected
   - Relationships, employment, family, legal, health

**Output Format:**
Return a JSON object with this exact structure:

{
  "constructs": {
    "selfCompassion": {
      "selfKindness": 1-5 or null,
      "commonHumanity": 1-5 or null,
      "mindfulness": 1-5 or null
    },
    "urica": {
      "stage": "precontemplation|contemplation|preparation|action|maintenance" or null,
      "confidence": 0-1 or null
    },
    "kessler10": {
      "score": 10-50 or null,
      "distressLevel": "low|moderate|high|very-high" or null
    },
    "who5": {
      "score": 0-25 or null,
      "wellbeingLevel": "poor|moderate|good|excellent" or null
    },
    "dbtWccl": {
      "problemSolving": 1-5 or null,
      "socialSupport": 1-5 or null,
      "avoidance": 1-5 or null
    },
    "copingSelfEfficacy": {
      "problemFocused": 1-10 or null,
      "emotionFocused": 1-10 or null,
      "socialSupport": 1-10 or null
    },
    "assist": {
      "substanceType": ["alcohol", "cannabis", etc.] or null,
      "riskLevel": "low|moderate|high" or null
    },
    "asi": {
      "relationships": "brief observation" or null,
      "employment": "brief observation" or null,
      "family": "brief observation" or null,
      "legal": "brief observation" or null,
      "health": "brief observation" or null
    }
  },
  "confidence": {
    "selfCompassion": 0-1,
    "urica": 0-1,
    "kessler10": 0-1,
    "who5": 0-1,
    "dbtWccl": 0-1,
    "copingSelfEfficacy": 0-1,
    "assist": 0-1,
    "asi": 0-1,
    "overall": 0-1
  }
}

**Guidelines:**
- Only populate fields where you have evidence from the conversation
- Set confidence based on how much direct/indirect evidence you have
- Use null for fields you cannot infer
- Be conservative - don't over-infer
- Ground all values in what was actually said or clearly implied
- Confidence scores should reflect the strength of evidence, not guesses

**Important:**
- This is for behavior coaching, not clinical diagnosis
- Values are used to personalize coaching recommendations
- Users have NOT completed formal assessments
- All inferences must be grounded in the conversation
`.trim()
}

/**
 * Get default empty constructs
 */
function getDefaultConstructs() {
  return {
    selfCompassion: {},
    urica: {},
    kessler10: {},
    who5: {},
    dbtWccl: {},
    copingSelfEfficacy: {},
    assist: {},
    asi: {}
  }
}

/**
 * Get default zero confidence
 */
function getDefaultConfidence() {
  return {
    selfCompassion: 0,
    urica: 0,
    kessler10: 0,
    who5: 0,
    dbtWccl: 0,
    copingSelfEfficacy: 0,
    assist: 0,
    asi: 0,
    overall: 0
  }
}

/**
 * Validate mapping result
 */
export function validateProfile(profile: OnboardingProfile): boolean {
  // Check required fields
  if (!profile.sessionId || !profile.timestamp) {
    return false
  }
  
  // Check confidence scores are in valid range
  for (const key in profile.confidence) {
    const value = profile.confidence[key as keyof typeof profile.confidence]
    if (typeof value !== 'number' || value < 0 || value > 1) {
      return false
    }
  }
  
  return true
}
