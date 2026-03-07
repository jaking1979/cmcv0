/**
 * MemoryStore interface
 *
 * Abstraction over user memory persistence. The current dev implementation
 * uses localStorage (see localStorageStore.ts).
 *
 * To upgrade to production storage:
 * 1. Implement this interface against a real database (Postgres, Supabase, etc.)
 * 2. Add server-side encryption at rest
 * 3. Wire userId into a real auth system (NextAuth, Clerk, etc.)
 * 4. Replace `localStorageStore` with the new implementation at the call sites
 *    in useChatState.ts — no other files need to change.
 */

import type { UserMemory } from './types'

export interface MemoryStore {
  /**
   * Load user memory. Returns null if no record exists yet.
   */
  load(userId: string): Promise<UserMemory | null>

  /**
   * Save (overwrite) the complete user memory record.
   */
  save(userId: string, memory: UserMemory): Promise<void>

  /**
   * Apply a partial update, merging into any existing record.
   * Creates a new record from defaults if none exists.
   * Returns the merged result.
   */
  update(userId: string, patch: Partial<UserMemory>): Promise<UserMemory>

  /**
   * Delete all memory for a user (e.g., full account reset).
   */
  clear(userId: string): Promise<void>
}
