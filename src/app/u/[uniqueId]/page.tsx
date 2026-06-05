'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Linkedin, GraduationCap, Building2, Briefcase, ShieldCheck,
  Github, ExternalLink, Zap, Info, Check, X,
} from 'lucide-react'
import ProfileActionBar from '@/components/profile/ProfileActionBar'
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

  useEffect(() => {
    if (uniqueId) fetchPublicProfile()
  }, [uniqueId])

  const fetchPublicProfile = async () => {
    try {
      const res = await fetch(`/api/u/${uniqueId}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) setData(json)
      else setError(json.error || 'User not found')
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <Info size={32} className="text-red-400 mb-4" />
        <h1 className="text-lg font-extrabold text-gray-900">Profile not found</h1>
        <button type="button" onClick={() => router.push('/')} className="mt-4 px-6 py-2.5 bg-[#7C3AED] text-white rounded-lg font-bold cursor-pointer border-none">
          Go Home
        </button>
      </div>
    )
  }

  const { user, viewer, isOwnProfile } = data
  const isSenior = user.role === 'senior'
  const college = user.colleges
  const profileData = parseProfileData(user.profile_data)
  const studentExtras = getStudentExtras(profileData)
  const seniorExtras = getSeniorExtras(profileData)
  const studentCerts = studentExtras.certifications.filter((c) => c.name?.trim())
  const seniorCerts = seniorExtras.certifications.filter((c) => c.name?.trim())
  const studentProjects = studentExtras.projects.filter((p) => p.title?.trim())
  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const headerLinks = isSenior
    ? [
        user.linkedin_url && { label: 'LinkedIn', href: user.linkedin_url, icon: Linkedin, className: 'bg-[#0A66C2] text-white border-transparent' },
        seniorExtras.portfolio_url && { label: 'Portfolio', href: seniorExtras.portfolio_url, icon: ExternalLink, className: 'bg-white border-slate-200 text-slate-700' },
        seniorExtras.github_url && { label: 'GitHub', href: seniorExtras.github_url, icon: Github, className: 'bg-slate-900 text-white border-transparent' },
      ].filter(Boolean) as { label: string; href: string; icon: typeof Linkedin; className: string }[]
    : [
        user.linkedin_url && { label: 'LinkedIn', href: user.linkedin_url, icon: Linkedin, className: 'bg-[#0A66C2] text-white border-transparent' },
        studentExtras.github_url && { label: 'GitHub', href: studentExtras.github_url, icon: Github, className: 'bg-slate-900 text-white border-transparent' },
        studentExtras.resume_url && { label: 'Resume', href: studentExtras.resume_url, icon: ExternalLink, className: 'bg-purple-600 text-white border-transparent' },
      ].filter(Boolean) as { label: string; href: string; icon: typeof Linkedin; className: string }[]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-plus-jakarta-sans text-xs">
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-8">
          <div className="relative mb-16">
            {/* Banner */}
            <div 
              className="h-44 rounded-t-2xl overflow-hidden relative"
              style={{
                background: user.banner_url 
                  ? `url(${user.banner_url}) center/cover no-repeat` 
                  : 'linear-gradient(to right, #f1f5f9, #eef2ff, #faf5ff)'
              }}
            />
            {/* Avatar — positioned outside overflow-hidden banner so it's never clipped */}
            <div className="absolute -bottom-14 left-6 md:left-10 z-10">
              <div className={`w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md ${!user.avatar_url ? 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white text-2xl font-black' : ''}`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-6 md:px-10">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] m-0">{user.full_name}</h1>
                  {user.is_verified && <ShieldCheck size={18} className="text-blue-500" />}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 mb-3">
                  {isSenior ? '💼 Professional Profile' : '🎓 Student Profile'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                  {college && (
                    <span className="flex items-center gap-1.5"><Building2 size={14} className="text-purple-600" /> {college.name}</span>
                  )}
                  {isSenior && user.company && (
                    <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-blue-500" /> {user.designation} @ {user.company}</span>
                  )}
                  {!isSenior && user.branch && (
                    <span className="flex items-center gap-1.5"><GraduationCap size={14} className="text-emerald-600" /> {user.branch} · Class of {user.passout_year}</span>
                  )}
                </div>
                {user.bio && (
                  <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-2xl">{user.bio}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[240px]">
                <ProfileActionBar profileUser={user} viewer={viewer} isOwnProfile={isOwnProfile} />
                {headerLinks.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-xs no-underline border ${l.className}`}
                  >
                    <l.icon size={16} /> {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {!isSenior && (
              <>
                <Section title="Education">
                  <InfoGrid items={[
                    ['College', college?.name],
                    ['Branch', user.branch],
                    ['Graduation Year', user.passout_year],
                    ['Current Year', user.year ? `Year ${user.year}` : null],
                  ]} />
                </Section>

                {studentExtras.skills.length > 0 && (
                  <Section title="Skills">
                    <TagList tags={studentExtras.skills} color="purple" />
                  </Section>
                )}

                {studentProjects.length > 0 && (
                  <Section title="Projects">
                    <div className="space-y-3">
                      {studentProjects.map((p, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <p className="font-bold text-slate-900 m-0">{p.title}</p>
                          {p.description && <p className="text-slate-600 mt-1 m-0">{p.description}</p>}
                          {p.link && (
                            <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-600 font-bold mt-2 no-underline">
                              View <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {studentCerts.length > 0 && (
                  <Section title="Certifications">
                    <CertList items={studentCerts} />
                  </Section>
                )}

                <Section title="Areas Looking For">
                  <AreasLookingDisplay areas={studentExtras.areas_looking_for} />
                </Section>
              </>
            )}

            {isSenior && (
              <>
                <Section title="Professional Details">
                  <InfoGrid items={[
                    ['Company', user.company],
                    ['Designation', user.designation],
                    ['Experience', seniorExtras.experience_years != null ? `${seniorExtras.experience_years} Years` : null],
                    ['Industry', seniorExtras.industry],
                    ['College', college?.name],
                    ['Graduation', user.graduation_year],
                  ]} />
                </Section>

                {seniorExtras.skills.length > 0 && (
                  <Section title="Skills">
                    <TagList tags={seniorExtras.skills} color="cyan" />
                  </Section>
                )}

                {seniorCerts.length > 0 && (
                  <Section title="Certifications">
                    <CertList items={seniorCerts} />
                  </Section>
                )}

                <Section title="Mentorship">
                  <MentorshipDisplay mentorship={seniorExtras.mentorship} />
                </Section>
              </>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={14} className="text-orange-500" />
                {isSenior ? 'Community Impact' : 'Community Stats'}
              </h3>
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
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="w-full py-3 rounded-xl bg-[#7C3AED] text-white text-xs font-bold border-none cursor-pointer hover:bg-purple-700 transition-colors"
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <h2 className="text-sm font-extrabold text-[#0F172A] mb-4 m-0">{title}</h2>
      {children}
    </div>
  )
}

function InfoGrid({ items }: { items: [string, string | number | null | undefined][] }) {
  const visible = items.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!visible.length) {
    return <p className="text-xs text-slate-400 m-0">No details added yet.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visible.map(([label, value]) => (
        <div key={label}>
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 m-0">{label}</p>
          <p className="text-xs font-bold text-slate-800 m-0">{value}</p>
        </div>
      ))}
    </div>
  )
}

function TagList({ tags, color }: { tags: string[]; color: 'purple' | 'cyan' | 'emerald' | 'blue' }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span key={t} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${colors[color]}`}>
          {t}
        </span>
      ))}
    </div>
  )
}

function CertList({ items }: { items: { name: string; issuer?: string; year?: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <div key={i} className="flex justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="font-bold text-slate-900 m-0">{c.name}</p>
            {c.issuer && <p className="text-slate-500 m-0 mt-0.5">{c.issuer}</p>}
          </div>
          {c.year && <span className="text-xs font-bold text-slate-400">{c.year}</span>}
        </div>
      ))}
    </div>
  )
}

function MentorshipDisplay({ mentorship }: { mentorship: MentorshipOptions }) {
  return (
    <div className="space-y-2">
      {(Object.keys(MENTORSHIP_LABELS) as (keyof MentorshipOptions)[]).map((key) => (
        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-700">{MENTORSHIP_LABELS[key]}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${mentorship[key] ? 'text-emerald-600' : 'text-slate-400'}`}>
            {mentorship[key] ? <><Check size={12} /> Yes</> : <><X size={12} /> No</>}
          </span>
        </div>
      ))}
    </div>
  )
}

function AreasLookingDisplay({ areas }: { areas: AreasLookingFor }) {
  const selected = (Object.keys(AREAS_LOOKING_LABELS) as (keyof AreasLookingFor)[]).filter((k) => areas[k])
  if (!selected.length) {
    return <p className="text-xs text-slate-400 m-0">Not specified yet.</p>
  }
  return (
    <TagList tags={selected.map((k) => AREAS_LOOKING_LABELS[k])} color="emerald" />
  )
}

function ImpactStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${highlight ? 'bg-purple-50 border border-purple-100' : 'bg-slate-50 border border-slate-100'}`}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className={`text-lg font-extrabold ${highlight ? 'text-purple-600' : 'text-slate-900'}`}>{value}</span>
    </div>
  )
}
