import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { Resend } from 'resend';
import { sanitizeEmailHtml } from '@/lib/sanitizeEmailHtml';
import { wrapEmailTemplate } from '@/lib/emailTemplates';
import { z } from 'zod';
import { getRedisClient } from '@/lib/rateLimitRedis';

const resend = new Resend(process.env.RESEND_API_KEY);

const directEmailSchema = z.object({
  email: z.string().email('Valid recipient email is required'),
  name: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'Email body is required'),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
  isTest: z.boolean().default(false),
  testEmail: z.string().email().optional().or(z.literal('')),
});

// Redis-backed daily rate limit tracker (persists across server restarts).
// Each admin can send up to MAX_DAILY_LIMIT direct outreach emails per calendar day.
const MAX_DAILY_LIMIT = 20;

async function getRedisRateLimit(adminId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redis = getRedisClient();
    const today = new Date().toISOString().slice(0, 10);
    const key = `direct_email_limit:${adminId}:${today}`;

    const current = await redis.get<number>(key);
    const count = current || 0;
    const remaining = Math.max(0, MAX_DAILY_LIMIT - count);

    return { allowed: remaining > 0, remaining };
  } catch (error) {
    console.error('[DIRECT OUTREACH] Redis rate limit check error:', error);
    return { allowed: true, remaining: MAX_DAILY_LIMIT };
  }
}

async function incrementRedisRateLimit(adminId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = new Date().toISOString().slice(0, 10);
    const key = `direct_email_limit:${adminId}:${today}`;

    const count = await redis.incr(key);
    // Set TTL on first increment to expire at end of day
    if (count === 1) {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const ttlSeconds = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttlSeconds);
    }
  } catch (error) {
    console.error('[DIRECT OUTREACH] Redis rate limit increment error:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if ('error' in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const adminId = 'admin_' + (adminAuth as any).id || 'anonymous';

    const body = await req.json();
    const result = directEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request', details: result.error.issues }, { status: 400 });
    }

    const { email, name, subject, htmlContent, ctaText, ctaUrl, isTest, testEmail } = result.data;

    // Personalize greeting: replace {name} with recipient name or fallback to "there"
    const personalizedName = name || 'there';
    const personalizedHtml = htmlContent.replace(/\{name\}/g, personalizedName);

    // Wrap in Claspire email layout (header, branding, footer)
    const wrappedHtml = wrapEmailTemplate(personalizedHtml, {
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
    });

    const cleanHtml = sanitizeEmailHtml(wrappedHtml);

    // Rate limiting (skipped for test sends)
    if (!isTest) {
      const { allowed, remaining } = await getRedisRateLimit(adminId);
      if (!allowed) {
        return NextResponse.json({
          error: `Daily direct outreach limit reached (${MAX_DAILY_LIMIT}/day). Please try again tomorrow.`,
        }, { status: 429 });
      }
    }

    const toAddress = isTest && testEmail ? testEmail : email;
    const finalSubject = isTest ? `[TEST] ${subject}` : subject;

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: 'Team Claspire <hello@mail.claspire.in>',
      replyTo: 'claspire.community@gmail.com',
      to: [toAddress],
      subject: finalSubject,
      html: cleanHtml,
    });

    if (sendError) {
      console.error('[DIRECT OUTREACH] Resend error:', sendError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    if (!isTest) {
      await incrementRedisRateLimit(adminId);
      const { remaining } = await getRedisRateLimit(adminId);
      console.log(`[DIRECT OUTREACH] Sent to ${email}. ${remaining}/${MAX_DAILY_LIMIT} remaining today.`);
    }

    return NextResponse.json({
      success: true,
      message: isTest ? 'Test email sent successfully' : `Email sent to ${name || email}`,
      remaining: isTest ? MAX_DAILY_LIMIT : (await getRedisRateLimit(adminId)).remaining,
    });

  } catch (error) {
    console.error('[DIRECT OUTREACH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
