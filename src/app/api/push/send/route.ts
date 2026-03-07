import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import {
  getAllSubscriptions,
  removeSubscription,
  type SerializedSubscription,
} from '@/lib/pushSubscriptions';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL!;

function initVapid() {
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
    webpush.setVapidDetails(
      `mailto:${VAPID_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    return true;
  }
  return false;
}

/**
 * POST /api/push/send
 *
 * Body: { title?: string; body?: string; url?: string }
 *
 * Sends a push notification to all subscribed devices.
 * In production you'd protect this route with an admin key or internal-only access.
 */
export async function POST(req: NextRequest) {
  if (!initVapid()) {
    return NextResponse.json(
      { error: 'Push notifications are not configured. Set VAPID_* environment variables.' },
      { status: 503 }
    );
  }

  let title: string;
  let body: string;
  let url: string;

  try {
    const data = await req.json();
    title = data.title || 'CMC Sober Coach';
    body = data.body || 'Tap to open your coach.';
    url = data.url || '/advice';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const payload = JSON.stringify({ title, body, url });
  const subscriptions = getAllSubscriptions();

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: 'No active subscriptions.' });
  }

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub: SerializedSubscription) => {
      try {
        await webpush.sendNotification(sub as webpush.PushSubscription, payload);
        sent++;
      } catch (err: unknown) {
        // 410 Gone = subscription expired/unsubscribed — clean it up
        if (
          err &&
          typeof err === 'object' &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          removeSubscription(sub.endpoint);
        }
        failed++;
      }
    })
  );

  return NextResponse.json({ sent, failed });
}
