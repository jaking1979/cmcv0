/**
 * In-Memory Store for V1
 * Stores coach events, sessions, and metrics temporarily
 * Note: This is ephemeral storage for demo/v1. Production would use a database.
 */

import type { CoachEvent, SessionInfo, PersonalizedPlan } from '../ai/types'

// Store configuration
const MAX_EVENTS_PER_SESSION = 1000
const MAX_SESSIONS = 100
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// In-memory stores
const events = new Map<string, CoachEvent[]>()  // sessionId -> events
const sessions = new Map<string, SessionInfo>()  // sessionId -> session info
const plans = new Map<string, PersonalizedPlan[]>()  // sessionId -> plans

/**
 * Store a coach event
 */
export function storeEvent(event: CoachEvent): void {
  const { sessionId } = event
  
  // Get or create event list for session
  let sessionEvents = events.get(sessionId)
  if (!sessionEvents) {
    sessionEvents = []
    events.set(sessionId, sessionEvents)
  }
  
  // Add event (with limit)
  sessionEvents.push(event)
  if (sessionEvents.length > MAX_EVENTS_PER_SESSION) {
    sessionEvents.shift() // Remove oldest
  }
  
  // Update session activity
  updateSessionActivity(sessionId)
  
  // Cleanup old sessions periodically
  if (Math.random() < 0.01) { // 1% chance on each write
    cleanupOldSessions()
  }
}

/**
 * Get events for a session
 */
export function getEvents(sessionId: string, limit?: number): CoachEvent[] {
  const sessionEvents = events.get(sessionId) || []
  
  if (limit && limit > 0) {
    return sessionEvents.slice(-limit)
  }
  
  return [...sessionEvents]
}

/**
 * Get recent events across all sessions (for debugging)
 */
export function getRecentEvents(limit: number = 100): CoachEvent[] {
  const allEvents: CoachEvent[] = []
  
  for (const sessionEvents of events.values()) {
    allEvents.push(...sessionEvents)
  }
  
  // Sort by timestamp descending
  allEvents.sort((a, b) => b.timestamp - a.timestamp)
  
  return allEvents.slice(0, limit)
}

/**
 * Store a session
 */
export function storeSession(session: SessionInfo): void {
  sessions.set(session.id, session)
  
  // Enforce session limit
  if (sessions.size > MAX_SESSIONS) {
    // Remove oldest session
    const oldestId = Array.from(sessions.entries())
      .sort(([, a], [, b]) => a.lastActivity - b.lastActivity)[0]?.[0]
    
    if (oldestId) {
      removeSession(oldestId)
    }
  }
}

/**
 * Get a session
 */
export function getSession(sessionId: string): SessionInfo | undefined {
  return sessions.get(sessionId)
}

/**
 * Update session last activity timestamp
 */
export function updateSessionActivity(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (session) {
    session.lastActivity = Date.now()
  }
}

/**
 * Remove a session and its associated data
 */
export function removeSession(sessionId: string): void {
  sessions.delete(sessionId)
  events.delete(sessionId)
  plans.delete(sessionId)
}

/**
 * Cleanup sessions older than TTL
 */
export function cleanupOldSessions(): void {
  const now = Date.now()
  const expiredSessions: string[] = []
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      expiredSessions.push(sessionId)
    }
  }
  
  for (const sessionId of expiredSessions) {
    removeSession(sessionId)
  }
}

/**
 * Store a personalized plan
 */
export function storePlan(plan: PersonalizedPlan): void {
  const { sessionId } = plan
  
  let sessionPlans = plans.get(sessionId)
  if (!sessionPlans) {
    sessionPlans = []
    plans.set(sessionId, sessionPlans)
  }
  
  sessionPlans.push(plan)
  
  // Keep only last 10 plans per session
  if (sessionPlans.length > 10) {
    sessionPlans.shift()
  }
  
  updateSessionActivity(sessionId)
}

/**
 * Get plans for a session
 */
export function getPlans(sessionId: string): PersonalizedPlan[] {
  return [...(plans.get(sessionId) || [])]
}

/**
 * Get the most recent plan for a session
 */
export function getLatestPlan(sessionId: string): PersonalizedPlan | undefined {
  const sessionPlans = plans.get(sessionId)
  return sessionPlans?.[sessionPlans.length - 1]
}

/**
 * Get store statistics (for monitoring)
 */
export function getStoreStats() {
  let totalEvents = 0
  for (const sessionEvents of events.values()) {
    totalEvents += sessionEvents.length
  }
  
  let totalPlans = 0
  for (const sessionPlans of plans.values()) {
    totalPlans += sessionPlans.length
  }
  
  return {
    sessions: sessions.size,
    totalEvents,
    totalPlans,
    oldestSession: Math.min(...Array.from(sessions.values()).map(s => s.createdAt), Date.now()),
    newestSession: Math.max(...Array.from(sessions.values()).map(s => s.createdAt), 0),
  }
}

/**
 * Clear all data (for testing)
 */
export function clearAll(): void {
  events.clear()
  sessions.clear()
  plans.clear()
}
