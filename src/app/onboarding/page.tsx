'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AvatarUpload from '@/components/AvatarUpload'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Users,
  Briefcase,
  TrendingUp,
  Loader2,
  ArrowRight,
  ChevronLeft,
  Camera,
  Zap,
  Building2,
  UserPlus,
  Star,
  Shield,
} from 'lucide-react'
import { calculateProfileCompletion } from '@/lib/profileCompletion'

const TOTAL_STEPS = 5

const stepVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? 28 : -28,
  }),
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -28 : 28,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

// ── SVG Circular Progress Ring
function CircleProgress({ pct, size = 64, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const radius = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8D5FF" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#pg)" strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s ease' }}
      />
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F4A01C" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Loading Skeleton Card
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-[#2D3744] overflow-hidden animate-pulse">
      <div className="h-16 bg-gray-200 dark:bg-[#283036]" />
      <div className="p-3 space-y-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#283036] mx-auto -mt-7" />
        <div className="h-3 bg-gray-200 dark:bg-[#283036] rounded w-3/4 mx-auto" />
        <div className="h-2 bg-gray-100 dark:bg-[#1D2226] rounded w-1/2 mx-auto" />
        <div className="h-7 bg-gray-100 dark:bg-[#283036] rounded-lg mt-2" />
      </div>
    </div>
  )
}

// ── Compact Person Card for Onboarding
function OnboardingPersonCard({
  person,
  requested,
  onConnect,
}: {
  person: any
  requested: boolean
  onConnect: (id: string) => Promise<boolean>
}) {
  const [connecting, setConnecting] = useState(false)
  const [localRequested, setLocalRequested] = useState(requested || person.connectionStatus === 'pending_sent')

  useEffect(() => {
    setLocalRequested(requested || person.connectionStatus === 'pending_sent')
  }, [requested, person.connectionStatus])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (localRequested || connecting) return
    setConnecting(true)
    const ok = await onConnect(person.id)
    if (ok) setLocalRequested(true)
    setConnecting(false)
  }

  const headline = person.designation && person.company
    ? `${person.designation} at ${person.company}`
    : person.branch || (person.role === 'senior' ? 'Senior' : 'Student')

  const collegeName = person.college?.short_name || person.college?.name || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(124,58,237,0.12)' }}
      className="bg-white dark:bg-[#1D2226] rounded-xl border border-gray-100 dark:border-[#2D3744] overflow-hidden transition-shadow duration-300"
    >
      {/* Banner */}
      <div className="h-14 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#0A2540] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 16px 16px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <span className="text-[11px] font-extrabold tracking-[0.2em] text-purple-200/60 select-none">CLASPIRE</span>
      </div>

      {/* Avatar */}
      <div className="flex justify-center -mt-5 relative z-10">
        <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#1D2226] overflow-hidden bg-gray-200 dark:bg-[#283036] shadow-md">
          {person.avatar_url && !person.avatar_url.includes('dicebear') && !person.avatar_url.includes('ui-avatars')
            ? <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-[#F4A01C] to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{(person.full_name || 'U').slice(0, 2).toUpperCase()}</span>
              </div>
          }
        </div>
      </div>

      <div className="px-3 pb-3 pt-1.5 text-center">
        <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{person.full_name}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-snug">{headline}</p>
        {collegeName && <p className="text-[9px] text-gray-400 truncate mt-0.5">{collegeName}</p>}

        <button
          onClick={handleClick}
          disabled={localRequested || connecting}
          className={`mt-2.5 w-full h-7 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
            localRequested
              ? 'bg-gray-100 dark:bg-[#283036] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-[#38434F] cursor-not-allowed'
              : 'bg-[#F4A01C] hover:bg-[#E09410] text-white active:scale-95'
          }`}
        >
          {connecting ? (
            <Loader2 size={10} className="animate-spin" />
          ) : localRequested ? (
            <><CheckCircle2 size={10} />Requested</>
          ) : (
            <><UserPlus size={10} />Connect</>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ── Community Card for Onboarding (no banner, logo-first design)
function CommunityCard({
  community,
  joined,
  joining,
  recommended,
  onJoin,
}: {
  community: any
  joined: boolean
  joining: boolean
  recommended: boolean
  onJoin: (id: string, slug: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(124,58,237,0.12)' }}
      className="bg-white dark:bg-[#1D2226] rounded-2xl border border-gray-100 dark:border-[#2D3744] overflow-hidden transition-all duration-300 relative flex flex-col"
    >
      {recommended && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#F4A01C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
          <Star size={8} className="fill-current" />
          For You
        </div>
      )}

      <div className="p-4 flex flex-col items-center text-center flex-1">
        {/* College Logo */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] shadow-sm flex items-center justify-center mb-3 flex-shrink-0">
          {community.logo_url
            ? <img src={community.logo_url} alt={community.display_name} className="w-full h-full object-contain p-1" />
            : <Building2 size={22} className="text-[#F4A01C]" />
          }
        </div>

        {/* Name */}
        <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">{community.display_name}</p>

        {/* Member count */}
        <div className="flex items-center gap-1 mb-3">
          <Users size={9} className="text-[#F4A01C]" />
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            {community.member_count > 0 ? `${community.member_count.toLocaleString()} members` : 'New community'}
          </span>
        </div>

        {/* Active indicator */}
        <div className="flex items-center gap-1 mb-3">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          <span className="text-[9px] text-green-600 dark:text-green-400 font-semibold">Active</span>
        </div>

        <button
          onClick={() => !joined && onJoin(community.id, community.slug)}
          disabled={joining || joined}
          className={`w-full h-8 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
            joined
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 cursor-not-allowed'
              : 'bg-[#F4A01C] hover:bg-[#E09410] text-white active:scale-95 shadow-sm shadow-[#F4A01C]/20'
          }`}
        >
          {joining ? <Loader2 size={11} className="animate-spin" /> : joined ? <><CheckCircle2 size={11} />Joined</> : <>Join</>}
        </button>
      </div>
    </motion.div>
  )
}

// ── Step 1 ─── Welcome
function StepWelcome({ onNext }: { onNext: () => void }) {
  const benefits = [
    {
      icon: Shield,
      title: 'Connect with verified seniors',
      desc: 'Get mentorship and referrals from alumni at top companies.',
    },
    {
      icon: Briefcase,
      title: 'Discover referrals and opportunities',
      desc: 'Access exclusive job postings, internships, and placement drives.',
    },
    {
      icon: Building2,
      title: 'Join your college community',
      desc: 'Stay connected with your campus, batch, and department.',
    },
  ]

  return (
    <div className="flex flex-col items-center text-center px-1">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 mt-1"
      >
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-[#F4A01C]/20 bg-white mx-auto">
          <img
            src="/claspire-logo.jpeg"
            alt="Claspire"
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.currentTarget
              t.style.display = 'none'
              const parent = t.parentElement
              if (parent) {
                parent.className = 'w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A2540] to-indigo-600 flex items-center justify-center shadow-xl shadow-[#F4A01C]/20 mx-auto'
                parent.innerHTML = '<span class="text-white font-extrabold text-2xl">C</span>'
              }
            }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 leading-tight"
      >
        Build Your Professional<br className="hidden sm:block" /> College Network
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.3 }}
        className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mb-7"
      >
        Connect with students, seniors, referrals, internships, opportunities, and communities that accelerate your career growth.
      </motion.p>

      <div className="w-full space-y-2.5 mb-7">
        {benefits.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.015, x: 2 }}
            transition={{ delay: 0.18 + i * 0.07, duration: 0.25 }}
            className="flex items-start gap-3.5 p-3.5 bg-white/60 dark:bg-[#1D2226]/60 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-[#2D3744] text-left cursor-default transition-colors group hover:border-[#F4A01C]/30 dark:hover:border-purple-800/50"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 flex items-center justify-center flex-shrink-0 group-hover:from-purple-100 group-hover:to-violet-200 dark:group-hover:from-purple-900/50 transition-colors">
              <Icon size={16} className="text-[#F4A01C] dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">{title}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
        className="w-full"
      >
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
          Complete your profile to unlock the full Claspire experience.
        </p>
        <button
          onClick={onNext}
          className="w-full py-3.5 bg-[#F4A01C] hover:bg-[#E09410] active:bg-[#0A2540] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#F4A01C]/25 flex items-center justify-center gap-2 hover:gap-3"
        >
          Build My Profile
          <ArrowRight size={15} />
        </button>
      </motion.div>
    </div>
  )
}

// ── Step 2 ─── Profile Photo
function StepPhoto({
  user,
  avatarUrl,
  onAvatarUploaded,
  onNext,
  onBack,
  onSkip,
}: {
  user: any
  avatarUrl: string | null
  onAvatarUploaded: (url: string) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const isDefaultAvatar = (url: string | null) =>
    !url || url.includes('dicebear') || url.includes('ui-avatars')

  const hasRealPhoto = !isDefaultAvatar(avatarUrl) || !isDefaultAvatar(user?.avatar_url)

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-10 h-10 bg-[#FFF3D6] dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
        <Camera size={20} className="text-[#F4A01C]" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5">Add a Profile Photo</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 max-w-xs">
        Profiles with photos get significantly more engagement and build trust faster.
      </p>
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 mb-7">
        <TrendingUp size={12} className="text-emerald-600" />
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">+35% profile visibility</span>
      </div>

      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full ring-4 ring-purple-200 dark:ring-purple-800 ring-offset-4 ring-offset-white dark:ring-offset-[#0A0E14] overflow-hidden">
          <AvatarUpload
            currentUrl={isDefaultAvatar(avatarUrl) ? (isDefaultAvatar(user?.avatar_url) ? '' : (user?.avatar_url || '')) : (avatarUrl || '')}
            userName={user?.full_name || ''}
            size={128}
            fallbackType="camera"
            onUploadSuccess={(url) => onAvatarUploaded(url)}
          />
        </div>
        {hasRealPhoto && (
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-lg">
            <CheckCircle2 size={14} className="text-white" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Click the circle above to upload a photo.</p>

      <ActionBar onBack={onBack} onNext={onNext} onSkip={onSkip} nextLabel="Continue" showSkip />
    </div>
  )
}

// ── Step 3 ─── Headline & Bio
function StepHeadlineBio({
  user,
  headline,
  bio,
  onHeadlineChange,
  onBioChange,
  onNext,
  onBack,
  onSkip,
}: {
  user: any
  headline: string
  bio: string
  onHeadlineChange: (v: string) => void
  onBioChange: (v: string) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const examples = ['Software Engineer', 'Frontend Developer', 'AI Enthusiast', 'Mech Engg Student']

  return (
    <div className="flex flex-col w-full">
      <div className="w-10 h-10 bg-[#FFF3D6] dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
        <Zap size={18} className="text-[#F4A01C]" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Headline & Bio</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Tell people what you do and what you're passionate about.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left – Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => onHeadlineChange(e.target.value)}
              placeholder="e.g. Software Engineer"
              maxLength={80}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-[#38434F] bg-gray-50 dark:bg-[#1D2226] text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#F4A01C] focus:border-transparent outline-none transition-all text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => onHeadlineChange(ex)}
                  className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-[#283036] text-gray-600 dark:text-gray-400 hover:bg-[#FFF3D6] hover:text-[#E09410] dark:hover:bg-purple-900/30 dark:hover:text-purple-400 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Bio</label>
              <span className="text-[10px] text-gray-400">{bio.length}/150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value.slice(0, 150))}
              placeholder="A short introduction about yourself..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#38434F] bg-gray-50 dark:bg-[#1D2226] text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#F4A01C] focus:border-transparent outline-none transition-all resize-none text-sm"
            />
          </div>
        </div>

        {/* Right – Live Preview */}
        <div className="hidden lg:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Live Preview</p>
          <div className="rounded-2xl border border-gray-200 dark:border-[#2D3744] bg-white dark:bg-[#1D2226] shadow-sm overflow-hidden">
            <div className="h-14 bg-gradient-to-br from-[#0A2540] to-violet-500" />
            <div className="px-4 pb-4">
              <div className="-mt-6 mb-2.5 flex items-end gap-3">
                <div className="w-12 h-12 rounded-full border-[3px] border-white dark:border-[#1D2226] overflow-hidden bg-gray-200 flex-shrink-0 shadow-sm">
                  {user?.avatar_url && !user.avatar_url.includes('dicebear') && !user.avatar_url.includes('ui-avatars')
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-[#F4A01C] to-violet-600 flex items-center justify-center">
                        <span className="text-white font-bold">{(user?.full_name || 'U')[0]}</span>
                      </div>
                  }
                </div>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{user?.full_name || 'Your Name'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 min-h-[16px]">
                {headline || <span className="italic text-gray-300 dark:text-gray-600">Your headline appears here</span>}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed min-h-[32px]">
                {bio || <span className="italic text-gray-300 dark:text-gray-600">Your bio appears here...</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile preview peek */}
      <div className="lg:hidden mt-4 rounded-xl border border-gray-200 dark:border-[#38434F] bg-gray-50 dark:bg-[#1D2226] px-3.5 py-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FFF3D6] flex-shrink-0">
          {user?.avatar_url && !user.avatar_url.includes('dicebear') && !user.avatar_url.includes('ui-avatars')
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-[#F4A01C] to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{(user?.full_name || 'U')[0]}</span>
              </div>
          }
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{user?.full_name}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{headline || 'Your headline'}</p>
        </div>
      </div>

      <div className="mt-5">
        <ActionBar onBack={onBack} onNext={onNext} onSkip={onSkip} nextLabel="Continue" showSkip />
      </div>
    </div>
  )
}

// ── Step 4 ─── Suggested Connections
function StepConnections({
  suggestedPeople,
  loadingPeople,
  requestedIds,
  onConnect,
  onNext,
  onBack,
  onSkip,
}: {
  suggestedPeople: any[]
  loadingPeople: boolean
  requestedIds: Set<string>
  onConnect: (userId: string) => Promise<boolean>
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="w-10 h-10 bg-[#FFF3D6] dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
        <Users size={18} className="text-[#F4A01C]" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">People You May Know</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Students and seniors from your college and department.</p>

      {loadingPeople ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : suggestedPeople.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-gray-200 dark:border-[#2D3744] rounded-2xl mb-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-[#1D2226] rounded-2xl flex items-center justify-center">
            <Users size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Be the first member of your network</p>
          <p className="text-xs text-gray-400 max-w-[200px]">Your network will grow as more people from your campus join.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {suggestedPeople.map((person) => (
            <OnboardingPersonCard
              key={person.id}
              person={person}
              requested={requestedIds.has(person.id)}
              onConnect={onConnect}
            />
          ))}
        </div>
      )}

      <ActionBar onBack={onBack} onNext={onNext} onSkip={onSkip} nextLabel="Continue" showSkip />
    </div>
  )
}

// ── Step 5 ─── Communities
function StepCommunity({
  communities,
  loadingCommunity,
  joinedIds,
  joiningId,
  userCollegeCommunityId,
  onJoin,
  onNext,
  onBack,
  onSkip,
}: {
  communities: any[]
  loadingCommunity: boolean
  joinedIds: Set<string>
  joiningId: string | null
  userCollegeCommunityId: string | null
  onJoin: (id: string, slug: string) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="w-10 h-10 bg-[#FFF3D6] dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
        <Building2 size={18} className="text-[#F4A01C]" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Join Communities</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Connect with your college, seniors, and interest groups.</p>

      {loadingCommunity ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-[#2D3744] overflow-hidden animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-[#283036]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-[#283036] rounded w-3/4" />
                <div className="h-2 bg-gray-100 dark:bg-[#1D2226] rounded w-1/2" />
                <div className="h-7 bg-gray-100 dark:bg-[#283036] rounded-lg mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-gray-200 dark:border-[#2D3744] rounded-2xl mb-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-[#1D2226] rounded-2xl flex items-center justify-center">
            <Building2 size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No communities found</p>
          <p className="text-xs text-gray-400">You can discover communities after joining.</p>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal scroll */}
          <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 mb-4 snap-x snap-mandatory -mx-1 px-1">
            {communities.map((community) => (
              <div key={community.id} className="min-w-[200px] snap-start">
                <CommunityCard
                  community={community}
                  joined={joinedIds.has(community.id)}
                  joining={joiningId === community.id}
                  recommended={community.id === userCollegeCommunityId}
                  onJoin={onJoin}
                />
              </div>
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                joined={joinedIds.has(community.id)}
                joining={joiningId === community.id}
                recommended={community.id === userCollegeCommunityId}
                onJoin={onJoin}
              />
            ))}
          </div>
        </>
      )}

      <ActionBar onBack={onBack} onNext={onNext} onSkip={onSkip} nextLabel="Finish & Enter Claspire" showSkip={joinedIds.size === 0} nextPrimary />
    </div>
  )
}

// ── Success Screen
function SuccessScreen({
  user,
  score,
  connectionsCount,
  communitiesCount,
  onEnter,
}: {
  user: any
  score: number
  connectionsCount: number
  communitiesCount: number
  onEnter: () => void
}) {
  const achievements = [
    { label: 'Profile Photo Added', done: !!(user?.avatar_url && !user.avatar_url.includes('dicebear') && !user.avatar_url.includes('ui-avatars')) },
    { label: 'Profile Details Added', done: !!(user?.headline || user?.bio) },
    { label: 'Connections Started', done: connectionsCount > 0, count: connectionsCount > 0 ? `${connectionsCount} sent` : undefined },
    { label: 'Communities Joined', done: communitiesCount > 0, count: communitiesCount > 0 ? `${communitiesCount} joined` : undefined },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center"
    >
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-[#F4A01C]/25 bg-white mb-5 mx-auto">
        <img
          src="/claspire-logo.jpeg"
          alt="Claspire"
          className="w-full h-full object-cover"
          onError={(e) => {
            const t = e.currentTarget
            t.style.display = 'none'
            const parent = t.parentElement
            if (parent) {
              parent.className = 'w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A2540] to-indigo-600 flex items-center justify-center shadow-xl shadow-[#F4A01C]/25 mb-5 mx-auto'
              parent.innerHTML = '<span class="text-white font-extrabold text-2xl">C</span>'
            }
          }}
        />
      </div>



      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Profile Setup Complete</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">You're ready to start connecting and growing your network.</p>

      {/* Achievement checklist */}
      <div className="w-full bg-gray-50 dark:bg-[#1D2226] rounded-2xl p-4 mb-5 text-left">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Onboarding Summary</p>
        <div className="space-y-2.5">
          {achievements.map(({ label, done, count }) => (
            <div key={label} className="flex items-center gap-3">
              {done
                ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
              }
              <span className={`text-sm font-semibold flex-1 ${done ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>{label}</span>
              {count && <span className="text-[10px] font-bold text-[#F4A01C] bg-[#FFF3D6] dark:bg-purple-900/20 border border-[#F4A01C]/30 dark:border-purple-800 px-2 py-0.5 rounded-full">{count}</span>}
              {!done && !count && <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">Skipped</span>}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onEnter}
        className="w-full py-4 bg-[#F4A01C] hover:bg-[#E09410] active:bg-[#0A2540] text-white font-bold text-base rounded-2xl transition-all duration-200 shadow-xl shadow-[#F4A01C]/30 flex items-center justify-center gap-2 hover:gap-3"
      >
        Enter Claspire
        <ArrowRight size={18} />
      </button>
    </motion.div>
  )
}

// ── Shared Action Bar
function ActionBar({
  onBack,
  onNext,
  onSkip,
  nextLabel = 'Continue',
  showSkip = false,
  nextPrimary = false,
  loading = false,
}: {
  onBack?: () => void
  onNext: () => void
  onSkip?: () => void
  nextLabel?: string
  showSkip?: boolean
  nextPrimary?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={onNext}
        disabled={loading}
        className="w-full py-3.5 bg-[#F4A01C] hover:bg-[#E09410] active:bg-[#0A2540] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md shadow-[#F4A01C]/20 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {nextLabel}
        {!loading && <ArrowRight size={15} />}
      </button>
      <div className="flex gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#38434F] bg-white dark:bg-[#1D2226] text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-[#283036] transition-colors flex items-center justify-center gap-1.5"
          >
            <ChevronLeft size={15} />
            Back
          </button>
        )}
        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 font-semibold text-sm hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}

// ── Progress Header
const STEP_TITLES = ['', 'Profile Photo', 'Headline & Bio', 'Connect with People', 'Join Communities']

function ProgressHeader({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / total) * 100)
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg overflow-hidden bg-white shadow-sm">
            <img
              src="/claspire-logo.jpeg"
              alt="Claspire"
              className="w-full h-full object-cover"
              onError={(e) => {
                const t = e.currentTarget
                t.style.display = 'none'
                const p = t.parentElement
                if (p) {
                  p.className = 'w-6 h-6 rounded-lg bg-gradient-to-br from-[#0A2540] to-indigo-600 flex items-center justify-center shadow-sm'
                  p.innerHTML = '<span class="text-white font-bold text-[10px]">C</span>'
                }
              }}
            />
          </div>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            Step {step} of {total}{STEP_TITLES[step] ? ` · ${STEP_TITLES[step]}` : ''}
          </span>
        </div>
        <span className="text-xs font-bold text-[#F4A01C]">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-[#283036] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #F4A01C, #A855F7)' }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  Main Page
// ──────────────────────────────────────────────
function OnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next')
  const { user, refetch, loading: authLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Profile state
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Step 4 – connections (persisted; never reset)
  const [suggestedPeople, setSuggestedPeople] = useState<any[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [fetchedPeople, setFetchedPeople] = useState(false)
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

  // Step 5 – communities (persisted; never reset)
  const [communities, setCommunities] = useState<any[]>([])
  const [loadingCommunity, setLoadingCommunity] = useState(false)
  const [fetchedCommunity, setFetchedCommunity] = useState(false)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [userCollegeCommunityId, setUserCollegeCommunityId] = useState<string | null>(null)

  // Init from user once
  const initialised = useRef(false)
  useEffect(() => {
    if (user && !initialised.current) {
      initialised.current = true
      setHeadline(user.headline || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatar_url || null)
    }
  }, [user])

  // Fetch people once on step 4
  useEffect(() => {
    if (step === 4 && !fetchedPeople) {
      setFetchedPeople(true)
      setLoadingPeople(true)

      const load = async () => {
        try {
          let people: any[] = []

          if (user?.college_id) {
            const r = await fetch(`/api/network/discover?limit=10&college=${user.college_id}`)
            if (r.ok) {
              const d = await r.json()
              people = d.people || []
            }
          }

          if (people.length < 6) {
            const r2 = await fetch(`/api/network/discover?limit=12`)
            if (r2.ok) {
              const d2 = await r2.json()
              const existing = new Set(people.map((p) => p.id))
              for (const p of (d2.people || [])) {
                if (!existing.has(p.id)) people.push(p)
              }
            }
          }

          people.sort((a, b) => (b.score || 0) - (a.score || 0))
          setSuggestedPeople(people.slice(0, 6))
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingPeople(false)
        }
      }

      load()
    }
  }, [step, fetchedPeople, user?.college_id])

  // Fetch top communities once on step 5
  useEffect(() => {
    if (step === 5 && !fetchedCommunity) {
      setFetchedCommunity(true)
      setLoadingCommunity(true)

      const load = async () => {
        try {
          const results: any[] = []
          let collegeCommunityId: string | null = null

          // 1. Get user's college community first
          const myCollegeRes = await fetch('/api/community/my-college')
          if (myCollegeRes.ok) {
            const mc = await myCollegeRes.json()
            if (mc.success && mc.communityId) {
              collegeCommunityId = mc.communityId
              setUserCollegeCommunityId(mc.communityId)
              results.push({
                id: mc.communityId,
                display_name: mc.communityName,
                slug: mc.communitySlug,
                member_count: mc.memberCount || 0,
                post_count: 0,
                logo_url: mc.logoUrl || null,
              })
            }
          }

          // 2. Get top communities from sidebar
          const sidebarRes = await fetch('/api/network/sidebar')
          if (sidebarRes.ok) {
            const sidebarData = await sidebarRes.json()
            const topComms: any[] = sidebarData.communities || []
            for (const c of topComms) {
              if (!results.find((r) => r.id === c.id)) {
                results.push({
                  id: c.id,
                  display_name: c.display_name,
                  slug: c.slug,
                  member_count: c.member_count || 0,
                  post_count: 0,
                  logo_url: (c as any).colleges?.logo_url || null,
                })
              }
              if (results.length >= 5) break
            }
          }

          setCommunities(results.slice(0, 5))
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingCommunity(false)
        }
      }

      load()
    }
  }, [step, fetchedCommunity])

  // Confetti
  const fireConfetti = useCallback(async () => {
    const confetti = (await import('canvas-confetti')).default
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#F4A01C', '#A855F7', '#C4B5FD', '#E09410', '#DDD6FE'],
    })
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors: ['#F4A01C', '#A855F7'] })
      confetti({ particleCount: 50, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors: ['#F4A01C', '#A855F7'] })
    }, 280)
  }, [])

  const handleFinish = useCallback(async () => {
    setSaving(true)
    setError('')
    try {
      const payload = JSON.stringify({ headline, bio })
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || 'Failed to save your profile')
      }
      await refetch()
      setShowSuccess(true)
      fireConfetti()
    } catch (err: any) {
      console.error('Onboarding complete error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [headline, bio, refetch, fireConfetti])

  const handleConnect = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/network/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: userId }),
      })
      if (res.ok) {
        setRequestedIds((prev) => new Set([...prev, userId]))
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleJoinCommunity = async (communityId: string, slug: string) => {
    if (joinedIds.has(communityId) || joiningId) return
    setJoiningId(communityId)
    try {
      await fetch(`/api/community/${slug}/join`, { method: 'POST' })
      setJoinedIds((prev) => new Set([...prev, communityId]))
    } catch (err) {
      console.error(err)
    } finally {
      setJoiningId(null)
    }
  }

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      handleFinish()
    }
  }, [step, handleFinish])

  const goBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }, [step])

  const goSkip = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      handleFinish()
    }
  }, [step, handleFinish])

  const handleEnterApp = () => router.push(nextUrl || '/community')

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#F4A01C]/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  const mergedUser = {
    ...user,
    avatar_url: avatarUrl || user?.avatar_url,
    headline,
    bio,
  }
  const score = calculateProfileCompletion(mergedUser as any)

  return (
    <div className="flex-1 flex flex-col">
      {showSuccess ? (
        <div className="flex-1 flex flex-col justify-center py-6">
          <div className="bg-white dark:bg-[#18202A] rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-[#2D3744] p-6 sm:p-8">
            <SuccessScreen
              user={mergedUser}
              score={score}
              connectionsCount={requestedIds.size}
              communitiesCount={joinedIds.size}
              onEnter={handleEnterApp}
            />
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {step > 1 && <ProgressHeader step={step} total={TOTAL_STEPS} />}

          <div className="flex-1 bg-white dark:bg-[#18202A] rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-[#2D3744] p-6 sm:p-8 overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {step === 1 && <StepWelcome onNext={goNext} />}
                {step === 2 && (
                  <StepPhoto
                    user={mergedUser}
                    avatarUrl={avatarUrl}
                    onAvatarUploaded={(url) => setAvatarUrl(url)}
                    onNext={goNext}
                    onBack={goBack}
                    onSkip={goSkip}
                  />
                )}
                {step === 3 && (
                  <StepHeadlineBio
                    user={mergedUser}
                    headline={headline}
                    bio={bio}
                    onHeadlineChange={setHeadline}
                    onBioChange={setBio}
                    onNext={goNext}
                    onBack={goBack}
                    onSkip={goSkip}
                  />
                )}
                {step === 4 && (
                  <StepConnections
                    suggestedPeople={suggestedPeople}
                    loadingPeople={loadingPeople}
                    requestedIds={requestedIds}
                    onConnect={handleConnect}
                    onNext={goNext}
                    onBack={goBack}
                    onSkip={goSkip}
                  />
                )}
                {step === 5 && (
                  <StepCommunity
                    communities={communities}
                    loadingCommunity={loadingCommunity}
                    joinedIds={joinedIds}
                    joiningId={joiningId}
                    userCollegeCommunityId={userCollegeCommunityId}
                    onJoin={handleJoinCommunity}
                    onNext={saving ? () => {} : handleFinish}
                    onBack={goBack}
                    onSkip={saving ? () => {} : handleFinish}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="h-6" />
        </>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#F4A01C]/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  )
}
