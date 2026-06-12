export const CURRENT_VERSION = 1

export type CertificationItem = {
  name: string
  issuer?: string
  year?: string
}

export type ProjectItem = {
  title: string
  description?: string
  github_url?: string
  live_url?: string
  tech_stack?: string[]
}

export type AreasLookingFor = {
  internship: boolean
  job_referral: boolean
  mentor: boolean
  startup_team: boolean
}

export type MentorshipOptions = {
  available_for_mentorship: boolean
  available_for_referrals: boolean
  available_for_mock_interviews: boolean
}

export type SocialLinks = {
  linkedin?: string
  github?: string
  portfolio?: string
  website?: string
  twitter?: string
  leetcode?: string
  codeforces?: string
}

export type StudentProfileExtras = {
  skills: string[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
  resume_url?: string
  areas_looking_for: AreasLookingFor
  social_links?: SocialLinks
}

export type SeniorProfileExtras = {
  industry?: string
  experience_years?: number
  skills: string[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
  resume_url?: string
  mentorship: MentorshipOptions
  social_links?: SocialLinks
}

export type UserProfileData = {
  version?: number
  student?: Partial<StudentProfileExtras>
  senior?: Partial<SeniorProfileExtras>
}

export const DEFAULT_AREAS: AreasLookingFor = {
  internship: false,
  job_referral: false,
  mentor: false,
  startup_team: false,
}

export const DEFAULT_MENTORSHIP: MentorshipOptions = {
  available_for_mentorship: false,
  available_for_referrals: false,
  available_for_mock_interviews: false,
}

const PROFILE_MARKER = '\n\n<!-- claspire-profile:v1 -->'

export function parseProfileData(raw: unknown): UserProfileData {
  if (!raw || typeof raw !== 'object') return {}
  if (typeof raw === 'string') {
    try {
      return parseProfileData(JSON.parse(raw))
    } catch {
      return {}
    }
  }
  return raw as UserProfileData
}

function hasProfileContent(data: UserProfileData): boolean {
  return !!(data.student || data.senior)
}

export function stripProfileFromBio(bio: string): string {
  const idx = bio.indexOf(PROFILE_MARKER)
  return idx === -1 ? bio.trim() : bio.slice(0, idx).trim()
}

export function extractProfileFromBio(bio: string): UserProfileData {
  const idx = bio.indexOf(PROFILE_MARKER)
  if (idx === -1) return {}
  try {
    return parseProfileData(JSON.parse(bio.slice(idx + PROFILE_MARKER.length)))
  } catch {
    return {}
  }
}

export function embedProfileInBio(bio: string, profileData: UserProfileData): string {
  const clean = stripProfileFromBio(bio)
  if (!hasProfileContent(profileData)) return clean
  return `${clean}${PROFILE_MARKER}${JSON.stringify(profileData)}`
}

/** Migrate raw profile_data to latest schema version */
export function migrateProfileData(data: unknown): UserProfileData {
  const base = parseProfileData(data)
  if (!hasProfileContent(base)) return { version: CURRENT_VERSION }

  const version = base.version || 0
  if (version >= CURRENT_VERSION) return base

  let result: Record<string, unknown> = { ...base }

  if (version < 1) {
    const student = result.student ? { ...(result.student as Record<string, unknown>) } : undefined
    const senior = result.senior ? { ...(result.senior as Record<string, unknown>) } : undefined

    if (student) {
      const social: SocialLinks = { ...((student.social_links as SocialLinks) || {}) }
      if (student.github_url && !social.github) {
        social.github = student.github_url as string
      }
      delete student.github_url

      if (student.projects) {
        student.projects = (student.projects as Array<Record<string, unknown>>).map((p) => {
          const next = { ...p }
          if (p.link && !p.github_url) {
            next.github_url = p.link
          }
          delete next.link
          return next
        })
      }
      student.social_links = social
      result.student = student
    }

    if (senior) {
      const social: SocialLinks = { ...((senior.social_links as SocialLinks) || {}) }
      if (senior.github_url && !social.github) {
        social.github = senior.github_url as string
      }
      if (senior.portfolio_url && !social.portfolio) {
        social.portfolio = senior.portfolio_url as string
      }
      delete senior.github_url
      delete senior.portfolio_url
      senior.social_links = social
      result.senior = senior
    }

    result.version = 1
  }

  return result as unknown as UserProfileData
}

/** Read profile extras from profile_data column (migrated), or legacy bio embed when column is empty. */
export function resolveProfileData(user: {
  profile_data?: unknown
  bio?: string | null
}): UserProfileData {
  const fromColumn = parseProfileData(user.profile_data)
  if (hasProfileContent(fromColumn)) return migrateProfileData(fromColumn)
  const legacy = extractProfileFromBio(user.bio || '')
  return migrateProfileData(legacy)
}

/** Bio text shown on profile (strips embedded JSON payload). */
export function resolveDisplayBio(bio?: string | null): string {
  return stripProfileFromBio(bio || '')
}

export const MENTORSHIP_LABELS: Record<keyof MentorshipOptions, string> = {
  available_for_mentorship: 'Available for Mentorship',
  available_for_referrals: 'Available for Referrals',
  available_for_mock_interviews: 'Available for Mock Interviews',
}

export const AREAS_LOOKING_LABELS: Record<keyof AreasLookingFor, string> = {
  internship: 'Internship',
  job_referral: 'Job Referral',
  mentor: 'Mentor',
  startup_team: 'Startup Team',
}

export function getStudentExtras(data: UserProfileData): StudentProfileExtras {
  const student = data.student || {}
  const social = student.social_links || {}
  return {
    skills: student.skills || [],
    certifications: student.certifications || [],
    projects: student.projects || [],
    resume_url: student.resume_url || '',
    areas_looking_for: { ...DEFAULT_AREAS, ...(student.areas_looking_for || {}) },
    social_links: social,
  }
}

export function getSeniorExtras(data: UserProfileData): SeniorProfileExtras {
  const senior = data.senior || {}
  const social = senior.social_links || {}
  return {
    industry: senior.industry || '',
    experience_years: senior.experience_years,
    skills: senior.skills || [],
    certifications: senior.certifications || [],
    projects: senior.projects || [],
    resume_url: senior.resume_url || '',
    mentorship: { ...DEFAULT_MENTORSHIP, ...(senior.mentorship || {}) },
    social_links: social,
  }
}

export function mergeStudentExtras(
  current: UserProfileData,
  patch: Partial<StudentProfileExtras>
): UserProfileData {
  return {
    ...current,
    student: { ...getStudentExtras(current), ...patch },
  }
}

export function mergeSeniorExtras(
  current: UserProfileData,
  patch: Partial<SeniorProfileExtras>
): UserProfileData {
  return {
    ...current,
    senior: { ...getSeniorExtras(current), ...patch },
  }
}
