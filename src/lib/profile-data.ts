export type CertificationItem = {
  name: string
  issuer?: string
  year?: string
}

export type ProjectItem = {
  title: string
  description?: string
  link?: string
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

export type StudentProfileExtras = {
  skills: string[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
  github_url?: string
  resume_url?: string
  areas_looking_for: AreasLookingFor
}

export type SeniorProfileExtras = {
  industry?: string
  experience_years?: number
  skills: string[]
  certifications: CertificationItem[]
  portfolio_url?: string
  github_url?: string
  mentorship: MentorshipOptions
}

export type UserProfileData = {
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

/** Read profile extras from profile_data column, or legacy bio embed when column is missing. */
export function resolveProfileData(user: {
  profile_data?: unknown
  bio?: string | null
}): UserProfileData {
  const fromColumn = parseProfileData(user.profile_data)
  if (hasProfileContent(fromColumn)) return fromColumn
  return extractProfileFromBio(user.bio || '')
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
  return {
    skills: data.student?.skills || [],
    certifications: data.student?.certifications || [],
    projects: data.student?.projects || [],
    github_url: data.student?.github_url || '',
    resume_url: data.student?.resume_url || '',
    areas_looking_for: { ...DEFAULT_AREAS, ...(data.student?.areas_looking_for || {}) },
  }
}

export function getSeniorExtras(data: UserProfileData): SeniorProfileExtras {
  return {
    industry: data.senior?.industry || '',
    experience_years: data.senior?.experience_years,
    skills: data.senior?.skills || [],
    certifications: data.senior?.certifications || [],
    portfolio_url: data.senior?.portfolio_url || '',
    github_url: data.senior?.github_url || '',
    mentorship: { ...DEFAULT_MENTORSHIP, ...(data.senior?.mentorship || {}) },
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
