import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { mapTranscriptToProfile, validateProfile } from '@/server/ai/mapping/onboardingMapping'
import { getOrCreateSession, createSessionResponse, isRateLimited } from '@/server/util/session'
import { redactTranscript } from '@/server/util/redactPII'

// Feature flag check
function isMappingEnabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_ONBOARDING_MAP === '1'
}

/**
 * POST /api/onboarding/map
 * Map conversation transcript to assessment constructs
 */
export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isMappingEnabled()) {
      return NextResponse.json(
        { error: 'Assessment mapping not enabled' },
        { status: 403 }
      )
    }
    
    // Get or create session
    const session = getOrCreateSession(request)
    
    // Rate limiting
    if (isRateLimited(`map_${session.id}`)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before requesting another mapping.' },
        { status: 429 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { sessionId, transcript } = body as { sessionId?: string; transcript: string }
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: transcript required' },
        { status: 400 }
      )
    }
    
    // Use provided sessionId or fall back to session.id
    const targetSessionId = sessionId || session.id
    
    // Redact PII from transcript
    const redactedTranscript = redactTranscript(transcript)
    
    // Map transcript to profile
    const profile = await mapTranscriptToProfile(targetSessionId, redactedTranscript)
    
    // Validate profile
    if (!validateProfile(profile)) {
      return NextResponse.json(
        { error: 'Invalid profile generated' },
        { status: 500 }
      )
    }
    
    // Return the mapped profile
    return createSessionResponse(
      {
        success: true,
        profile,
        sessionId: targetSessionId,
      },
      session
    )
  } catch (error) {
    console.error('Onboarding mapping error:', error)
    
    // Handle OpenAI API errors gracefully
    if (error instanceof Error && error.message.includes('OpenAI API')) {
      return NextResponse.json(
        { 
          error: 'Unable to process assessment mapping at this time',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/onboarding/map
 * Retrieve mapping info (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    if (!isMappingEnabled()) {
      return NextResponse.json(
        { error: 'Assessment mapping not enabled' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      info: {
        enabled: true,
        assessments: [
          'Self-Compassion Scale (SCS)',
          'URICA - Stages of Change',
          'Kessler 10 (K10) - Psychological Distress',
          'WHO-5 - Wellbeing Index',
          'DBT-WCCL - Coping Strategies',
          'Coping Self-Efficacy Scale (CSE)',
          'ASSIST - Substance Use Screening',
          'ASI - Addiction Severity Index'
        ],
        note: 'This endpoint infers assessment constructs from natural conversation. It does not replace formal clinical assessment.'
      }
    })
  } catch (error) {
    console.error('Mapping info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
