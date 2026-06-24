import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';
import { Resend } from 'resend';
import { sanitizeEmailHtml } from '@/lib/sanitizeEmailHtml';
import { z } from 'zod';
import { applyRateLimit, getRedisClient } from '@/lib/rateLimitRedis';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "Email content is required"),
  isTest: z.boolean().default(false),
  testEmail: z.string().email().optional().or(z.literal('')),
  audienceType: z.enum(['all', 'students', 'seniors', 'college', 'custom']),
  collegeId: z.string().optional(),
  recipientIds: z.array(z.string()).optional()
});

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if ('error' in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    // Rate limiting: 3 campaigns per hour per admin
    const rateLimitResult = await applyRateLimit(req, 'adminCampaign')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const body = await req.json();
    const result = sendEmailSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data', details: result.error.issues }, { status: 400 });
    }

    const { subject, htmlContent, isTest, testEmail, audienceType, collegeId, recipientIds } = result.data;
    
    const cleanHtml = sanitizeEmailHtml(htmlContent);

    if (isTest) {
      if (!testEmail) {
        return NextResponse.json({ error: 'Test email is required for test sends' }, { status: 400 });
      }
      
      const { data, error } = await resend.emails.send({
        from: 'Updates <updates@mail.claspire.in>',
        replyTo: 'claspire.community@gmail.com',
        to: [testEmail],
        subject: `[TEST] ${subject}`,
        html: cleanHtml,
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Test email sent successfully' });
    }

    // --- Production Send Logic ---
    // IMPORTANT: Every recipient gets an individual resend.emails.send() call.
    // NEVER use to: [email1, email2, email3] or resend.batch.send().
    // Shared-recipient sends expose all addresses to every recipient (privacy violation)
    // and trigger Gmail 421 4.7.28 rate-limit errors because Gmail sees one connection
    // delivering to many recipients simultaneously, which looks like bulk/spam behavior.
    //
    // Individual sends + throttling:
    //   - Each recipient gets their own SMTP transaction (better reputation)
    //   - Recipients never see each other's addresses (privacy)
    //   - 2s delay between groups of 3 keeps the sending rate low enough that
    //     Gmail's per-connection and per-domain rate windows aren't exhausted
    //   - Retries with exponential backoff handle transient failures without
    //     compounding the rate on reattempts

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    let query = supabase.from('users').select('email');

    switch (audienceType) {
      case 'students':
        query = query.eq('role', 'student');
        break;
      case 'seniors':
        query = query.eq('role', 'senior');
        break;
      case 'college':
        if (!collegeId) {
          return NextResponse.json({ error: 'College ID required' }, { status: 400 });
        }
        query = query.eq('college_id', collegeId);
        break;
      case 'custom':
        if (!recipientIds || recipientIds.length === 0) {
          return NextResponse.json({ error: 'At least one recipient must be selected' }, { status: 400 });
        }
        query = query.in('id', recipientIds);
        break;
      case 'all':
      default:
        break;
    }

    const { data: users, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to fetch audience' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Audience is empty' }, { status: 400 });
    }

    const validEmails = users
      .map(u => u.email)
      .filter(email => email && typeof email === 'string' && email.includes('@'));

    if (validEmails.length === 0) {
       return NextResponse.json({ error: 'No valid emails found in audience' }, { status: 400 });
    }

    // Safety cap: max 100 recipients per campaign to protect domain reputation.
    // As Claspire's sending domain (mail.claspire.in) warms up, this limit
    // prevents a single large blast from triggering Gmail's bulk thresholds.
    const MAX_RECIPIENTS = 100;
    if (validEmails.length > MAX_RECIPIENTS) {
      return NextResponse.json({
        error: `Campaign exceeds maximum of ${MAX_RECIPIENTS} recipients. Selected ${validEmails.length} recipients. Reduce audience size or split into multiple campaigns.`
      }, { status: 400 });
    }

    // Throttling parameters:
    //   BATCH_SIZE = 3  — process 3 recipients, then wait
    //   BATCH_DELAY_MS = 2000  — 2 second cool-down between groups
    //   MAX_RETRIES = 3  — each recipient retried up to 3 times
    //
    // These values keep the sending rate below Gmail's 421 4.7.28 threshold
    // (~1 email/second average: 3 recipients / (3 sends + 2s wait) ≈ 0.6/s).
    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 2000;
    const MAX_RETRIES = 3;
    const total = validEmails.length;

    let sentCount = 0;
    const failedEmails: string[] = [];

    // Send to a single recipient with up to MAX_RETRIES attempts.
    // Exponential backoff (2s → 4s) between retries gives Gmail time to
    // accept the connection before we reattempt, rather than retrying
    // immediately and compounding the rate limit.
    async function sendWithRetry(email: string): Promise<boolean> {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Individual send — every recipient gets their own Resend API call
          const { error } = await resend.emails.send({
            from: 'Updates <updates@mail.claspire.in>',
            replyTo: 'claspire.community@gmail.com',
            to: [email], // single-element array — never multiple recipients
            subject,
            html: cleanHtml,
          });
          if (!error) return true;
          console.warn(`[Retry ${attempt + 1}/${MAX_RETRIES}] Failed for ${email}: ${error.message}`);
        } catch (err) {
          console.warn(`[Retry ${attempt + 1}/${MAX_RETRIES}] Exception for ${email}:`, err);
        }
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
      return false;
    }

    // Process recipients in groups of BATCH_SIZE.
    // Within each group, sends are sequential for predictable rate-limiting.
    // Between groups, a 2s delay cools down the Gmail connection window.
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = validEmails.slice(i, i + BATCH_SIZE);

      for (const email of batch) {
        const success = await sendWithRetry(email);
        if (success) {
          sentCount++;
          console.log(`[${sentCount}/${total}] Sent to ${email}`);
        } else {
          failedEmails.push(email);
          console.log(`[${sentCount + 1}/${total}] FAILED to ${email} after ${MAX_RETRIES} retries`);
        }
      }

      console.log(`Batch complete. Waiting ${BATCH_DELAY_MS / 1000}s...`);
      console.log(`Progress: ${sentCount}/${total} delivered`);

      if (i + BATCH_SIZE < total) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    const summary =
      failedEmails.length === 0
        ? `All ${sentCount} emails sent successfully.`
        : `${sentCount} sent, ${failedEmails.length} failed permanently after ${MAX_RETRIES} retries.`;

    console.log(`Campaign finished: ${summary}`);

    return NextResponse.json({
      success: true,
      message: `Campaign completed: ${summary}`,
      stats: { total, sent: sentCount, failed: failedEmails.length },
    });

  } catch (error) {
    console.error('Send email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
