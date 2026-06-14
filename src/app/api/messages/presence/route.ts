import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/session';
import { getRedisClient } from '@/lib/rateLimitRedis';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { activeChatUserId } = body;

    // Presence is optional — wrap Redis in try/catch so failure never breaks chat
    try {
      const redis = getRedisClient();
      const key = `chat_presence:${user.id}`;

      if (activeChatUserId) {
        // Set presence with 30s TTL
        await redis.set(key, activeChatUserId, { ex: 30 });
      } else {
        // Clear presence if closing chat
        await redis.del(key);
      }
    } catch (redisErr) {
      console.warn('Redis presence unavailable, disabling presence temporarily:', redisErr);
      // Presence is optional — continue without it
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Chat presence error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
