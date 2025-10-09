import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import type { CoachEvent, CoachMessage } from '@/server/ai/types'
import { storeEvent, getEvents } from '@/server/store/memory'
import { getOrCreateSession, createSessionResponse, isRateLimited } from '@/server/util/session'
import { redactMessages } from '@/server/util/redactPII'
import { analyzeForDBT } from '@/server/ai/coaches/dbtCoach'
import { analyzeForSelfCompassion } from '@/server/ai/coaches/selfCompassionCoach'
import { analyzeForCBT } from '@/server/ai/coaches/cbtCoach'

// Feature flag check
function isEventsEnabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_COACHES === '1'
}

/**
 * POST /api/events
 * Log coach events from conversation analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isEventsEnabled()) {
      return NextResponse.json(
        { error: 'Events logging not enabled' },
        { status: 403 }
      )
    }
    
    // Get or create session
    const session = getOrCreateSession(request)
    
    // Rate limiting
    if (isRateLimited(session.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { messages } = body as { messages: CoachMessage[] }
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      )
    }
    
    // Redact PII from messages
    const redactedMessages = redactMessages(messages)
    
    console.log('[Events API] Analyzing messages:', redactedMessages)
    
    // Analyze with each coach
    const analyses = [
      analyzeForDBT(redactedMessages),
      analyzeForSelfCompassion(redactedMessages),
      analyzeForCBT(redactedMessages),
    ]
    
    console.log('[Events API] Analysis results:', analyses.map(a => ({
      coach: a.coachType,
      confidence: a.confidence,
      signals: a.signals
    })))
    
    // Store events for each coach analysis
    const storedEvents: CoachEvent[] = []
    for (const analysis of analyses) {
      if (analysis.confidence >= 0.3) { // Only store if confidence meets threshold (lowered from 0.4 for better sensitivity)
        const event: CoachEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          sessionId: session.id,
          timestamp: Date.now(),
          coachType: analysis.coachType,
          messageId: `msg_${messages.length}`,
          tags: analysis.tags,
          confidence: analysis.confidence,
          metadata: {
            signals: analysis.signals,
            messageCount: messages.length,
          }
        }
        
        storeEvent(event)
        storedEvents.push(event)
      }
    }
    
    // Return stored events
    return createSessionResponse(
      {
        success: true,
        events: storedEvents,
        sessionId: session.id,
      },
      session
    )
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events
 * Retrieve recent events for debugging/monitoring
 */
export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    if (!isEventsEnabled()) {
      return NextResponse.json(
        { error: 'Events logging not enabled' },
        { status: 403 }
      )
    }
    
    // Get session
    const session = getOrCreateSession(request)
    
    // Get limit from query params
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50
    
    // Get events for this session
    const events = getEvents(session.id, limit)
    
    return createSessionResponse(
      {
        success: true,
        events,
        sessionId: session.id,
        count: events.length,
      },
      session
    )
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
