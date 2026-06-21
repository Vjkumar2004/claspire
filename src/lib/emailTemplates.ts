export type TemplateType = 'job' | 'internship' | 'referral' | 'community' | 'digest' | 'custom'

export interface JobFormData {
  companyName: string
  jobTitle: string
  eligibility: string
  skills: string
  location: string
  batch: string
  experience: string
  applyUrl: string
  notes: string
}

export interface CommunityFormData {
  title: string
  body: string
  linkUrl: string
  linkText: string
}

export type TemplateFormData = JobFormData | CommunityFormData

const CLASPIRE_HEADER = `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
  <tr>
    <td style="padding:28px 32px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="width:52px; vertical-align:middle;">
            <img
              src="https://claspire.in/claspire-logo.jpeg"
              alt=""
              width="48"
              height="48"
              style="display:block; width:48px; height:48px; border-radius:50%; border:0; outline:none;"
            />
          </td>
          <td style="vertical-align:middle; padding-left:14px;">
            <p style="margin:0; font-size:18px; font-weight:700; color:#111111; line-height:1.2; font-family:Arial,Helvetica,sans-serif;">
              cl<span style="color:#7c3aed;">aspire</span>
            </p>
            <p style="margin:2px 0 0 0; font-size:13px; color:#6b7280; font-weight:400; line-height:1.3; font-family:Arial,Helvetica,sans-serif;">
              Student Community Platform
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:0; height:1px; background:#e5e7eb; font-size:1px; line-height:1px;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`

const CLASPIRE_FOOTER = `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
  <tr>
    <td style="text-align:center;">
      <p style="margin:0 0 4px 0; font-size:14px; font-weight:600; color:#111827; font-family:Arial,Helvetica,sans-serif;">
        Team Claspire
      </p>
      <p style="margin:0 0 16px 0; font-size:13px; color:#6b7280; line-height:1.6; font-family:Arial,Helvetica,sans-serif;">
        Helping students discover opportunities, referrals, and career insights.
      </p>
      <p style="margin:0 0 14px 0; font-size:14px; font-family:Arial,Helvetica,sans-serif;">
        <a href="https://claspire.in" target="_blank" style="color:#7c3aed; text-decoration:none; font-weight:600;">Visit Claspire &rarr;</a>
      </p>
      <p style="margin:0; font-size:13px; font-family:Arial,Helvetica,sans-serif;">
        <a href="https://claspire.in" target="_blank" style="color:#7c3aed; text-decoration:none; font-weight:500;">Website</a>
        &nbsp;&middot;&nbsp;
        <a href="https://linkedin.com/company/claspire" target="_blank" style="color:#7c3aed; text-decoration:none; font-weight:500;">LinkedIn</a>
        &nbsp;&middot;&nbsp;
        <a href="https://instagram.com/claspire" target="_blank" style="color:#7c3aed; text-decoration:none; font-weight:500;">Instagram</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:hello@claspire.in" target="_blank" style="color:#7c3aed; text-decoration:none; font-weight:500;">Email</a>
      </p>
    </td>
  </tr>
</table>
`

function wrapInEmailLayout(bodyHtml: string): string {
  return `
<div style="background-color:#f9fafb; padding:24px 0; font-family:Arial, Helvetica, sans-serif;">
  <table align="center" role="presentation" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; margin:0 auto;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; background:#ffffff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:0;">
              ${CLASPIRE_HEADER}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 0;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="padding:0; height:1px; background:#e5e7eb;"></td>
                </tr>
              </table>
              ${CLASPIRE_FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
`
}

function ctaButton(url: string, label: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin:32px 0 28px;">
  <tr>
    <td style="text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="border-radius:12px; text-align:center; padding:0; background:#7c3aed; background:linear-gradient(90deg,#7c3aed,#8b5cf6);">
            <a href="${url}" target="_blank" style="display:inline-block; padding:16px 0; width:220px; font-size:15px; font-weight:700; color:#ffffff; border-radius:12px; text-decoration:none; line-height:1; font-family:Arial,Helvetica,sans-serif; text-align:center; box-sizing:border-box;">
              ${label} &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`
}

function notesBox(text: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; background:#faf5ff; border:1px solid #e9d5ff; border-radius:16px; margin:24px 0;">
  <tr>
    <td style="padding:24px; font-size:14px; line-height:1.6; color:#6b7280; font-family:Arial,Helvetica,sans-serif;">
      📌 ${text}
    </td>
  </tr>
</table>
`
}

export function generateSubject(type: TemplateType, data: TemplateFormData): string {
  switch (type) {
    case 'job':
    case 'internship': {
      const d = data as JobFormData
      return `${d.jobTitle} at ${d.companyName} | Claspire`
    }
    case 'referral': {
      const d = data as JobFormData
      return `Referral: ${d.jobTitle} at ${d.companyName} | Claspire`
    }
    case 'community': {
      const d = data as CommunityFormData
      return d.title || 'Community Update | Claspire'
    }
    case 'digest':
      return 'Weekly Opportunity Digest | Claspire'
    default:
      return ''
  }
}

function generateJobBody(data: JobFormData, type: TemplateType): string {
  const isReferral = type === 'referral'
  const badgeText = isReferral ? '🔗 Referral Opportunity' : '💼 Opportunity Alert'
  const introText = isReferral
    ? 'A new referral opportunity has been spotted that may be relevant to students and fresh graduates.'
    : 'A new opportunity has been spotted that may be relevant to students and fresh graduates.'

  const leftItems: { icon: string; label: string; value: string }[] = []
  if (data.companyName) leftItems.push({ icon: '🏢', label: 'Company', value: data.companyName })
  if (data.eligibility) leftItems.push({ icon: '✅', label: 'Eligibility', value: data.eligibility })
  if (data.location) leftItems.push({ icon: '📍', label: 'Location', value: data.location })
  if (data.experience) leftItems.push({ icon: '💼', label: 'Experience', value: data.experience })

  const rightItems: { icon: string; label: string; value: string }[] = []
  if (data.jobTitle) rightItems.push({ icon: '🎯', label: 'Role', value: data.jobTitle })
  if (data.skills) rightItems.push({ icon: '💻', label: 'Skills', value: data.skills })
  if (data.batch) rightItems.push({ icon: '📅', label: 'Batch', value: data.batch })

  const leftHtml = leftItems.map(i =>
    `<tr><td style="padding:7px 0; font-size:14px; color:#111827; line-height:1.5; font-family:Arial,Helvetica,sans-serif;">${i.icon} <strong style="color:#7c3aed;">${i.label}:</strong> ${i.value}</td></tr>`
  ).join('')

  const rightHtml = rightItems.map(i =>
    `<tr><td style="padding:7px 0; font-size:14px; color:#111827; line-height:1.5; font-family:Arial,Helvetica,sans-serif;">${i.icon} <strong style="color:#7c3aed;">${i.label}:</strong> ${i.value}</td></tr>`
  ).join('')

  const detailsHtml = `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; background:#fafafa; border:1px solid #eeeeee; border-radius:16px; margin:24px 0;">
  <tr>
    <td style="padding:28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="width:50%; vertical-align:top; padding-right:16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              ${leftHtml}
            </table>
          </td>
          <td style="width:50%; vertical-align:top; padding-left:16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
              ${rightHtml}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`

  const notesHtml = data.notes ? notesBox(data.notes) : ''

  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:16px;">
  <tr>
    <td>
      <span style="display:inline-block; background:#f3e8ff; color:#7c3aed; font-size:13px; font-weight:600; padding:8px 16px; border-radius:999px; font-family:Arial,Helvetica,sans-serif;">${badgeText}</span>
    </td>
  </tr>
</table>

<h2 style="margin:16px 0 12px 0; font-size:28px; font-weight:700; color:#111827; line-height:1.2; font-family:Arial,Helvetica,sans-serif;">
  ${data.jobTitle} at ${data.companyName}
</h2>

<p style="margin:0 0 20px 0; font-size:18px; line-height:1.7; color:#6b7280; font-family:Arial,Helvetica,sans-serif;">
  ${introText}
</p>

${detailsHtml}

${notesHtml}

<p style="margin:24px 0 0 0; font-size:15px; line-height:1.8; color:#374151; font-family:Arial,Helvetica,sans-serif;">
  If you're actively exploring internships, jobs, or career opportunities, this may be worth checking out.
</p>

<p style="margin:12px 0 0 0; font-size:15px; line-height:1.8; color:#374151; font-family:Arial,Helvetica,sans-serif;">
  We've included the official application link below so you can review the details directly from the employer.
</p>

${data.applyUrl ? ctaButton(data.applyUrl, 'View Opportunity') : ''}
`
}

function generateCommunityBody(data: CommunityFormData): string {
  const linkSection = data.linkUrl
    ? ctaButton(data.linkUrl, data.linkText || 'Learn More')
    : ''

  const bodyHtml = data.body
    ? data.body.split('\n').map(line => `<p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#6b7280; font-family:Arial,Helvetica,sans-serif;">${line}</p>`).join('')
    : ''

  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:20px;">
  <tr>
    <td>
      <span style="display:inline-block; background:#f3e8ff; color:#7c3aed; font-size:13px; font-weight:600; padding:8px 16px; border-radius:999px; font-family:Arial,Helvetica,sans-serif;">📢 Community Update</span>
    </td>
  </tr>
</table>

<h2 style="margin:0 0 16px 0; font-size:22px; font-weight:700; color:#111827; line-height:1.35; font-family:Arial,Helvetica,sans-serif;">
  ${data.title || 'Community Update'}
</h2>

${bodyHtml}

${linkSection}
`
}

function generateDigestBody(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:20px;">
  <tr>
    <td>
      <span style="display:inline-block; background:#f3e8ff; color:#7c3aed; font-size:13px; font-weight:600; padding:8px 16px; border-radius:999px; font-family:Arial,Helvetica,sans-serif;">📬 Weekly Digest</span>
    </td>
  </tr>
</table>

<h2 style="margin:0 0 16px 0; font-size:22px; font-weight:700; color:#111827; line-height:1.35; font-family:Arial,Helvetica,sans-serif;">
  Weekly Opportunity Digest
</h2>

<p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#6b7280; font-family:Arial,Helvetica,sans-serif;">
  Here's a roundup of the latest opportunities handpicked for the Claspire community this week.
</p>

<p style="margin:0 0 12px 0; font-size:15px; line-height:1.6; color:#6b7280; font-family:Arial,Helvetica,sans-serif;">
  New job postings, referral opportunities, and community updates are waiting for you. Head over to Claspire to explore the full list.
</p>

${ctaButton('https://claspire.in', 'Explore Opportunities')}
`
}

export function generateHtml(type: TemplateType, data: TemplateFormData): string {
  let bodyHtml: string

  switch (type) {
    case 'job':
    case 'internship':
    case 'referral':
      bodyHtml = generateJobBody(data as JobFormData, type)
      break
    case 'community':
      bodyHtml = generateCommunityBody(data as CommunityFormData)
      break
    case 'digest':
      bodyHtml = generateDigestBody()
      break
    default:
      bodyHtml = ''
  }

  return wrapInEmailLayout(bodyHtml)
}

export function generatePreviewText(type: TemplateType, data: TemplateFormData): string {
  switch (type) {
    case 'job':
    case 'internship':
    case 'referral': {
      const d = data as JobFormData
      const isReferral = type === 'referral'
      return [
        '💼 Opportunity Alert',
        '',
        `${d.jobTitle} at ${d.companyName}`,
        '',
        'Key Highlights',
        d.eligibility ? `  ✅ Eligibility: ${d.eligibility}` : null,
        d.skills ? `  ✅ Skills: ${d.skills}` : null,
        d.location ? `  ✅ Location: ${d.location}` : null,
        d.experience ? `  ✅ Experience: ${d.experience}` : null,
        d.batch ? `  ✅ Batch: ${d.batch}` : null,
        '',
        d.notes || null,
        '',
        `A new ${isReferral ? 'referral opportunity' : 'opening'} has been spotted that may be relevant to students and fresh graduates.`,
        '',
        'If you\'re actively exploring new roles, this may be worth checking out.',
        '',
        d.applyUrl ? `View Opportunity: ${d.applyUrl}` : null,
      ].filter(Boolean).join('\n')
    }
    case 'community': {
      const d = data as CommunityFormData
      const lines = [
        '📢 Community Update',
        '',
        d.title || '',
        '',
        d.body || '',
      ]
      if (d.linkUrl) {
        lines.push('', `${d.linkText || 'Learn More'}: ${d.linkUrl}`)
      }
      return lines.join('\n')
    }
    case 'digest':
      return [
        '📬 Weekly Opportunity Digest',
        '',
        'Here\'s a roundup of the latest opportunities handpicked for the Claspire community this week.',
        '',
        'New job postings, referral opportunities, and community updates are waiting for you.',
        '',
        'Explore Opportunities: https://claspire.in',
      ].join('\n')
    default:
      return ''
  }
}
