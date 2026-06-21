import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';
import { Resend } from 'resend';
import { sanitizeEmailHtml } from '@/lib/sanitizeEmailHtml';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "Email content is required"),
  isTest: z.boolean().default(false),
  testEmail: z.string().email().optional().or(z.literal('')),
  audienceType: z.enum(['all', 'students', 'seniors', 'college']),
  collegeId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if ('error' in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const body = await req.json();
    const result = sendEmailSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data', details: result.error.issues }, { status: 400 });
    }

    const { subject, htmlContent, isTest, testEmail, audienceType, collegeId } = result.data;
    
    const cleanHtml = sanitizeEmailHtml(htmlContent);

    if (isTest) {
      if (!testEmail) {
        return NextResponse.json({ error: 'Test email is required for test sends' }, { status: 400 });
      }
      
      const { data, error } = await resend.emails.send({
        from: 'Updates <updates@mail.claspire.in>',
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

    const BATCH_SIZE = 90;
    const batches = [];
    
    for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
      const chunk = validEmails.slice(i, i + BATCH_SIZE);
      batches.push({
        from: 'Updates <updates@mail.claspire.in>',
        to: chunk,
        subject: subject,
        html: cleanHtml,
      });
    }

    const { data: resendData, error: resendError } = await resend.batch.send(batches);

    if (resendError) {
      console.error('Resend batch error:', resendError);
      return NextResponse.json({ error: 'Failed to send campaign batch' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully queued emails for ${validEmails.length} recipients.` 
    });

  } catch (error) {
    console.error('Send email API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
