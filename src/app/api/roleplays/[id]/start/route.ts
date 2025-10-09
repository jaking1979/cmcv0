import { NextRequest, NextResponse } from 'next/server'
import { startRoleplay } from '@/server/roleplays/session'
import { getRoleplayById } from '@/server/roleplays/loader'

// Feature flag check
function isFeatureEnabled(): boolean {
  return process.env.FEATURE_V1 === '1' && process.env.FEATURE_ROLEPLAYS === '1'
}

// Session management
function getSessionId(request: NextRequest): string {
  const headerSessionId = request.headers.get('X-Session-Id')
  if (headerSessionId) {
    return headerSessionId
  }

  const cookieSessionId = request.cookies.get('session-id')?.value
  if (cookieSessionId) {
    return cookieSessionId
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = ip
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  current.count++
  return true
}

// POST /api/roleplays/[id]/start - Start a roleplay session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Feature flag check
    if (!isFeatureEnabled()) {
      return NextResponse.json(
        { error: 'Feature not enabled' },
        { status: 404 }
      )
    }

    // Rate limiting
    const ip = request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { id: roleplayId } = await params
    if (!roleplayId) {
      return NextResponse.json(
        { error: 'Roleplay ID is required' },
        { status: 400 }
      )
    }

    // Get session ID
    const sessionId = getSessionId(request)

    // Load roleplay data
    const roleplay = await getRoleplayById(roleplayId)
    if (!roleplay) {
      return NextResponse.json(
        { error: 'Roleplay not found' },
        { status: 404 }
      )
    }

    // Start roleplay session
    const session = startRoleplay(roleplayId, sessionId)

    // Return session info and first turn
    const firstTurn = session.roleplay.steps[0]
    const response = {
      success: true,
      sessionId: session.id,
      roleplayId,
      title: roleplay.title,
      firstTurn: {
        role: firstTurn.role,
        content: typeof firstTurn.text === 'string' ? firstTurn.text : JSON.stringify(firstTurn.text),
        kind: firstTurn.kind
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[roleplays/start] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




