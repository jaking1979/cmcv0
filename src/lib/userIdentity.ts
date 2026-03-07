/**
 * User Identity
 *
 * Provides a lightweight anonymous user ID for the dev/founder phase.
 * Persisted in localStorage under 'cmc_user_id'.
 *
 * This is intentionally simple — a random ID generated on first visit.
 * It is NOT a secure identity system. It is designed to be replaced with
 * real auth (NextAuth, Clerk, Supabase Auth, etc.) when the app scales.
 *
 * Limitations:
 * - Cleared if the user clears browser storage
 * - Not shared across devices or browsers
 * - No server-side account tied to this ID
 * - Appropriate only for a small dev/founder-testing phase (<15 users)
 */

const USER_ID_KEY = 'cmc_user_id'

function generateUserId(): string {
  // Generates a random ID: usr_<16 hex chars>
  const bytes = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    // Fallback for environments without Web Crypto
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return 'usr_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Returns the current user's anonymous ID, creating one if none exists. */
export function getUserId(): string {
  if (typeof window === 'undefined') return 'usr_server'

  try {
    const existing = localStorage.getItem(USER_ID_KEY)
    if (existing && existing.startsWith('usr_')) return existing

    const newId = generateUserId()
    localStorage.setItem(USER_ID_KEY, newId)
    return newId
  } catch {
    // localStorage unavailable (private mode, storage full, etc.)
    return generateUserId()
  }
}

/** Remove the stored user ID (e.g., reset / sign-out flow). */
export function clearUserId(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USER_ID_KEY)
  } catch { /* ignore */ }
}
