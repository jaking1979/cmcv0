// Roleplay session management

import { RoleplayMeta, RoleplayStep } from './loader'

export interface RoleplayTurn {
  role: 'assistant' | 'user'
  content: string | { type: 'actionMenu'; options: Array<{ label: string; value: string }> }
  kind?: string
}

export interface RoleplaySession {
  id: string
  roleplayId: string
  sessionId: string
  currentStepIndex: number
  roleplay: RoleplayMeta
  startedAt: number
  lastActivity: number
}

// In-memory session store
const sessions = new Map<string, RoleplaySession>()

export function startRoleplay(roleplayId: string, sessionId: string): RoleplaySession {
  // For now, we'll need to load the roleplay data
  // In a real implementation, this would be async
  const roleplay: RoleplayMeta = {
    id: roleplayId,
    title: `Roleplay ${roleplayId}`,
    steps: [
      {
        role: 'assistant',
        kind: 'reflection',
        text: 'Welcome to this practice scenario. Let\'s begin.'
      }
    ]
  }

  const session: RoleplaySession = {
    id: `roleplay_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    roleplayId,
    sessionId,
    currentStepIndex: 0,
    roleplay,
    startedAt: Date.now(),
    lastActivity: Date.now()
  }

  sessions.set(session.id, session)
  return session
}

export function getRoleplaySession(sessionId: string): RoleplaySession | null {
  for (const session of sessions.values()) {
    if (session.sessionId === sessionId) {
      return session
    }
  }
  return null
}

export function nextRoleplayTurn(sessionId: string, lastUserMessage?: string): RoleplayTurn[] {
  const session = getRoleplaySession(sessionId)
  if (!session) {
    return []
  }

  const turns: RoleplayTurn[] = []
  const roleplay = session.roleplay

  // If we have a user message, advance to next step
  if (lastUserMessage) {
    session.currentStepIndex++
    session.lastActivity = Date.now()
  }

  // Check if we're at the end
  if (session.currentStepIndex >= roleplay.steps.length) {
    return [{
      role: 'assistant',
      content: 'This roleplay scenario has concluded. Thank you for practicing!',
      kind: 'assistantPlain'
    }]
  }

  // Get the current step
  const currentStep = roleplay.steps[session.currentStepIndex]
  
  // Convert roleplay step to chat turn
  if (currentStep.kind === 'actionMenu' && typeof currentStep.text === 'object') {
    turns.push({
      role: currentStep.role,
      content: {
        type: 'actionMenu',
        options: currentStep.text.options
      },
      kind: currentStep.kind
    })
  } else {
    turns.push({
      role: currentStep.role,
      content: typeof currentStep.text === 'string' ? currentStep.text : JSON.stringify(currentStep.text),
      kind: currentStep.kind
    })
  }

  return turns
}

export function endRoleplaySession(sessionId: string): boolean {
  const session = getRoleplaySession(sessionId)
  if (session) {
    sessions.delete(session.id)
    return true
  }
  return false
}

export function getActiveSessions(): RoleplaySession[] {
  return Array.from(sessions.values())
}

export function cleanupOldSessions(maxAgeMs: number = 60 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < cutoff) {
      sessions.delete(sessionId)
    }
  }
}

// Auto-cleanup every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupOldSessions()
  }, 30 * 60 * 1000)
}




