/**
 * Session Identity Strategy
 * Manages session identification across requests
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SessionInfo } from '../ai/types'
import { storeSession, getSession, updateSessionActivity } from '../store/memory'

const SESSION_COOKIE_NAME = 'cmc_session_id'
const SESSION_HEADER_NAME = 'x-session-id'
const SESSION_ID_LENGTH = 32

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'sess_'
  for (let i = 0; i < SESSION_ID_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Extract session ID from request
 * Checks: 1) x-session-id header, 2) cookie, 3) generates new
 */
export function getSessionId(request: NextRequest): string {
  // Check header first
  const headerSessionId = request.headers.get(SESSION_HEADER_NAME)
  if (headerSessionId && isValidSessionId(headerSessionId)) {
    return headerSessionId
  }
  
  // Check cookie
  const cookieSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (cookieSessionId && isValidSessionId(cookieSessionId)) {
    return cookieSessionId
  }
  
  // Generate new session ID
  return generateSessionId()
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' && sessionId.startsWith('sess_') && sessionId.length > 10
}

/**
 * Get or create session info
 */
export function getOrCreateSession(request: NextRequest): SessionInfo {
  const sessionId = getSessionId(request)
  
  // Try to get existing session
  let session = getSession(sessionId)
  
  // Create new session if not found
  if (!session) {
    session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: getClientIP(request),
    }
    storeSession(session)
  } else {
    // Update activity
    updateSessionActivity(sessionId)
  }
  
  return session
}

/**
 * Extract client IP address from request
 */
export function getClientIP(request: NextRequest): string | undefined {
  // Check common headers for proxied requests
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  return undefined
}

/**
 * Set session cookie on response
 */
export function setSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  
  return response
}

/**
 * Add session headers to response
 */
export function addSessionHeaders(response: NextResponse, sessionId: string): NextResponse {
  response.headers.set(SESSION_HEADER_NAME, sessionId)
  return response
}

/**
 * Create a response with session info
 */
export function createSessionResponse(data: any, session: SessionInfo): NextResponse {
  const response = NextResponse.json(data)
  setSessionCookie(response, session.id)
  addSessionHeaders(response, session.id)
  return response
}

/**
 * Rate limiting helper
 * Returns true if request should be rate limited
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute

export function isRateLimited(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)
  
  if (!limit || now > limit.resetAt) {
    // Reset or create new limit
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    })
    return false
  }
  
  // Increment count
  limit.count++
  
  // Check if over limit
  if (limit.count > RATE_LIMIT_MAX_REQUESTS) {
    return true
  }
  
  return false
}

/**
 * Cleanup old rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, limit] of rateLimitMap.entries()) {
    if (now > limit.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}


