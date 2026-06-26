'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2, UserPlus, Users, X, Check, GraduationCap, Briefcase, Star } from 'lucide-react'
import { getUserActivityDot } from '@/hooks/useActivityStatus'
import { useAuth } from '@/hooks/useAuth'

interface PeopleCardPerson {
  id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  banner_url?: string | null
  college_id?: string | null
  branch?: string | null
  company?: string | null
  designation?: string | null
  graduation_year?: number | null
  passout_year?: number | null
  experience_years?: number | null
  rise_points?: number | null
  college?: { name: string; short_name: string } | null
  connectionStatus: string
  mutualConnections: number
  score?: number
  isFollowing?: boolean
  last_seen?: string | null
}

interface PeopleCardProps {
  person: PeopleCardPerson
  onConnect?: (userId: string) => Promise<boolean>
  onFollow?: (userId: string, follow: boolean) => Promise<void>
  onRemove?: (connectionId: string) => Promise<void>
  onRespond?: (connectionId: string, action: 'accepted' | 'rejected') => Promise<void>
  onWithdraw?: (connectionId: string) => Promise<void>
  connectionId?: string
  showActions?: boolean
  index?: number
}

/* ── Default banner when no banner_url is set ── */
function ClaspireBanner() {
  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)' }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 96"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cbo1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cbo2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <pattern id="cdots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="1.2" fill="rgba(255,255,255,0.07)" />
          </pattern>
          <linearGradient id="ctxt" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#e0d7ff" />
            <stop offset="45%"  stopColor="#ffffff" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="cline" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0" />
            <stop offset="40%"  stopColor="#7C3AED" />
            <stop offset="60%"  stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="96" fill="url(#cdots)" />
        <ellipse cx="80"  cy="30"  rx="100" ry="80" fill="url(#cbo1)" />
        <ellipse cx="330" cy="70"  rx="110" ry="80" fill="url(#cbo2)" />
        {/* CLASPIRE wordmark */}
        <text
          x="50%" y="46%"
          dominantBaseline="middle" textAnchor="middle"
          fontFamily="'Inter','Segoe UI',Arial,sans-serif"
          fontWeight="900" fontSize="21" letterSpacing="5"
          fill="url(#ctxt)" opacity="0.92"
        >
          CLASPIRE
        </text>
        {/* underline */}
        <rect x="118" y="58" width="164" height="1.5" rx="1" fill="url(#cline)" opacity="0.65" />
        {/* tagline */}
        <text
          x="50%" y="76%"
          dominantBaseline="middle" textAnchor="middle"
          fontFamily="'Inter','Segoe UI',Arial,sans-serif"
          fontWeight="500" fontSize="6" letterSpacing="2.2"
          fill="rgba(255,255,255,0.35)"
        >
          CONNECT · GROW · ACHIEVE
        </text>
        {/* corner sparkles */}
        <circle cx="28" cy="14" r="2"   fill="rgba(124,58,237,0.7)" />
        <circle cx="36" cy="14" r="1.2" fill="rgba(124,58,237,0.4)" />
        <circle cx="28" cy="22" r="1.2" fill="rgba(124,58,237,0.4)" />
        <circle cx="372" cy="82" r="2"   fill="rgba(6,182,212,0.7)"  />
        <circle cx="380" cy="82" r="1.2" fill="rgba(6,182,212,0.4)"  />
        <circle cx="372" cy="74" r="1.2" fill="rgba(6,182,212,0.4)"  />
      </svg>
    </div>
  )
}

export default function PeopleCard({
  person, onConnect, onRemove, onRespond, onWithdraw, connectionId, showActions = true
}: PeopleCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [connecting, setConnecting]   = useState(false)
  const [localStatus, setLocalStatus] = useState(person.connectionStatus)
  const [removing, setRemoving]       = useState(false)
  const [responding, setResponding]   = useState(false)

  const handleConnect = async () => {
    if (!onConnect || connecting) return
    setConnecting(true)
    const prev = localStatus
    setLocalStatus('pending_sent')
    try { const ok = await onConnect(person.id); if (!ok) setLocalStatus(prev) }
    catch { setLocalStatus(prev) }
    finally { setConnecting(false) }
  }

  const handleRemove = async () => {
    if (!onRemove || !connectionId || removing) return
    setRemoving(true)
    try { await onRemove(connectionId) }
    catch { } finally { setRemoving(false) }
  }

  const handleRespond = async (action: 'accepted' | 'rejected') => {
    if (!onRespond || !connectionId || responding) return
    setResponding(true)
    const prev = localStatus
    setLocalStatus(action === 'accepted' ? 'accepted' : 'none')
    try { await onRespond(connectionId, action) }
    catch { setLocalStatus(prev) }
    finally { setResponding(false) }
  }

  const handleWithdraw = async () => {
    if (!onWithdraw || !connectionId || responding) return
    setResponding(true)
    const prev = localStatus
    setLocalStatus('none')
    try { await onWithdraw(connectionId) }
    catch { setLocalStatus(prev) }
    finally { setResponding(false) }
  }

  const handleMessage = () => {
    const base = user?.role === 'senior' ? '/dashboard/senior/messages' : '/dashboard/junior/messages'
    router.push(`${base}?user=${person.id}`)
  }

  const isSenior    = person.role === 'senior'
  const headline    = person.designation && person.company
    ? `${person.designation} · ${person.company}`
    : person.designation || person.branch || (isSenior ? 'Senior' : 'Student')
  const year        = person.graduation_year || person.passout_year
  const collegeName = person.college?.short_name || person.college?.name
  const initials    = person.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const matchScore  = person.score !== undefined ? Math.min(Math.round(person.score), 100) : null
  const scoreCls    = matchScore === null ? '' :
    matchScore >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400' :
    matchScore >= 70 ? 'text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-400' :
    matchScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400' :
    'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'

  return (
    <div
      onClick={() => router.push(`/u/${person.unique_id}`)}
      className="group bg-white dark:bg-[#1A1D24] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm shadow-slate-200/60 dark:shadow-black/30 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* ── Banner ── */}
      <div className="relative h-[76px] lg:h-[88px] overflow-hidden bg-slate-100 dark:bg-[#252830] flex-shrink-0">
        {person.banner_url ? (
          <img
            src={person.banner_url} alt=""
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <ClaspireBanner />
        )}
        {/* bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Match score badge — top right */}
        {matchScore !== null && (
          <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${scoreCls} shadow-sm`}>
            {matchScore}%
          </span>
        )}

        {/* Role pill — top left */}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${isSenior ? 'bg-violet-600/90 text-white' : 'bg-sky-600/90 text-white'}`}>
          {isSenior ? <Briefcase size={8} /> : <GraduationCap size={8} />}
          {isSenior ? 'Senior' : 'Student'}
        </span>
      </div>

      {/* ── Avatar ── */}
      <div className="flex justify-center -mt-7 lg:-mt-8 relative z-[2] px-3">
        <div className="relative">
          <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl border-[3px] border-white dark:border-[#1A1D24] shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${!person.avatar_url ? 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5]' : 'bg-slate-100 dark:bg-[#252830]'}`}>
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-sm lg:text-base font-black text-white">{initials}</span>
            )}
          </div>
          {/* activity dot */}
          {person.last_seen && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1A1D24] ${getUserActivityDot(person.last_seen)}`} />
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="px-3 lg:px-4 pt-2 pb-3 flex flex-col flex-1">
        {/* Name */}
        <h3 className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white text-center leading-tight truncate">
          {person.full_name}
        </h3>

        {/* Headline */}
        <p className="text-[10px] lg:text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center truncate mt-0.5 leading-snug">
          {headline}
        </p>

        {/* College + year */}
        {collegeName && (
          <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-500 text-center truncate mt-0.5">
            {collegeName}{year ? ` · ${year}` : ''}
          </p>
        )}

        {/* Mutual connections */}
        {person.mutualConnections > 0 && (
          <div className="flex justify-center mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40">
              <Users size={9} />
              {person.mutualConnections} mutual
            </span>
          </div>
        )}

        {/* Rise points */}
        {person.rise_points != null && person.rise_points > 0 && (
          <div className="flex justify-center mt-1">
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-500 dark:text-amber-400">
              <Star size={8} className="fill-current" />
              {person.rise_points} pts
            </span>
          </div>
        )}

        {/* spacer */}
        <div className="flex-1" />

        {/* ── Actions ── */}
        {showActions && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5">

            {localStatus === 'none' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleConnect() }}
                disabled={connecting}
                className="w-full h-8 rounded-xl text-[10px] lg:text-xs font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-sm shadow-violet-200 dark:shadow-violet-900/30 border-none cursor-pointer"
              >
                {connecting ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={12} />}
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            )}

            {localStatus === 'pending_sent' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleWithdraw() }}
                disabled={responding}
                className="w-full h-8 rounded-xl text-[10px] lg:text-xs font-semibold flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              >
                {responding ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                {responding ? 'Withdrawing…' : 'Requested'}
              </button>
            )}

            {localStatus === 'pending_received' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRespond('accepted') }}
                  disabled={responding}
                  className="flex-1 h-8 rounded-xl text-[10px] lg:text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 disabled:opacity-50 border-none cursor-pointer"
                >
                  {responding ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />}
                  Accept
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRespond('rejected') }}
                  disabled={responding}
                  className="flex-1 h-8 rounded-xl text-[10px] lg:text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {responding ? <Loader2 size={11} className="animate-spin" /> : <X size={12} />}
                  Ignore
                </button>
              </div>
            )}

            {localStatus === 'accepted' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleMessage() }}
                  className="flex-1 h-8 rounded-xl text-[10px] lg:text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 border-none cursor-pointer"
                >
                  <MessageSquare size={11} />
                  Message
                </button>
                {connectionId && onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove() }}
                    disabled={removing}
                    className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {removing ? <Loader2 size={11} className="animate-spin" /> : <X size={13} />}
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
