'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EmailEditor } from '@/components/admin/email/EmailEditor';
import DirectOutreach from '@/components/admin/email/DirectOutreach';
import { Mail, Send, AlertCircle, Loader2, Eye, FileText, ArrowRight } from 'lucide-react';
import { generateSubject, generateHtml, generatePreviewText, wrapEmailTemplate, type TemplateType, type TemplateFormData, type JobFormData, type CommunityFormData } from '@/lib/emailTemplates';

const emptyJobForm: JobFormData = {
  companyName: '',
  jobTitle: '',
  eligibility: '',
  skills: '',
  location: '',
  batch: '',
  experience: '',
  applyUrl: '',
  notes: '',
  ctaText: '',
  ctaUrl: '',
};

const emptyCommunityForm: CommunityFormData = {
  title: '',
  body: '',
  ctaText: '',
  ctaUrl: '',
};

export default function AdminEmailCampaignsPage() {
  const [mode, setMode] = useState<'campaign' | 'outreach'>('campaign');
  const [templateType, setTemplateType] = useState<TemplateType>('job');
  const [subject, setSubject] = useState('');
  const [jobForm, setJobForm] = useState<JobFormData>({ ...emptyJobForm });
  const [communityForm, setCommunityForm] = useState<CommunityFormData>({ ...emptyCommunityForm });
  const [customHtml, setCustomHtml] = useState('');
  const [customCtaText, setCustomCtaText] = useState('');
  const [customCtaUrl, setCustomCtaUrl] = useState('');

  const [audienceType, setAudienceType] = useState('all');
  const [collegeId, setCollegeId] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);

  const [customRecipientIds, setCustomRecipientIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any[]>([]);

  const [testEmail, setTestEmail] = useState('');
  const [hasTestSent, setHasTestSent] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const currentFormData = useMemo<TemplateFormData>(() => {
    switch (templateType) {
      case 'job':
      case 'internship':
      case 'referral':
        return jobForm;
      case 'community':
        return communityForm;
      default:
        return jobForm;
    }
  }, [templateType, jobForm, communityForm]);

  const generatedSubject = useMemo(() => {
    if (templateType === 'custom') return subject;
    const auto = generateSubject(templateType, currentFormData);
    return subject || auto;
  }, [templateType, currentFormData, subject]);

  const isFormValid = useMemo(() => {
    const ctaValid = (d: { ctaText: string; ctaUrl: string }) => {
      const hasText = d.ctaText.trim().length > 0
      const hasUrl = d.ctaUrl.trim().length > 0
      return hasText === hasUrl // both empty or both filled
    }

    if (templateType === 'custom') {
      const hasText = customCtaText.trim().length > 0
      const hasUrl = customCtaUrl.trim().length > 0
      return generatedSubject.trim().length > 0 && customHtml.trim().length > 0 && hasText === hasUrl && (audienceType !== 'custom' || customRecipientIds.length > 0);
    }
    if (templateType === 'digest') {
      return generatedSubject.trim().length > 0;
    }
    if (templateType === 'community') {
      const d = communityForm;
      return generatedSubject.trim().length > 0 && (d.title.trim().length > 0 || d.body.trim().length > 0) && ctaValid(d);
    }
    const d = jobForm;
    return generatedSubject.trim().length > 0 && d.companyName.trim().length > 0 && d.jobTitle.trim().length > 0 && d.applyUrl.trim().length > 0 && ctaValid(d);
  }, [templateType, generatedSubject, jobForm, communityForm, customHtml, customCtaText, customCtaUrl, audienceType, customRecipientIds]);

  const previewText = useMemo(() => {
    if (templateType === 'custom') return '';
    return generatePreviewText(templateType, currentFormData);
  }, [templateType, currentFormData]);

  const previewHtml = useMemo(() => {
    if (templateType === 'custom') return '';
    return generateHtml(templateType, currentFormData);
  }, [templateType, currentFormData]);

  const finalHtmlContent = useMemo(() => {
    if (templateType === 'custom') return wrapEmailTemplate(customHtml, { ctaText: customCtaText, ctaUrl: customCtaUrl });
    return generateHtml(templateType, currentFormData);
  }, [templateType, currentFormData, customHtml, customCtaText, customCtaUrl]);

  const handleTemplateChange = useCallback((newType: TemplateType) => {
    setTemplateType(newType);
    setHasTestSent(false);
    setMessage(null);

    if (newType === 'job') {
      setJobForm(prev => ({ ...prev, ctaText: 'View Opportunity →', ctaUrl: '' }));
    } else if (newType === 'internship') {
      setJobForm(prev => ({ ...prev, ctaText: 'View Opportunity →', ctaUrl: '' }));
    } else if (newType === 'referral') {
      setJobForm(prev => ({ ...prev, ctaText: 'View Referral →', ctaUrl: '' }));
    } else if (newType === 'community') {
      setCommunityForm(prev => ({ ...prev, ctaText: '🚀 Help Your Juniors', ctaUrl: '' }));
    }
  }, []);

  const updateJobField = useCallback((field: keyof JobFormData, value: string) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateCommunityField = useCallback((field: keyof CommunityFormData, value: string) => {
    setCommunityForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Debounce fetching recipient count
  useEffect(() => {
    if (audienceType === 'custom') {
      setRecipientCount(customRecipientIds.length);
      return;
    }

    const fetchCount = async () => {
      setIsCounting(true);
      try {
        const res = await fetch('/api/admin/email-audience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audienceType, collegeId })
        });
        const data = await res.json();
        if (res.ok) {
          setRecipientCount(data.count);
        } else {
          setRecipientCount(0);
        }
      } catch (err) {
        console.error(err);
        setRecipientCount(0);
      } finally {
        setIsCounting(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCount();
    }, 500);

    return () => clearTimeout(timer);
  }, [audienceType, collegeId, customRecipientIds]);

  // Debounce user search
  useEffect(() => {
    if (audienceType !== 'custom' || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults((data.users || []).filter((u: any) => !customRecipientIds.includes(u.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, audienceType, customRecipientIds]);

  const addRecipient = (user: any) => {
    if (customRecipientIds.includes(user.id)) return;
    setCustomRecipientIds(prev => [...prev, user.id]);
    setSelectedUserDetails(prev => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeRecipient = (userId: string) => {
    setCustomRecipientIds(prev => prev.filter(id => id !== userId));
    setSelectedUserDetails(prev => prev.filter(u => u.id !== userId));
  };

  const handleSendTest = async () => {
    if (!testEmail || !generatedSubject || !finalHtmlContent) {
      setMessage({ type: 'error', text: 'Subject, Content, and Test Email are required' });
      return;
    }

    setIsSendingTest(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: generatedSubject,
          htmlContent: finalHtmlContent,
          isTest: true,
          testEmail,
          audienceType,
          collegeId,
          recipientIds: audienceType === 'custom' ? customRecipientIds : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setHasTestSent(true);
        setMessage({ type: 'success', text: 'Test email sent successfully! Please verify it in your inbox.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test email' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!hasTestSent) {
      setMessage({ type: 'error', text: 'You must send a successful test email before dispatching the campaign.' });
      return;
    }

    if (recipientCount !== null && recipientCount > 100) {
      setMessage({ type: 'error', text: `Campaign limited to 100 recipients maximum. You selected ${recipientCount}. Reduce the audience size or split into multiple campaigns.` });
      return;
    }

    const confirmSend = window.confirm(
      `WARNING: You are about to send this email to ${recipientCount} recipients. This action cannot be undone.\n\nAre you sure you want to proceed?`
    );

    if (!confirmSend) return;

    setIsSendingCampaign(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: generatedSubject,
          htmlContent: finalHtmlContent,
          isTest: false,
          audienceType,
          collegeId,
          recipientIds: audienceType === 'custom' ? customRecipientIds : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Campaign completed successfully' });
        setSubject('');
        setJobForm({ ...emptyJobForm });
        setCommunityForm({ ...emptyCommunityForm });
        setCustomHtml('');
        setHasTestSent(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send campaign' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const renderTemplateForm = () => {
    if (templateType === 'custom') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Content</label>
            <EmailEditor value={customHtml} onChange={setCustomHtml} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">CTA Button Text <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Learn More →"
                value={customCtaText}
                onChange={e => setCustomCtaText(e.target.value)}
              />
              {(customCtaText.trim().length > 0) !== (customCtaUrl.trim().length > 0) && (
                <p className="text-xs text-red-500">Both CTA text and URL must be filled, or both left empty.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CTA Button URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://"
                value={customCtaUrl}
                onChange={e => setCustomCtaUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      );
    }

    if (templateType === 'digest') {
      return (
        <div className="rounded-lg bg-[#EAF4FF] dark:bg-purple-900/10 border border-[#0A66C2]/20 dark:border-purple-900/30 p-4">
          <p className="text-sm text-[#004182] dark:text-purple-300 font-medium">Weekly Digest</p>
          <p className="text-xs text-[#0A66C2] dark:text-purple-400 mt-1">
            A pre-formatted weekly digest will be sent with a roundup of the latest opportunities.
            No additional fields required.
          </p>
        </div>
      );
    }

    if (templateType === 'community') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Upcoming Hackathon"
              value={communityForm.title}
              onChange={(e) => updateCommunityField('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              className="flex w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
              placeholder="Write your community update message here..."
              value={communityForm.body}
              onChange={(e) => updateCommunityField('body', e.target.value)}
            />
          </div>

          {/* CTA Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-500 mb-3">Call-To-Action Button (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Button Text</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="🚀 Help Your Juniors"
                  value={communityForm.ctaText}
                  onChange={(e) => updateCommunityField('ctaText', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Button URL</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://"
                  value={communityForm.ctaUrl}
                  onChange={(e) => updateCommunityField('ctaUrl', e.target.value)}
                />
              </div>
            </div>
            {communityForm.ctaText && !communityForm.ctaUrl && (
              <p className="text-xs text-red-500 mt-1">Button URL is required when Button Text is provided.</p>
            )}
            {!communityForm.ctaText && communityForm.ctaUrl && (
              <p className="text-xs text-red-500 mt-1">Button Text is required when Button URL is provided.</p>
            )}
          </div>
        </div>
      );
    }

    // Job / Internship / Referral
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Google"
              value={jobForm.companyName}
              onChange={(e) => updateJobField('companyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {templateType === 'referral' ? 'Role' : 'Job Title'} <span className="text-red-500">*</span>
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Software Engineer Intern"
              value={jobForm.jobTitle}
              onChange={(e) => updateJobField('jobTitle', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Eligibility</label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Freshers Eligible"
              value={jobForm.eligibility}
              onChange={(e) => updateJobField('eligibility', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills</label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. React, Node.js, TypeScript"
              value={jobForm.skills}
              onChange={(e) => updateJobField('skills', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Bangalore"
              value={jobForm.location}
              onChange={(e) => updateJobField('location', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch</label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 2024 / 2025"
              value={jobForm.batch}
              onChange={(e) => updateJobField('batch', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Experience</label>
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 0 – 1 year"
              value={jobForm.experience}
              onChange={(e) => updateJobField('experience', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Apply URL <span className="text-red-500">*</span>
          </label>
          <input
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://"
            value={jobForm.applyUrl}
            onChange={(e) => updateJobField('applyUrl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Notes</label>
          <textarea
            className="flex w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            placeholder="Optional: add any extra context or instructions for students..."
            value={jobForm.notes}
            onChange={(e) => updateJobField('notes', e.target.value)}
          />
        </div>

        {/* CTA Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-500 mb-3">Call-To-Action Button (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Button Text</label>
              <input
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="View Opportunity →"
                value={jobForm.ctaText}
                onChange={(e) => updateJobField('ctaText', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Button URL</label>
              <input
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://"
                value={jobForm.ctaUrl}
                onChange={(e) => updateJobField('ctaUrl', e.target.value)}
              />
            </div>
          </div>
          {jobForm.ctaText && !jobForm.ctaUrl && (
            <p className="text-xs text-red-500 mt-1">Button URL is required when Button Text is provided.</p>
          )}
          {!jobForm.ctaText && jobForm.ctaUrl && (
            <p className="text-xs text-red-500 mt-1">Button Text is required when Button URL is provided.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400">Campaign builder for the Claspire community.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-start gap-3 ${
          message.type === 'error'
            ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
            : 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-200'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('campaign')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'campaign'
              ? 'bg-white dark:bg-[#1D2226] text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📬 Campaigns
        </button>
        <button
          type="button"
          onClick={() => setMode('outreach')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'outreach'
              ? 'bg-white dark:bg-[#1D2226] text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📨 Direct Outreach
        </button>
      </div>

      {mode === 'campaign' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Type Selector */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold">Campaign Type</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'job', label: '💼 Job', desc: 'Full-time roles' },
                  { value: 'internship', label: '📋 Internship', desc: 'Internship openings' },
                  { value: 'referral', label: '🔗 Referral', desc: 'Referral requests' },
                  { value: 'community', label: '📢 Community', desc: 'General updates' },
                  { value: 'digest', label: '📬 Digest', desc: 'Weekly roundup' },
                  { value: 'custom', label: '✏️ Custom', desc: 'Rich text editor' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTemplateChange(opt.value as TemplateType)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      templateType === opt.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
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
              <h2 className="text-xl font-semibold">
                {templateType === 'custom'
                  ? 'Custom Campaign'
                  : templateType === 'digest'
                  ? 'Digest Settings'
                  : 'Opportunity Details'}
              </h2>
              {templateType !== 'custom' && (
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Fields with * are required
                </span>
              )}
            </div>
            <div className="p-6 space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject Line {templateType !== 'custom' && <span className="text-gray-400 font-normal">(auto-generated)</span>}
                </label>
                <input
                  id="subject"
                  placeholder={
                    templateType === 'custom'
                      ? 'e.g. Exciting updates from Claspire!'
                      : 'Leave blank for auto-generated subject'
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={generatedSubject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Template Specific Fields */}
              {renderTemplateForm()}
            </div>
          </div>

          {/* Live Preview */}
          {templateType !== 'custom' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <h2 className="text-lg font-semibold">Live Preview</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showPreview ? 'Show Simplified' : 'Show Full Email'}
                </button>
              </div>
              <div className="p-6">
                {showPreview ? (
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
                    {previewText || 'Fill in the fields above to see a preview.'}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audience Selection */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold">Audience</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter By</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={audienceType}
                  onChange={(e) => {
                    setAudienceType(e.target.value);
                    if (e.target.value !== 'custom') {
                      setCustomRecipientIds([]);
                      setSelectedUserDetails([]);
                    }
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="seniors">Seniors Only</option>
                  <option value="college">Specific College</option>
                  <option value="custom">Custom Recipients</option>
                </select>
              </div>

              {audienceType === 'college' && (
                <div className="space-y-2 border-l-2 border-indigo-500 pl-3 ml-1">
                  <label className="text-sm font-medium">College ID</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter College UUID"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                  />
                </div>
              )}

              {audienceType === 'custom' && (
                <div className="space-y-3 border-l-2 border-indigo-500 pl-3 ml-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Users</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search by name, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-800">
                      {searchResults.map((user: any) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors"
                          onClick={() => addRecipient(user)}
                        >
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-medium text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                            {(user.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{user.full_name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.email}
                              {user.college?.short_name && ` · ${user.college.short_name}`}
                            </div>
                          </div>
                          <span className="text-xs text-indigo-600 font-medium flex-shrink-0">Add</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                    <p className="text-xs text-gray-500">No users found matching your search.</p>
                  )}

                  {selectedUserDetails.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Selected ({selectedUserDetails.length})</label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUserDetails.map((user: any) => (
                          <span
                            key={user.id}
                            className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-2.5 py-1.5 rounded-full"
                          >
                            {user.full_name}
                            <button
                              type="button"
                              className="hover:text-red-500 transition-colors"
                              onClick={() => removeRecipient(user.id)}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {customRecipientIds.length > 0 && <div className="text-xs text-indigo-600 font-medium">Selected {customRecipientIds.length} user{customRecipientIds.length !== 1 && 's'}</div>}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Recipients</span>
                  {isCounting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-xl font-bold">{recipientCount !== null ? recipientCount : '-'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test & Send */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/50">
              <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">Test &amp; Send</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">1. Send Test Email</label>
                <div className="flex gap-2">
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="email"
                    placeholder="admin@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 h-10 px-4 py-2"
                    onClick={handleSendTest}
                    disabled={isSendingTest || !generatedSubject || !finalHtmlContent || !testEmail}
                  >
                    {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">You must send a test email before dispatching the full campaign.</p>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium">2. Dispatch Campaign</label>
                <button
                  className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2"
                  onClick={handleSendCampaign}
                  disabled={!hasTestSent || isSendingCampaign || recipientCount === 0 || !isFormValid}
                >
                  {isSendingCampaign ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending ({recipientCount}) — may take several minutes</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send to {recipientCount || 0} Recipients</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {templateType !== 'custom' && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D2226] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold">Summary</h2>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium capitalize">{templateType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subject</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{generatedSubject || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipients</span>
                  <span className="font-medium">{recipientCount ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Test Sent</span>
                  <span className={`font-medium ${hasTestSent ? 'text-green-600' : 'text-gray-400'}`}>
                    {hasTestSent ? '✅ Yes' : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        <DirectOutreach />
      )}
    </div>
  );
}
