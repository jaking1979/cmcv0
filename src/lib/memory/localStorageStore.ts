/**
 * LocalStorageStore — dev/founder-phase memory implementation
 *
 * ⚠️  IMPORTANT LIMITATIONS — read before deploying:
 *
 * 1. Data is stored UNENCRYPTED in the browser's localStorage.
 *    Any JavaScript running on this origin can read it.
 *
 * 2. Data is NOT shared across devices or browsers.
 *    Each device has its own isolated copy.
 *
 * 3. Data is LOST if the user clears browser storage or uses
 *    a private/incognito window.
 *
 * 4. This is suitable ONLY for a small dev/founder-testing phase
 *    with trusted users who understand these constraints (<15 users).
 *
 * For production:
 * - Replace this with a server-side MemoryStore implementation
 * - Use a real database with encryption at rest
 * - Tie userId to authenticated accounts
 */

import type { MemoryStore } from './store'
import type { UserMemory } from './types'
import { createEmptyMemory } from './types'

const MEMORY_KEY_PREFIX = 'cmc_user_memory_'

function storageKey(userId: string): string {
  return `${MEMORY_KEY_PREFIX}${userId}`
}

export const localStorageStore: MemoryStore = {
  async load(userId: string): Promise<UserMemory | null> {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(storageKey(userId))
      if (!raw) return null
      return JSON.parse(raw) as UserMemory
    } catch {
      return null
    }
  },

  async save(userId: string, memory: UserMemory): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const record: UserMemory = { ...memory, lastUpdated: Date.now() }
      localStorage.setItem(storageKey(userId), JSON.stringify(record))
    } catch {
      console.warn(
        '[MemoryStore] Failed to save to localStorage — storage may be full or unavailable.'
      )
    }
  },

  async update(userId: string, patch: Partial<UserMemory>): Promise<UserMemory> {
    const existing = await localStorageStore.load(userId)
    const base = existing ?? createEmptyMemory(userId)
    const updated: UserMemory = {
      ...base,
      ...patch,
      userId,       // never let a patch override the userId
      lastUpdated: Date.now(),
    }
    await localStorageStore.save(userId, updated)
    return updated
  },

  async clear(userId: string): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(storageKey(userId))
    } catch { /* ignore */ }
  },
}
