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
        schema_version: '1.0',
        formulation_fields: [
          'current_use (substances, pattern, trajectory, functional impact)',
          'ideal_goal (goal type, specificity, ambivalence level, values signals)',
          'risk_map (triggers, emotional drivers, high-risk times/places)',
          'protection_map (supportive people, routines, prior successes)',
          'coach_profiles (mi, act, dbt, mindfulness, self_compassion, executive_support)',
          'communication_profile (style, depth, help-seeking, challenge tolerance)',
          'safety_flags (suicidal ideation, overdose, withdrawal, DV, acute risk level)',
          'behavioral_dimensions (impulse-reflection, solo-social, avoidance-approach, planned-in-moment, relief-values, direct-feedback)',
          'confidence_summary (per domain + low_confidence_domains)',
          'segment_coverage (per V1 domain + overall)'
        ],
        note: 'Produces a first-pass heuristic OnboardingFormulation from natural conversation. Not a clinical assessment — all outputs are provisional.'
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
