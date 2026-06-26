'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Linkedin, GraduationCap, Building2, Briefcase, ShieldCheck,
  Github, ExternalLink, Info, FileText,
  Award, Code2, BookOpen, BarChart3, Users, Eye,
  ArrowLeft, Zap, Activity
} from 'lucide-react'
import ProfileActionBar from '@/components/profile/ProfileActionBar'
import ImageViewer from '@/components/ImageViewer'
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
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false)
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
        if (!json.isOwnProfile) {
          fetch(`/api/profile/${json.user.id}/view`, { method: 'POST' }).catch(() => {})
        }
        fetch(`/api/profile/${json.user.id}/stats`).then(r => r.ok && r.json()).then(s => {
          if (s) { setViewCount(s.viewCount); setVisitors(s.visitors || []) }
        }).catch(() => {})
      } else setError(json.error || 'User not found')
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#111318] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-400 font-medium animate-pulse">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#111318] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <Info size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Profile not found</h1>
        <p className="text-sm text-slate-400 mb-6">This profile doesn&apos;t exist or has been removed.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white rounded-xl font-semibold text-sm cursor-pointer border-none shadow-lg hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={15} /> Go Home
        </button>
      </div>
    )
  }

  const {
    user, viewer, isOwnProfile,
    connectionStatus = 'not_connected',
    connectionId = null,
    followStatus = 'not_following'
  } = data

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

  const allProjects = isSenior ? seniorProjects : studentProjects
  const allCerts = isSenior ? seniorCerts : studentCerts
  const skills = isSenior ? seniorExtras.skills : studentExtras.skills

  const activityStatus = data?.user?.last_seen ? getUserActivityStatus(data.user.last_seen) : null
  const isOnline = activityStatus?.label === 'Active now' || activityStatus?.label?.includes('min')

  const selectedAreas = !isSenior
    ? (Object.keys(AREAS_LOOKING_LABELS) as (keyof AreasLookingFor)[]).filter((k) => studentExtras.areas_looking_for[k])
    : []
  const activeMentorship = isSenior
    ? (Object.keys(MENTORSHIP_LABELS) as (keyof MentorshipOptions)[]).filter((k) => seniorExtras.mentorship[k])
    : []

  return (
    <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#111318]">
      {avatarViewerOpen && user.avatar_url && (
        <ImageViewer images={[user.avatar_url]} initialIndex={0} onClose={() => setAvatarViewerOpen(false)} />
      )}

      <main className="pt-20 pb-24 px-3 sm:px-4 max-w-6xl mx-auto">

        {/* ════════════════════ HERO CARD ════════════════════ */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-slate-200/70 dark:shadow-black/40 mb-5 bg-white dark:bg-[#1A1D24]">

          {/* Banner */}
          {user.banner_url ? (
            <div
              className="h-32 sm:h-44 w-full"
              style={{ background: `url(${user.banner_url}) center/cover no-repeat` }}
            />
          ) : (
            /* ── Default CLASPIRE branded banner ── */
            <div className="h-32 sm:h-44 w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)' }}>
              {/* SVG full-banner artwork */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 900 176"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* gradient orbs */}
                  <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </radialGradient>
                  {/* dot pattern */}
                  <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
                  </pattern>
                  {/* shimmer gradient for text */}
                  <linearGradient id="textShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#e0d7ff" />
                    <stop offset="40%"  stopColor="#ffffff" />
                    <stop offset="70%"  stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                  {/* underline gradient */}
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0" />
                    <stop offset="30%"  stopColor="#7C3AED" />
                    <stop offset="70%"  stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* dot grid background */}
                <rect width="900" height="176" fill="url(#dots)" />

                {/* glowing orbs */}
                <ellipse cx="160"  cy="60"  rx="180" ry="130" fill="url(#orb1)" />
                <ellipse cx="750"  cy="120" rx="200" ry="140" fill="url(#orb2)" />
                <ellipse cx="480"  cy="20"  rx="160" ry="100" fill="url(#orb3)" />

                {/* mesh lines — top-left fan */}
                {[0,18,36,54,72,90].map((a,i) => {
                  const rad = (a * Math.PI) / 180
                  return (
                    <line key={i}
                      x1="0" y1="0"
                      x2={400 * Math.cos(rad)} y2={400 * Math.sin(rad)}
                      stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                    />
                  )
                })}

                {/* mesh lines — bottom-right fan */}
                {[180,198,216,234,252,270].map((a,i) => {
                  const rad = (a * Math.PI) / 180
                  return (
                    <line key={i}
                      x1="900" y1="176"
                      x2={900 + 400 * Math.cos(rad)} y2={176 + 400 * Math.sin(rad)}
                      stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                    />
                  )
                })}

                {/* horizontal accent line */}
                <line x1="60" y1="88" x2="840" y2="88" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                {/* CLASPIRE wordmark */}
                <text
                  x="50%"
                  y="52%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
                  fontWeight="900"
                  fontSize="52"
                  letterSpacing="10"
                  fill="url(#textShimmer)"
                  opacity="0.95"
                >
                  CLASPIRE
                </text>

                {/* underline */}
                <rect x="230" y="116" width="440" height="2.5" rx="2" fill="url(#lineGrad)" opacity="0.7" />

                {/* tagline */}
                <text
                  x="50%"
                  y="78%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
                  fontWeight="500"
                  fontSize="11"
                  letterSpacing="3.5"
                  fill="rgba(255,255,255,0.38)"
                >
                  CONNECT · GROW · ACHIEVE
                </text>

                {/* corner sparkles */}
                <circle cx="72"  cy="22"  r="2.5" fill="rgba(124,58,237,0.7)" />
                <circle cx="86"  cy="22"  r="1.5" fill="rgba(124,58,237,0.4)" />
                <circle cx="72"  cy="36"  r="1.5" fill="rgba(124,58,237,0.4)" />
                <circle cx="828" cy="154" r="2.5" fill="rgba(6,182,212,0.7)"  />
                <circle cx="842" cy="154" r="1.5" fill="rgba(6,182,212,0.4)"  />
                <circle cx="828" cy="140" r="1.5" fill="rgba(6,182,212,0.4)"  />
              </svg>
            </div>
          )}

          {/* Card body */}
          <div className="px-4 sm:px-7 pb-6 sm:pb-7">
            {/* Avatar row */}
            <div className="-mt-12 sm:-mt-14 mb-3 flex items-end justify-between">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-[#1A1D24] shadow-xl transition-transform duration-200 hover:scale-[1.03] ${!user.avatar_url ? 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white text-3xl font-black' : 'cursor-pointer'}`}
                  onClick={() => user.avatar_url && setAvatarViewerOpen(true)}
                  title={user.avatar_url ? 'View profile photo' : undefined}
                >
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    : initials}
                </div>
                {/* online dot */}
                {isOnline && (
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#1A1D24] shadow-sm" />
                )}
              </div>

              {/* Desktop Edit button */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-semibold border-none cursor-pointer shadow-md hover:opacity-90 transition-opacity"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Name */}
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white m-0 leading-tight">
                    {user.full_name}
                  </h1>
                  {user.is_verified && (
                    <span title="Verified" className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={11} className="text-white" />
                    </span>
                  )}
                </div>

                {/* Role pill */}
                <div className="mt-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSenior ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300'}`}>
                    {isSenior ? <Briefcase size={9} /> : <GraduationCap size={9} />}
                    {isSenior ? 'Professional' : 'Student'}
                  </span>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {college && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[180px] sm:max-w-none">{college.name}</span>
                    </span>
                  )}
                  {isSenior && user.company && (
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase size={12} className="text-slate-400 flex-shrink-0" />
                      {user.designation} @ {user.company}
                    </span>
                  )}
                  {!isSenior && user.branch && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap size={12} className="text-slate-400 flex-shrink-0" />
                      {user.branch} · Class of {user.passout_year}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0 max-w-2xl">
                {user.bio}
              </p>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <ProfileActionBar
                profileUser={user}
                viewer={viewer}
                isOwnProfile={isOwnProfile}
                connectionStatus={connectionStatus}
                connectionId={connectionId}
                followStatus={followStatus}
              />
              {/* Social links */}
              <div className="flex flex-wrap gap-2">
                {linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252830] text-slate-500 dark:text-slate-300 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] text-xs font-medium no-underline transition-all border border-transparent hover:border-[#0A66C2]/20">
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {githubUrl && (
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252830] text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white text-xs font-medium no-underline transition-all">
                    <Github size={13} /> GitHub
                  </a>
                )}
                {portfolioUrl && (
                  <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252830] text-slate-500 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-[#7C3AED] dark:hover:text-violet-400 text-xs font-medium no-underline transition-all">
                    <ExternalLink size={13} /> Portfolio
                  </a>
                )}
                {resumeUrl && (
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252830] text-slate-500 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-[#7C3AED] dark:hover:text-violet-400 text-xs font-medium no-underline transition-all">
                    <FileText size={13} /> Resume
                  </a>
                )}
              </div>
            </div>

            {/* Seeking / Mentorship tags */}
            {(selectedAreas.length > 0 || activeMentorship.length > 0) && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1">
                  {isSenior ? 'Offers' : 'Seeking'}
                </span>
                {(isSenior ? activeMentorship : selectedAreas).map((k: string) => (
                  <span key={k}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${isSenior
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40'
                      : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/40'}`}>
                    {isSenior
                      ? MENTORSHIP_LABELS[k as keyof MentorshipOptions]
                      : AREAS_LOOKING_LABELS[k as keyof AreasLookingFor]}
                  </span>
                ))}
              </div>
            )}

            {/* Mobile edit button */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="sm:hidden mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-sm font-semibold border-none cursor-pointer shadow-md hover:opacity-90 transition-opacity"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════ MAIN GRID ════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ─── LEFT / MAIN COLUMN ─── */}
          <div className="lg:col-span-8 space-y-5">

            {/* FEATURED PROJECT */}
            {allProjects.length > 0 && (
              <ProfileCard icon={<Code2 size={14} />} label="Featured Project" accent="violet">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center text-lg font-black text-[#7C3AED] flex-shrink-0 border border-violet-100 dark:border-violet-800/40">
                    {allProjects[0].title[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0 leading-tight">
                        {allProjects[0].title}
                      </h3>
                      <div className="flex gap-2 flex-shrink-0">
                        {allProjects[0].github_url && (
                          <a href={allProjects[0].github_url} target="_blank" rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                            <Github size={15} />
                          </a>
                        )}
                        {allProjects[0].live_url && (
                          <a href={allProjects[0].live_url} target="_blank" rel="noopener noreferrer"
                            className="text-slate-400 hover:text-[#7C3AED] dark:hover:text-violet-400 transition-colors">
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                    {allProjects[0].description && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 m-0 leading-relaxed">
                        {allProjects[0].description}
                      </p>
                    )}
                    {(() => {
                      const stack = allProjects[0].tech_stack
                      if (!stack?.length) return null
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {stack.map((t: string) => (
                            <span key={t} className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                    {allProjects[0].live_url && (
                      <a href={allProjects[0].live_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold no-underline hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-100 dark:border-violet-800/40">
                        <ExternalLink size={12} /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* More projects */}
                {allProjects.length > 1 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 m-0">
                      More Projects
                    </p>
                    <div className="space-y-2">
                      {allProjects.slice(1).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#252830] hover:bg-slate-100 dark:hover:bg-[#2a2e38] transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-white m-0">{p.title}</p>
                            {p.description && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0 mt-0.5 line-clamp-1">{p.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {p.github_url && (
                              <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                <Github size={14} />
                              </a>
                            )}
                            {p.live_url && (
                              <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#7C3AED] transition-colors">
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ProfileCard>
            )}

            {/* SKILLS */}
            {skills.length > 0 && (
              <ProfileCard icon={<Zap size={14} />} label="Skills" accent="sky">
                <div className="flex flex-wrap gap-2">
                  {skills.map((t: string) => (
                    <span key={t}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#252830] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-[#7C3AED] dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all cursor-default">
                      {t}
                    </span>
                  ))}
                </div>
              </ProfileCard>
            )}

            {/* CERTIFICATIONS */}
            {allCerts.length > 0 && (
              <ProfileCard icon={<Award size={14} />} label="Certifications" accent="amber">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {allCerts.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 border border-amber-100 dark:border-amber-800/40">
                          <Award size={13} className="text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white m-0 leading-snug">{c.name}</p>
                          {c.issuer && <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0 mt-0.5">{c.issuer}</p>}
                        </div>
                      </div>
                      {c.year && (
                        <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40">
                          {c.year}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ProfileCard>
            )}

            {/* EDUCATION / PROFESSIONAL DETAILS */}
            <ProfileCard
              icon={isSenior ? <Briefcase size={14} /> : <BookOpen size={14} />}
              label={isSenior ? 'Professional Details' : 'Education'}
              accent="slate"
            >
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
                  ]}
              />
            </ProfileCard>

          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="lg:col-span-4 space-y-5">

            {/* COMMUNITY STATS */}
            <SidebarCard
              icon={isSenior ? <Users size={14} /> : <BarChart3 size={14} />}
              title={isSenior ? 'Community Impact' : 'Community Stats'}
            >
              {isSenior ? (
                <div className="space-y-1">
                  <StatRow label="Juniors Mentored" value={user.webinar_count || 0} />
                  <StatRow label="Answers Shared" value={user.answer_count || 0} />
                  <StatRow label="Referrals Given" value={user.referral_count || 0} />
                  <StatRow label="Rise Points" value={user.rise_points || 0} highlight />
                </div>
              ) : (
                <div className="space-y-1">
                  <StatRow label="Questions Asked" value={user.doubt_count || 0} />
                  <StatRow label="Answers Received" value={user.answer_count || 0} />
                  <StatRow label="Rise Points" value={user.rise_points || 0} highlight />
                </div>
              )}
            </SidebarCard>

            {/* PROFILE OVERVIEW */}
            {viewCount !== null && (
              <SidebarCard icon={<Eye size={14} />} title="Profile Overview">
                <div className="flex items-start gap-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest m-0">Views</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white m-0 leading-none mt-1">{viewCount}</p>
                  </div>
                  {visitors.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 m-0">Recent Visitors</p>
                      <div className="flex -space-x-1.5">
                        {visitors.slice(0, 6).map((v: any) => (
                          <div
                            key={v.viewerId}
                            onClick={() => v.viewer?.uniqueId && router.push(`/u/${v.viewer.uniqueId}`)}
                            className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1A1D24] bg-slate-100 dark:bg-[#252830] flex items-center justify-center overflow-hidden cursor-pointer hover:z-10 relative transition-transform hover:scale-110 shadow-sm"
                            title={v.viewer?.fullName || ''}
                          >
                            {v.viewer?.avatarUrl
                              ? <img src={v.viewer.avatarUrl} alt="" className="w-full h-full object-cover" />
                              : <span className="text-[8px] font-bold text-slate-500">{v.viewer?.fullName?.substring(0, 2) || '?'}</span>}
                          </div>
                        ))}
                        {visitors.length > 6 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1A1D24] bg-slate-200 dark:bg-[#38434F] flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-slate-300 shadow-sm">
                            +{visitors.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SidebarCard>
            )}

            {/* ACTIVITY STATUS */}
            {activityStatus && (
              <SidebarCard icon={<Activity size={14} />} title="Activity Status">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-300' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span className={`text-sm font-semibold ${activityStatus.color}`}>{activityStatus.label}</span>
                </div>
              </SidebarCard>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

/* ─────────────────────── Sub-components ─────────────────────── */

function ProfileCard({
  icon, label, accent = 'violet', children,
}: {
  icon: React.ReactNode
  label: string
  accent?: 'violet' | 'sky' | 'amber' | 'slate'
  children: React.ReactNode
}) {
  const accentCls: Record<string, string> = {
    violet: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/40',
    sky:    'text-sky-500 bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/40',
    amber:  'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40',
    slate:  'text-slate-500 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
  }
  return (
    <div className="bg-white dark:bg-[#1A1D24] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5 border-b border-slate-50 dark:border-white/5">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${accentCls[accent]}`}>
          {icon}
        </span>
        <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest m-0">{label}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function SidebarCard({
  icon, title, children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-[#1A1D24] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5 border-b border-slate-50 dark:border-white/5">
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest m-0">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoGrid({ items }: { items: [string, string | number | null | undefined][] }) {
  const visible = items.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!visible.length) {
    return <p className="text-xs text-slate-400 dark:text-slate-500 m-0">No details added yet.</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {visible.map(([label, value]) => (
        <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-[#252830] border border-slate-100 dark:border-white/5">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 m-0">{label}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-white m-0 leading-tight">{value}</p>
        </div>
      ))}
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-white/5 last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-black tabular-nums ${highlight ? 'text-[#7C3AED] dark:text-violet-400' : 'text-slate-800 dark:text-white'}`}>
        {value.toLocaleString()}
      </span>
    </div>
  )
}
