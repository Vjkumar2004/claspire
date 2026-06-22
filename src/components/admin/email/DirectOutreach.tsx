'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { EmailEditor } from '@/components/admin/email/EmailEditor';
import { wrapEmailTemplate } from '@/lib/emailTemplates';
import { Mail, Send, Loader2, AlertCircle, Save, Eye, FileText } from 'lucide-react';

const DRAFT_KEY = 'claspire_direct_outreach_draft';

const OUTREACH_TEMPLATES: Record<string, { subject: string; body: string }> = {
  partnership: {
    subject: 'Partnership Opportunity with Claspire',
    body: `<p>Dear {name},</p>
<p>I hope this message finds you well. I'm reaching out from <strong>Claspire</strong>, a platform dedicated to helping students discover opportunities, referrals, and career insights.</p>
<p>We are always looking to connect with professionals and organizations who share our mission of empowering the next generation of talent. I believe there could be a meaningful partnership opportunity between us.</p>
<p>Would you be open to a brief conversation about how we might collaborate?</p>
<p>Looking forward to hearing from you.</p>
<p>Best regards,<br>Team Claspire</p>`,
  },
  mentor: {
    subject: 'Invitation to Mentor on Claspire',
    body: `<p>Dear {name},</p>
<p>I hope this message finds you well. I'm writing from <strong>Claspire</strong>, a student community platform that connects students with mentors, referrals, and career opportunities.</p>
<p>Given your experience and expertise, I would like to invite you to join our mentor network. As a mentor on Claspire, you can:</p>
<ul>
  <li>Guide students in their career journey</li>
  <li>Share referrals for opportunities at your organization</li>
  <li>Build meaningful connections with aspiring talent</li>
</ul>
<p>Would you be interested in learning more about this opportunity?</p>
<p>Thank you for your consideration.</p>
<p>Best regards,<br>Team Claspire</p>`,
  },
  professor: {
    subject: 'Connecting with Claspire for Student Opportunities',
    body: `<p>Dear {name},</p>
<p>I hope this message finds you well. I'm reaching out from <strong>Claspire</strong>, a platform built to help students discover internships, job opportunities, referrals, and community events.</p>
<p>We are currently expanding our network and would love to collaborate with you to provide better career resources for your students. Claspire offers:</p>
<ul>
  <li>Curated job and internship listings</li>
  <li>Referral opportunities from alumni and professionals</li>
  <li>Community events and workshops</li>
</ul>
<p>Would you be open to exploring how Claspire can support your students' career development?</p>
<p>Looking forward to connecting.</p>
<p>Warm regards,<br>Team Claspire</p>`,
  },
  community: {
    subject: 'Join the Claspire Community',
    body: `<p>Hi {name},</p>
<p>I hope you're doing well. I'm writing to invite you to join <strong>Claspire</strong> — a growing community where students and professionals connect over opportunities, referrals, and career growth.</p>
<p>By joining Claspire, you'll be part of a network that:</p>
<ul>
  <li>Shares internships and job openings</li>
  <li>Provides referrals and mentorship</li>
  <li>Hosts community events and discussions</li>
</ul>
<p>We'd love to have you on board. Signing up takes just a minute.</p>
<p>Looking forward to seeing you in the community!</p>
<p>Best,<br>Team Claspire</p>`,
  },
};

export default function DirectOutreach() {
  const [form, setForm] = useState({
    email: '',
    name: '',
    subject: '',
    templateType: 'custom' as string,
    htmlContent: '',
    ctaText: '',
    ctaUrl: '',
  });

  const [previewMode, setPreviewMode] = useState<'simplified' | 'full'>('simplified');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [remainingDaily, setRemainingDaily] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const loadedRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm(prev => ({ ...prev, ...parsed }));
        setHasDraft(true);
      }
    } catch {
      // ignore corrupt draft
    }
  }, []);

  // Auto-save draft on form changes (debounced)
  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setHasDraft(true);
      } catch {
        // storage full or unavailable
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [form]);

  const handleField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyTemplate = useCallback((type: string) => {
    if (type === 'custom') {
      setForm(prev => ({ ...prev, templateType: type }));
      return;
    }
    const tpl = OUTREACH_TEMPLATES[type];
    if (!tpl) return;
    setForm(prev => ({
      ...prev,
      templateType: type,
      subject: tpl.subject,
      htmlContent: tpl.body,
    }));
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch { /* ignore */ }
    setForm({
      email: '',
      name: '',
      subject: '',
      templateType: 'custom',
      htmlContent: '',
      ctaText: '',
      ctaUrl: '',
    });
    setHasDraft(false);
    setMessage(null);
  }, []);

  const isFormValid = useMemo(() => {
    return form.email.trim().length > 0
      && form.subject.trim().length > 0
      && form.htmlContent.trim().length > 0;
  }, [form]);

  const ctaValid = useMemo(() => {
    const hasText = form.ctaText.trim().length > 0;
    const hasUrl = form.ctaUrl.trim().length > 0;
    return hasText === hasUrl;
  }, [form.ctaText, form.ctaUrl]);

  const previewHtml = useMemo(() => {
    const personalized = form.htmlContent.replace(/\{name\}/g, form.name || 'there');
    return wrapEmailTemplate(personalized, {
      ctaText: form.ctaText || undefined,
      ctaUrl: form.ctaUrl || undefined,
    });
  }, [form.htmlContent, form.name, form.ctaText, form.ctaUrl]);

  const doSend = async (isTest: boolean, testEmailValue?: string) => {
    setIsSending(!isTest);
    setIsSendingTest(isTest);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/send-direct-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name || undefined,
          subject: form.subject,
          htmlContent: form.htmlContent,
          ctaText: form.ctaText || undefined,
          ctaUrl: form.ctaUrl || undefined,
          isTest,
          testEmail: isTest ? testEmailValue : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || (isTest ? 'Test sent' : 'Email sent') });
        if (data.remaining !== undefined) setRemainingDaily(data.remaining);
        if (!isTest) clearDraft();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSending(false);
      setIsSendingTest(false);
    }
  };

  const [testEmail, setTestEmail] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Template Type Selector */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold">Outreach Type</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: 'custom', label: '✏️ Custom', desc: 'Write your own' },
                { value: 'partnership', label: '🤝 Partnership', desc: 'Partnership request' },
                { value: 'mentor', label: '🎓 Mentor', desc: 'Mentor invitation' },
                { value: 'professor', label: '🏫 Professor', desc: 'Professor outreach' },
                { value: 'community', label: '🌐 Community', desc: 'Community invite' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => applyTemplate(opt.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    form.templateType === opt.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-transparent'
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Composer */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Compose Message</h2>
            {hasDraft && (
              <button
                type="button"
                onClick={clearDraft}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Clear Draft
              </button>
            )}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="mentor@example.com"
                  value={form.email}
                  onChange={e => handleField('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Recipient Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ahidar"
                  value={form.name}
                  onChange={e => handleField('name', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. Partnership Opportunity with Claspire"
                value={form.subject}
                onChange={e => handleField('subject', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Message Body <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1">Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{`{name}`}</code> to personalize the greeting.</p>
              <EmailEditor value={form.htmlContent} onChange={v => handleField('htmlContent', v)} />
            </div>

            {/* CTA Section */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-medium mb-3">Call-To-Action Button <span className="text-gray-400 font-normal">(optional)</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Button Text</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Visit Claspire"
                    value={form.ctaText}
                    onChange={e => handleField('ctaText', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Button URL</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://claspire.in"
                    value={form.ctaUrl}
                    onChange={e => handleField('ctaUrl', e.target.value)}
                  />
                </div>
              </div>
              {(form.ctaText.trim().length > 0) !== (form.ctaUrl.trim().length > 0) && (
                <p className="text-xs text-red-500 mt-2">Both CTA text and URL must be filled, or both left empty.</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <h2 className="text-lg font-semibold">Live Preview</h2>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMode(m => m === 'simplified' ? 'full' : 'simplified')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              {previewMode === 'full' ? 'Show Simplified' : 'Show Full Email'}
            </button>
          </div>
          <div className="p-6">
            {previewMode === 'full' ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-full">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Email Preview</span>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full bg-white"
                  style={{ minHeight: '400px', border: 'none' }}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-[400px] overflow-y-auto">
                {form.htmlContent
                  ? form.htmlContent.replace(/<[^>]+>/g, '').replace(/\{name\}/g, form.name || 'there').trim()
                  : 'Compose a message above to see the preview.'}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Rate Limit Info */}
        {remainingDaily !== null && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
            <div className="p-4 text-sm">
              <span className="text-gray-500">Daily remaining: </span>
              <span className={`font-semibold ${remainingDaily <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                {remainingDaily} / 20
              </span>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
              : 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-200'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Actions */}
        <div className="rounded-xl border border-purple-100 dark:border-purple-900/50 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
          <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/50">
            <h2 className="text-xl font-semibold text-purple-700 dark:text-purple-400">Send</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Email</label>
              <div className="flex gap-2">
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  type="email"
                  placeholder="admin@example.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 h-10 px-4 py-2"
                  onClick={() => doSend(true, testEmail)}
                  disabled={isSendingTest || !isFormValid || !ctaValid || !testEmail}
                >
                  {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 h-10 px-4 py-2"
                onClick={() => {
                  try {
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
                    setHasDraft(true);
                    setMessage({ type: 'success', text: 'Draft saved!' });
                  } catch {
                    setMessage({ type: 'error', text: 'Failed to save draft' });
                  }
                }}
                disabled={!form.email && !form.htmlContent}
              >
                <Save className="w-4 h-4 mr-1.5" /> Draft
              </button>
              <button
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2"
                onClick={() => doSend(false)}
                disabled={isSending || !isFormValid || !ctaValid}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold">Summary</h2>
          </div>
          <div className="p-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">To</span>
              <span className="font-medium truncate max-w-[180px]">{form.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient</span>
              <span className="font-medium truncate max-w-[180px]">{form.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Subject</span>
              <span className="font-medium truncate max-w-[180px]">{form.subject || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium capitalize">{form.templateType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CTA</span>
              <span className="font-medium">{form.ctaText ? '✅' : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
