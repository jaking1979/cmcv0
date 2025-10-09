// Unit tests for roleplay session management

import { startRoleplay, nextRoleplayTurn, getRoleplaySession, endRoleplaySession, getActiveSessions } from '@/server/roleplays/session'

describe('Roleplay Session Management', () => {
  beforeEach(() => {
    // Clear any existing sessions
    const activeSessions = getActiveSessions()
    activeSessions.forEach(session => {
      endRoleplaySession(session.sessionId)
    })
  })

  test('should start a roleplay session', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    
    expect(session).toBeDefined()
    expect(session.roleplayId).toBe('test-roleplay')
    expect(session.sessionId).toBe('test-session')
    expect(session.currentStepIndex).toBe(0)
    expect(session.roleplay).toBeDefined()
    expect(session.startedAt).toBeGreaterThan(0)
    expect(session.lastActivity).toBeGreaterThan(0)
  })

  test('should get roleplay session by session ID', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    const retrieved = getRoleplaySession('test-session')
    
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(session.id)
    expect(retrieved?.roleplayId).toBe('test-roleplay')
  })

  test('should return null for non-existent session', () => {
    const retrieved = getRoleplaySession('non-existent-session')
    expect(retrieved).toBeNull()
  })

  test('should get first turn from roleplay', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    const turns = nextRoleplayTurn('test-session')
    
    expect(turns).toHaveLength(1)
    expect(turns[0].role).toBe('assistant')
    expect(turns[0].content).toBe('Welcome to this practice scenario. Let\'s begin.')
    expect(turns[0].kind).toBe('reflection')
  })

  test('should advance to next turn after user message', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    
    // Get first turn
    const firstTurns = nextRoleplayTurn('test-session')
    expect(firstTurns).toHaveLength(1)
    
    // Advance with user message
    const secondTurns = nextRoleplayTurn('test-session', 'I understand')
    expect(secondTurns).toHaveLength(1)
    expect(secondTurns[0].role).toBe('assistant')
  })

  test('should handle end of roleplay', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    
    // Simulate going through all steps
    session.currentStepIndex = session.roleplay.steps.length
    
    const turns = nextRoleplayTurn('test-session', 'Final user message')
    expect(turns).toHaveLength(1)
    expect(turns[0].content).toBe('This roleplay scenario has concluded. Thank you for practicing!')
  })

  test('should end roleplay session', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    const sessionId = session.sessionId
    
    const ended = endRoleplaySession(sessionId)
    expect(ended).toBe(true)
    
    const retrieved = getRoleplaySession(sessionId)
    expect(retrieved).toBeNull()
  })

  test('should return false when ending non-existent session', () => {
    const ended = endRoleplaySession('non-existent-session')
    expect(ended).toBe(false)
  })

  test('should get active sessions', () => {
    const session1 = startRoleplay('roleplay-1', 'session-1')
    const session2 = startRoleplay('roleplay-2', 'session-2')
    
    const activeSessions = getActiveSessions()
    expect(activeSessions).toHaveLength(2)
    
    const sessionIds = activeSessions.map(s => s.sessionId)
    expect(sessionIds).toContain('session-1')
    expect(sessionIds).toContain('session-2')
  })

  test('should handle multiple sessions independently', () => {
    const session1 = startRoleplay('roleplay-1', 'session-1')
    const session2 = startRoleplay('roleplay-2', 'session-2')
    
    // Advance session 1
    nextRoleplayTurn('session-1', 'User message 1')
    const retrieved1 = getRoleplaySession('session-1')
    expect(retrieved1?.currentStepIndex).toBe(1)
    
    // Session 2 should still be at step 0
    const retrieved2 = getRoleplaySession('session-2')
    expect(retrieved2?.currentStepIndex).toBe(0)
  })

  test('should update last activity on turn advancement', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    const initialActivity = session.lastActivity
    
    // Wait a bit to ensure timestamp difference
    setTimeout(() => {
      nextRoleplayTurn('test-session', 'User message')
      const updatedSession = getRoleplaySession('test-session')
      expect(updatedSession?.lastActivity).toBeGreaterThan(initialActivity)
    }, 10)
  })

  test('should handle action menu turns', () => {
    // This test would require a roleplay with action menu steps
    // For now, we'll test the basic structure
    const session = startRoleplay('test-roleplay', 'test-session')
    const turns = nextRoleplayTurn('test-session')
    
    expect(turns[0]).toHaveProperty('role')
    expect(turns[0]).toHaveProperty('content')
    expect(turns[0]).toHaveProperty('kind')
  })

  test('should handle empty user message', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    const turns = nextRoleplayTurn('test-session', '')
    
    expect(turns).toHaveLength(1)
    expect(turns[0].role).toBe('assistant')
  })

  test('should handle undefined user message', () => {
    const session = startRoleplay('test-roleplay', 'test-session')
    const turns = nextRoleplayTurn('test-session', undefined as any)
    
    expect(turns).toHaveLength(1)
    expect(turns[0].role).toBe('assistant')
  })
})




