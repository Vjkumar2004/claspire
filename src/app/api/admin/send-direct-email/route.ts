import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { Resend } from 'resend';
import { sanitizeEmailHtml } from '@/lib/sanitizeEmailHtml';
import { wrapEmailTemplate } from '@/lib/emailTemplates';
import { z } from 'zod';

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

// In-memory daily rate limit tracker (resets on server restart).
// Each admin can send up to MAX_DAILY_LIMIT direct outreach emails per calendar day.
// For multi-instance deployments, replace this with a DB-backed counter.
const MAX_DAILY_LIMIT = 20;
const dailySendCounts = new Map<string, { date: string; count: number }>();

function getRateLimit(adminId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailySendCounts.get(adminId);

  if (!entry || entry.date !== today) {
    dailySendCounts.set(adminId, { date: today, count: 0 });
    return { allowed: true, remaining: MAX_DAILY_LIMIT };
  }

  const remaining = MAX_DAILY_LIMIT - entry.count;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

function incrementRateLimit(adminId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailySendCounts.get(adminId);

  if (!entry || entry.date !== today) {
    dailySendCounts.set(adminId, { date: today, count: 1 });
  } else {
    entry.count++;
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
      const { allowed, remaining } = getRateLimit(adminId);
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
      incrementRateLimit(adminId);
      const { remaining } = getRateLimit(adminId);
      console.log(`[DIRECT OUTREACH] Sent to ${email}. ${remaining}/${MAX_DAILY_LIMIT} remaining today.`);
    }

    return NextResponse.json({
      success: true,
      message: isTest ? 'Test email sent successfully' : `Email sent to ${name || email}`,
      remaining: isTest ? MAX_DAILY_LIMIT : getRateLimit(adminId).remaining,
    });

  } catch (error) {
    console.error('[DIRECT OUTREACH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
