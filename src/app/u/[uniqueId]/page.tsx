'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Linkedin, GraduationCap, Building2, Briefcase, ShieldCheck,
  Github, ExternalLink, Info,
} from 'lucide-react'
import ProfileActionBar from '@/components/profile/ProfileActionBar'
import { getUserActivityStatus } from '@/hooks/useActivityStatus'
import {
  parseProfileData,
  getStudentExtras,
  getSeniorExtras,
  MENTORSHIP_LABELS,
  AREAS_LOOKING_LABELS,
  type MentorshipOptions,
  type AreasLookingFor,
} from '@/lib/profile-data'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const uniqueId = params?.uniqueId as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [viewCount, setViewCount] = useState<number | null>(null)
  const [visitors, setVisitors] = useState<any[]>([])

  useEffect(() => {
    if (uniqueId) fetchPublicProfile()
  }, [uniqueId])

  const fetchPublicProfile = async () => {
    try {
      const res = await fetch(`/api/u/${uniqueId}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) {
        console.log(`[PublicProfilePage] setData — connectionId:${json.connectionId} connectionStatus:${json.connectionStatus}`)
        setData(json)

        // Record profile view (if not own profile)
        if (!json.isOwnProfile) {
          fetch(`/api/profile/${json.user.id}/view`, { method: 'POST' }).catch(() => {})
        }

        // Fetch profile stats
        fetch(`/api/profile/${json.user.id}/stats`).then(r => r.ok && r.json()).then(s => {
          if (s) {
            setViewCount(s.viewCount)
            setVisitors(s.visitors || [])
          }
        }).catch(() => {})
      }
      else setError(json.error || 'User not found')
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  console.log(`[PublicProfilePage] Render — loading:${loading} data:`, data?.connectionStatus, data?.connectionId)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex flex-col items-center justify-center p-6 text-center">
        <Info size={32} className="text-red-400 mb-4" />
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">Profile not found</h1>
        <button type="button" onClick={() => router.push('/')} className="mt-4 px-6 py-2.5 bg-[#7C3AED] text-white rounded-lg font-bold cursor-pointer border-none">
          Go Home
        </button>
      </div>
    )
  }

  const { user, viewer, isOwnProfile, connectionStatus = 'not_connected', connectionId = null, followStatus = 'not_following' } = data
  const isSenior = user.role === 'senior'
  const college = user.colleges
  const profileData = parseProfileData(user.profile_data)
  const studentExtras = getStudentExtras(profileData)
  const seniorExtras = getSeniorExtras(profileData)
  const studentCerts = studentExtras.certifications.filter((c) => c.name?.trim())
  const seniorCerts = seniorExtras.certifications.filter((c) => c.name?.trim())
  const studentProjects = studentExtras.projects.filter((p) => p.title?.trim())
  const seniorProjects = seniorExtras.projects.filter((p) => p.title?.trim())
  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const linkedinUrl = seniorExtras.social_links?.linkedin || studentExtras.social_links?.linkedin || user.linkedin_url || ''
  const githubUrl = seniorExtras.social_links?.github || studentExtras.social_links?.github || ''
  const portfolioUrl = seniorExtras.social_links?.portfolio || ''

  const resumeUrl = studentExtras.resume_url || seniorExtras.resume_url

  const allProjects = (isSenior ? seniorProjects : studentProjects)
  const allCerts = (isSenior ? seniorCerts : studentCerts)
  const skills = isSenior ? seniorExtras.skills : studentExtras.skills

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] font-plus-jakarta-sans text-xs">
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== MAIN CONTENT ===== */}
          <div className="lg:col-span-8 space-y-6">

            {/* ─── SECTION 1: HERO CARD ─── */}
            <div className="bg-white dark:bg-[#283036] rounded-xl border border-slate-200/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden">
              {/* Banner */}
              <div
                className="h-28 rounded-t-xl bg-slate-100 dark:bg-[#283036]"
                style={{
                  background: user.banner_url
                    ? `url(${user.banner_url}) center/contain no-repeat`
                    : 'linear-gradient(to right, #f1f5f9, #eef2ff, #faf5ff)'
                }}
              />
              {/* Avatar + Content */}
              <div className="relative px-6 pb-5">
                {/* Avatar */}
                <div className="-mt-14 mb-3">
                  <div className={`w-28 h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-[#1D2226] shadow-md ${!user.avatar_url ? 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white text-2xl font-black' : ''}`}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                </div>

                {/* Name + Verified */}
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-white m-0">{user.full_name}</h1>
                  {user.is_verified && <ShieldCheck size={18} className="text-blue-500" />}
                </div>

                {/* Role Badge */}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#B0B7BE] mb-2 m-0">
                  {isSenior ? 'Professional' : 'Student'}
                </p>

                {/* College / Company / Location */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-[#B0B7BE] mb-3">
                  {college && (
                    <span className="inline-flex items-center gap-1"><Building2 size={13} className="text-slate-400 dark:text-[#B0B7BE]" /> {college.name}</span>
                  )}
                  {isSenior && user.company && (
                    <span className="inline-flex items-center gap-1"><Briefcase size={13} className="text-slate-400 dark:text-[#B0B7BE]" /> {user.designation} @ {user.company}</span>
                  )}
                  {!isSenior && user.branch && (
                    <span className="inline-flex items-center gap-1"><GraduationCap size={13} className="text-slate-400 dark:text-[#B0B7BE]" /> {user.branch} · Class of {user.passout_year}</span>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-slate-600 dark:text-[#B0B7BE] leading-relaxed m-0 max-w-2xl">{user.bio}</p>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <ProfileActionBar profileUser={user} viewer={viewer} isOwnProfile={isOwnProfile} connectionStatus={connectionStatus} connectionId={connectionId} followStatus={followStatus} />
                  <div className="flex flex-wrap gap-2">
                    {linkedinUrl && (
                      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:text-[#0A66C2] hover:border-[#0A66C2]/30 text-xs font-medium no-underline transition-all dark:hover:bg-[#1D2226]">
                        <Linkedin size={13} /> LinkedIn
                      </a>
                    )}
                    {githubUrl && (
                      <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:text-[#333] hover:border-[#333]/30 text-xs font-medium no-underline transition-all dark:hover:bg-[#1D2226]">
                        <Github size={13} /> GitHub
                      </a>
                    )}
                    {portfolioUrl && (
                      <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:text-[#7C3AED] hover:border-[#7C3AED]/30 text-xs font-medium no-underline transition-all dark:hover:bg-[#1D2226]">
                        <ExternalLink size={13} /> Portfolio
                      </a>
                    )}
                    {resumeUrl && (
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] hover:text-[#7C3AED] hover:border-[#7C3AED]/30 text-xs font-medium no-underline transition-all dark:hover:bg-[#1D2226]">
                        <ExternalLink size={13} /> Resume
                      </a>
                    )}
                  </div>
                </div>

                {/* Integrated: Areas Looking For (Student) / Mentorship (Senior) */}
                {!isSenior && (
                  (() => {
                    const selectedAreas = (Object.keys(AREAS_LOOKING_LABELS) as (keyof AreasLookingFor)[]).filter((k) => studentExtras.areas_looking_for[k])
                    if (!selectedAreas.length) return null
                    return (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-[#38434F]">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider">Seeking</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedAreas.map((k: string) => (
                            <span key={k} className="px-2 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#283036] border border-slate-200 dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] text-[10px] font-medium">{AREAS_LOOKING_LABELS[k as keyof AreasLookingFor]}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}
                {isSenior && (
                  (() => {
                    const activeMentorship = (Object.keys(MENTORSHIP_LABELS) as (keyof MentorshipOptions)[]).filter((k) => seniorExtras.mentorship[k])
                    if (!activeMentorship.length) return null
                    return (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-[#38434F]">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider">Mentorship</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMentorship.map((k) => (
                            <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-medium">{MENTORSHIP_LABELS[k]}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            </div>

            {/* ─── SECTION 2: FEATURED PROJECT ─── */}
            {allProjects.length > 0 && (
              <div className="bg-white dark:bg-[#283036] rounded-xl border border-slate-200/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50 p-6">
                <h2 className="text-xs font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider mb-5 m-0">Featured Project</h2>
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 flex items-center justify-center text-xl font-bold text-[#7C3AED] shrink-0">
                    {allProjects[0].title[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">{allProjects[0].title}</h3>
                    {allProjects[0].description && (
                      <p className="text-sm text-slate-500 dark:text-[#B0B7BE] mt-1.5 m-0 leading-relaxed">{allProjects[0].description}</p>
                    )}
                    {(() => {
                      const stack = allProjects[0].tech_stack
                      if (!stack?.length) return null
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {stack.map((t: string) => (
                            <span key={t} className="px-2.5 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#283036] border border-slate-200 dark:border-[#38434F] text-slate-500 dark:text-[#B0B7BE] text-[11px] font-medium">{t}</span>
                          ))}
                        </div>
                      )
                    })()}
                    <div className="flex gap-4 mt-3">
                      {allProjects[0].github_url && (
                        <a href={allProjects[0].github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-500 dark:text-[#B0B7BE] hover:text-[#7C3AED] text-xs font-medium no-underline transition-colors">
                          <Github size={14} /> GitHub
                        </a>
                      )}
                      {allProjects[0].live_url && (
                        <a href={allProjects[0].live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-slate-500 dark:text-[#B0B7BE] hover:text-[#7C3AED] text-xs font-medium no-underline transition-colors">
                          <ExternalLink size={14} /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {/* Additional Projects */}
                {allProjects.length > 1 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#38434F] space-y-3">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider m-0">More Projects</p>
                    {allProjects.slice(1).map((p, i) => (
                      <div key={i} className="flex items-start justify-between gap-4 py-2 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white m-0">{p.title}</p>
                          {p.description && <p className="text-xs text-slate-400 dark:text-[#B0B7BE] m-0 mt-0.5 line-clamp-1">{p.description}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {p.github_url && (
                            <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-[#B0B7BE] hover:text-[#7C3AED] transition-colors"><Github size={14} /></a>
                          )}
                          {p.live_url && (
                            <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-[#B0B7BE] hover:text-[#7C3AED] transition-colors"><ExternalLink size={14} /></a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 3: SKILLS ─── */}
            {skills.length > 0 && (
              <Section title="Skills">
                <TagList tags={skills} />
              </Section>
            )}

            {/* ─── SECTION 4: CERTIFICATIONS ─── */}
            {allCerts.length > 0 && (
              <Section title="Certifications">
                <CertList items={allCerts} />
              </Section>
            )}

            {/* ─── SECTION 5: PROFESSIONAL DETAILS / EDUCATION ─── */}
            <Section title={isSenior ? 'Professional Details' : 'Education'}>
              <InfoGrid items={isSenior
                ? [
                    ['Company', user.company],
                    ['Designation', user.designation],
                    ['Experience', seniorExtras.experience_years != null ? `${seniorExtras.experience_years} Years` : null],
                    ['Industry', seniorExtras.industry],
                    ['College', college?.name],
                    ['Graduation', user.graduation_year],
                  ]
                : [
                    ['College', college?.name],
                    ['Branch', user.branch],
                    ['Graduation Year', user.passout_year],
                    ['Current Year', user.year ? `Year ${user.year}` : null],
                  ]} />
            </Section>

          </div>

          {/* ===== RIGHT SIDEBAR ===== */}
          <div className="lg:col-span-4 space-y-6">

            {/* Community Impact */}
            <SidebarCard title={isSenior ? 'Community Impact' : 'Community Stats'}>
              {isSenior ? (
                <div className="space-y-3">
                  <ImpactStat label="Juniors Mentored" value={user.webinar_count || 0} />
                  <ImpactStat label="Answers Shared" value={user.answer_count || 0} />
                  <ImpactStat label="Referrals Given" value={user.referral_count || 0} />
                  <ImpactStat label="Rise Points" value={user.rise_points || 0} highlight />
                </div>
              ) : (
                <div className="space-y-3">
                  <ImpactStat label="Questions Asked" value={user.doubt_count || 0} />
                  <ImpactStat label="Answers Received" value={user.answer_count || 0} />
                  <ImpactStat label="Rise Points" value={user.rise_points || 0} highlight />
                </div>
              )}
            </SidebarCard>

            {/* Profile Views */}
            {viewCount !== null && (
              <SidebarCard title="Profile Views">
                <p className="text-2xl font-bold text-slate-900 dark:text-white m-0">{viewCount}</p>
                {visitors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-medium text-slate-400 dark:text-[#B0B7BE] m-0">Recent Visitors</p>
                    <div className="flex -space-x-1.5">
                      {visitors.slice(0, 6).map((v: any) => (
                        <div
                          key={v.viewerId}
                          onClick={() => v.viewer?.uniqueId && router.push(`/u/${v.viewer.uniqueId}`)}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1D2226] bg-slate-100 dark:bg-[#283036] flex items-center justify-center overflow-hidden cursor-pointer hover:z-10 relative transition-transform hover:scale-110"
                          title={v.viewer?.fullName || ''}
                        >
                          {v.viewer?.avatarUrl ? (
                            <img src={v.viewer.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-bold text-slate-400 dark:text-[#B0B7BE]">{v.viewer?.fullName?.substring(0, 2) || '?'}</span>
                          )}
                        </div>
                      ))}
                      {visitors.length > 6 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1D2226] bg-slate-100 dark:bg-[#283036] flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-[#B0B7BE]">
                          +{visitors.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </SidebarCard>
            )}

            {/* Activity Status */}
            {data?.user?.last_seen && (
              <SidebarCard title="Activity Status">
                <p className={`text-sm font-semibold m-0 ${getUserActivityStatus(data.user.last_seen).color}`}>
                  {getUserActivityStatus(data.user.last_seen).label}
                </p>
              </SidebarCard>
            )}

            {/* Edit Profile */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="w-full py-2.5 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold border-none cursor-pointer hover:bg-[#6D28D9] transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#283036] p-6 rounded-xl border border-slate-200/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50">
      <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4 m-0 tracking-tight">{title}</h2>
      {children}
    </div>
  )
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#283036] p-6 rounded-xl border border-slate-200/80 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50">
      <h3 className="text-xs font-semibold text-slate-800 dark:text-white mb-4 m-0">{title}</h3>
      {children}
    </div>
  )
}

function InfoGrid({ items }: { items: [string, string | number | null | undefined][] }) {
  const visible = items.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!visible.length) {
    return <p className="text-xs text-slate-400 dark:text-[#B0B7BE] m-0">No details added yet.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visible.map(([label, value]) => (
        <div key={label}>
          <p className="text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase mb-0.5 m-0">{label}</p>
          <p className="text-xs font-bold text-slate-800 dark:text-white m-0">{value}</p>
        </div>
      ))}
    </div>
  )
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span key={t} className="px-3 py-1 rounded-full bg-[#F8FAFC] dark:bg-[#283036] border border-slate-200 dark:border-[#38434F] text-slate-600 dark:text-[#B0B7BE] text-xs font-medium hover:bg-slate-100 dark:hover:bg-[#1D2226] hover:border-slate-300 transition-colors">
          {t}
        </span>
      ))}
    </div>
  )
}

function CertList({ items }: { items: { name: string; issuer?: string; year?: string }[] }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-[#38434F]">
      {items.map((c, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white m-0 leading-snug">{c.name}</p>
            {c.issuer && <p className="text-xs text-slate-500 dark:text-[#B0B7BE] m-0 mt-0.5">{c.issuer}</p>}
          </div>
          {c.year && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#283036] text-[11px] font-semibold text-slate-500 dark:text-[#B0B7BE]">
              {c.year}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function ImpactStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 dark:text-[#B0B7BE]">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-[#7C3AED]' : 'text-slate-800 dark:text-white'}`}>{value}</span>
    </div>
  )
}
