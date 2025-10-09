/**
 * Unit tests for in-memory store
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type { CoachEvent, SessionInfo, PersonalizedPlan } from '../../src/server/ai/types'
import {
  storeEvent,
  getEvents,
  storeSession,
  getSession,
  updateSessionActivity,
  removeSession,
  storePlan,
  getPlans,
  getLatestPlan,
  getStoreStats,
  clearAll,
} from '../../src/server/store/memory'

describe('Memory Store', () => {
  beforeEach(() => {
    // Clear store before each test
    clearAll()
  })

  describe('Event storage', () => {
    it('should store and retrieve events', () => {
      const event: CoachEvent = {
        id: 'event_1',
        sessionId: 'sess_test',
        timestamp: Date.now(),
        coachType: 'dbt',
        messageId: 'msg_1',
        tags: [],
        confidence: 0.8,
      }

      storeEvent(event)
      const events = getEvents('sess_test')

      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('event_1')
    })

    it('should retrieve limited number of events', () => {
      // Store 10 events
      for (let i = 0; i < 10; i++) {
        storeEvent({
          id: `event_${i}`,
          sessionId: 'sess_test',
          timestamp: Date.now() + i,
          coachType: 'dbt',
          messageId: `msg_${i}`,
          tags: [],
          confidence: 0.8,
        })
      }

      const events = getEvents('sess_test', 5)
      expect(events).toHaveLength(5)
      // Should get the last 5 events
      expect(events[events.length - 1].id).toBe('event_9')
    })

    it('should handle multiple sessions', () => {
      storeEvent({
        id: 'event_1',
        sessionId: 'sess_a',
        timestamp: Date.now(),
        coachType: 'dbt',
        messageId: 'msg_1',
        tags: [],
        confidence: 0.8,
      })

      storeEvent({
        id: 'event_2',
        sessionId: 'sess_b',
        timestamp: Date.now(),
        coachType: 'cbt',
        messageId: 'msg_2',
        tags: [],
        confidence: 0.7,
      })

      expect(getEvents('sess_a')).toHaveLength(1)
      expect(getEvents('sess_b')).toHaveLength(1)
      expect(getEvents('sess_a')[0].coachType).toBe('dbt')
      expect(getEvents('sess_b')[0].coachType).toBe('cbt')
    })
  })

  describe('Session management', () => {
    it('should store and retrieve sessions', () => {
      const session: SessionInfo = {
        id: 'sess_test',
        createdAt: Date.now(),
        lastActivity: Date.now(),
      }

      storeSession(session)
      const retrieved = getSession('sess_test')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('sess_test')
    })

    it('should update session activity', () => {
      const session: SessionInfo = {
        id: 'sess_test',
        createdAt: Date.now(),
        lastActivity: Date.now() - 10000, // 10 seconds ago
      }

      storeSession(session)
      const before = getSession('sess_test')?.lastActivity

      // Wait a bit and update
      setTimeout(() => {
        updateSessionActivity('sess_test')
        const after = getSession('sess_test')?.lastActivity

        expect(after).toBeGreaterThan(before!)
      }, 10)
    })

    it('should remove session and its data', () => {
      const sessionId = 'sess_test'

      // Store session, event, and plan
      storeSession({
        id: sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      })

      storeEvent({
        id: 'event_1',
        sessionId,
        timestamp: Date.now(),
        coachType: 'dbt',
        messageId: 'msg_1',
        tags: [],
        confidence: 0.8,
      })

      storePlan({
        id: 'plan_1',
        sessionId,
        timestamp: Date.now(),
        summary: 'Test plan',
        actions: [],
        rationale: 'Test',
        confidence: 0.8,
      })

      // Remove session
      removeSession(sessionId)

      // Verify all data is removed
      expect(getSession(sessionId)).toBeUndefined()
      expect(getEvents(sessionId)).toHaveLength(0)
      expect(getPlans(sessionId)).toHaveLength(0)
    })
  })

  describe('Plan storage', () => {
    it('should store and retrieve plans', () => {
      const plan: PersonalizedPlan = {
        id: 'plan_1',
        sessionId: 'sess_test',
        timestamp: Date.now(),
        summary: 'Test plan summary',
        actions: [
          {
            id: 'action_1',
            title: 'Test action',
            description: 'Do something',
            category: 'immediate',
            difficulty: 'easy',
          },
        ],
        rationale: 'Test rationale',
        confidence: 0.9,
      }

      storePlan(plan)
      const plans = getPlans('sess_test')

      expect(plans).toHaveLength(1)
      expect(plans[0].id).toBe('plan_1')
      expect(plans[0].actions).toHaveLength(1)
    })

    it('should get latest plan', () => {
      const sessionId = 'sess_test'

      // Store multiple plans
      for (let i = 0; i < 3; i++) {
        storePlan({
          id: `plan_${i}`,
          sessionId,
          timestamp: Date.now() + i,
          summary: `Plan ${i}`,
          actions: [],
          rationale: 'Test',
          confidence: 0.8,
        })
      }

      const latest = getLatestPlan(sessionId)

      expect(latest).toBeDefined()
      expect(latest?.id).toBe('plan_2')
    })

    it('should limit number of stored plans per session', () => {
      const sessionId = 'sess_test'

      // Store more than the limit (10)
      for (let i = 0; i < 15; i++) {
        storePlan({
          id: `plan_${i}`,
          sessionId,
          timestamp: Date.now() + i,
          summary: `Plan ${i}`,
          actions: [],
          rationale: 'Test',
          confidence: 0.8,
        })
      }

      const plans = getPlans(sessionId)

      expect(plans.length).toBeLessThanOrEqual(10)
      // Should have the most recent ones
      expect(plans[plans.length - 1].id).toBe('plan_14')
    })
  })

  describe('Store statistics', () => {
    it('should provide accurate statistics', () => {
      // Create some data
      const sessionIds = ['sess_1', 'sess_2', 'sess_3']

      for (const sessionId of sessionIds) {
        storeSession({
          id: sessionId,
          createdAt: Date.now(),
          lastActivity: Date.now(),
        })

        storeEvent({
          id: `event_${sessionId}`,
          sessionId,
          timestamp: Date.now(),
          coachType: 'dbt',
          messageId: 'msg_1',
          tags: [],
          confidence: 0.8,
        })

        storePlan({
          id: `plan_${sessionId}`,
          sessionId,
          timestamp: Date.now(),
          summary: 'Test',
          actions: [],
          rationale: 'Test',
          confidence: 0.8,
        })
      }

      const stats = getStoreStats()

      expect(stats.sessions).toBe(3)
      expect(stats.totalEvents).toBe(3)
      expect(stats.totalPlans).toBe(3)
    })
  })

  describe('Clear all', () => {
    it('should clear all stored data', () => {
      // Store some data
      storeSession({
        id: 'sess_test',
        createdAt: Date.now(),
        lastActivity: Date.now(),
      })

      storeEvent({
        id: 'event_1',
        sessionId: 'sess_test',
        timestamp: Date.now(),
        coachType: 'dbt',
        messageId: 'msg_1',
        tags: [],
        confidence: 0.8,
      })

      // Clear all
      clearAll()

      // Verify everything is empty
      expect(getSession('sess_test')).toBeUndefined()
      expect(getEvents('sess_test')).toHaveLength(0)
      expect(getPlans('sess_test')).toHaveLength(0)

      const stats = getStoreStats()
      expect(stats.sessions).toBe(0)
      expect(stats.totalEvents).toBe(0)
      expect(stats.totalPlans).toBe(0)
    })
  })
})


