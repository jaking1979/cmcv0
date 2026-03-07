/**
 * Push Subscription Store
 *
 * Development: in-memory Map (cleared on server restart).
 * Production: replace with a real database (Postgres, Redis, Vercel KV, etc.).
 *
 * Each subscription is keyed by its endpoint URL.
 */

export interface SerializedSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Module-level singleton — persists across requests in the same Node process
const subscriptions = new Map<string, SerializedSubscription>();

export function saveSubscription(sub: SerializedSubscription): void {
  subscriptions.set(sub.endpoint, sub);
}

export function removeSubscription(endpoint: string): void {
  subscriptions.delete(endpoint);
}

export function getAllSubscriptions(): SerializedSubscription[] {
  return Array.from(subscriptions.values());
}

export function getSubscriptionCount(): number {
  return subscriptions.size;
}
