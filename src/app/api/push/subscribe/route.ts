import { NextRequest, NextResponse } from 'next/server';
import {
  saveSubscription,
  removeSubscription,
  type SerializedSubscription,
} from '@/lib/pushSubscriptions';

/** POST /api/push/subscribe — save a new push subscription */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sub: SerializedSubscription = body.subscription;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription payload.' },
        { status: 400 }
      );
    }

    saveSubscription(sub);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save subscription.' },
      { status: 500 }
    );
  }
}

/** DELETE /api/push/subscribe — remove an existing push subscription */
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid endpoint.' },
        { status: 400 }
      );
    }

    removeSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to remove subscription.' },
      { status: 500 }
    );
  }
}
