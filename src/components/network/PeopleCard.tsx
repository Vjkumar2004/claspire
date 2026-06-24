'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, Loader2, UserPlus, Users, X, Check } from 'lucide-react'
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

function ClaspireBanner() {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#1E1B4B] flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, white 1.5px, transparent 0)', backgroundSize: '30px 30px' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#312E81]/40 via-transparent to-[#0A2540]/20" />
      <span className="relative text-[15px] lg:text-lg font-extrabold tracking-[0.2em] bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent select-none">
        CLASPIRE
      </span>
    </div>
  )
}

export default function PeopleCard({ person, onConnect, onRemove, onRespond, onWithdraw, connectionId, showActions = true }: PeopleCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [localStatus, setLocalStatus] = useState(person.connectionStatus)
  const [removing, setRemoving] = useState(false)
  const [responding, setResponding] = useState(false)

  const handleConnect = async () => {
    if (!onConnect || connecting) return
    setConnecting(true)
    const prevStatus = localStatus
    setLocalStatus('pending_sent')
    try {
      const ok = await onConnect(person.id)
      if (!ok) setLocalStatus(prevStatus)
    } catch {
      setLocalStatus(prevStatus)
    } finally {
      setConnecting(false)
    }
  }

  const handleRemove = async () => {
    if (!onRemove || !connectionId || removing) return
    setRemoving(true)
    try {
      await onRemove(connectionId)
    } catch { } finally {
      setRemoving(false)
    }
  }

  const handleRespond = async (action: 'accepted' | 'rejected') => {
    if (!onRespond || !connectionId || responding) return
    setResponding(true)
    const prevStatus = localStatus
    if (action === 'accepted') setLocalStatus('accepted')
    else setLocalStatus('none')
    try {
      await onRespond(connectionId, action)
    } catch {
      setLocalStatus(prevStatus)
    } finally {
      setResponding(false)
    }
  }

  const handleWithdraw = async () => {
    if (!onWithdraw || !connectionId || responding) return
    setResponding(true)
    const prevStatus = localStatus
    setLocalStatus('none')
    try {
      await onWithdraw(connectionId)
    } catch {
      setLocalStatus(prevStatus)
    } finally {
      setResponding(false)
    }
  }

  const handleMessage = () => {
    const base = user?.role === 'senior' ? '/dashboard/senior/messages' : '/dashboard/junior/messages'
    router.push(`${base}?user=${person.id}`)
  }

  const headline = person.designation && person.company
    ? `${person.designation} at ${person.company}`
    : person.designation
    ? person.designation
    : person.branch
    ? person.branch
    : person.role === 'senior' ? 'Senior' : 'Student'

  const year = person.graduation_year || person.passout_year
  const collegeName = person.college?.short_name || person.college?.name

  const matchScore = person.score !== undefined ? Math.min(Math.round(person.score), 100) : null

  const scoreColor = matchScore !== null
    ? matchScore >= 90
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : matchScore >= 70
        ? 'text-[#F4A01C] bg-[#FFF3D6] border-[#F4A01C]/30'
        : matchScore >= 50
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : 'text-gray-500 dark:text-[#B0B7BE] bg-app dark:bg-[#1D2226] border-surface dark:border-[#38434F]'
    : ''

  return (
    <div
      onClick={() => router.push(`/u/${person.unique_id}`)}
      className="group bg-surface dark:bg-[#283036] rounded-xl border border-surface dark:border-[#38434F]/90 dark:border-[#38434F]/90 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden hover:-translate-y-[2px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.09)] transition-all duration-300 relative cursor-pointer"
    >
      {/* Banner */}
      <div className="relative h-[80px] lg:h-[90px] overflow-hidden bg-gray-100 dark:bg-[#1D2226]">
        {person.banner_url ? (
          <img
            src={person.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <ClaspireBanner />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>

      {/* Avatar */}
      <div className="flex justify-center -mt-[26px] lg:-mt-8 relative z-[2]">
        <div className="w-[52px] h-[52px] lg:w-16 lg:h-16 rounded-full border-[3px] lg:border-[4px] border-white bg-gray-100 dark:bg-[#1D2226] flex items-center justify-center overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow ring-1 ring-black/10 dark:ring-[#1D2226]/10">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-sm lg:text-base font-black text-gray-400 dark:text-[#B0B7BE]">
              {person.full_name?.substring(0, 2).toUpperCase() || '?'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 lg:px-4 pb-2.5 lg:pb-3 pt-1 lg:pt-1.5 relative z-[2]">
        <h3 className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white text-center leading-tight truncate flex items-center justify-center gap-1.5">
          <span className="truncate">{person.full_name}</span>
          {person.last_seen && (
            <span className={`inline-block w-[6px] h-[6px] rounded-full flex-shrink-0 ${getUserActivityDot(person.last_seen)}`} />
          )}
        </h3>

        <p className="text-[10px] lg:text-xs text-gray-500 dark:text-[#B0B7BE] font-medium text-center truncate leading-snug">{headline}</p>

        {collegeName && (
          <div className="flex items-center justify-center mt-0.5">
            <span className="text-[9px] lg:text-[10px] text-gray-400 dark:text-[#B0B7BE] truncate leading-snug">
              {collegeName}{year ? `, ${year}` : ''}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5 lg:mt-2">
          {matchScore !== null && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] font-semibold border ${scoreColor}`}>
              {matchScore}%
            </span>
          )}

          {person.mutualConnections > 0 && (
            <span className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-medium text-[#F4A01C] bg-[#FFF3D6]/80 px-1.5 py-0.5 rounded-full border border-[#F4A01C]/20/60">
              <Users size={10} />
              {person.mutualConnections}
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-2 lg:mt-2.5 pt-2 lg:pt-2 border-t border-surface dark:border-[#38434F]">
            {localStatus === 'none' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleConnect() }}
                disabled={connecting}
                className="w-full h-7 lg:h-8 rounded-lg text-[10px] lg:text-xs font-semibold text-white bg-[#F4A01C] hover:bg-[#E09410] flex items-center justify-center gap-1 disabled:opacity-50 transition-all duration-200"
              >
                {connecting ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={12} />}
                Connect
              </button>
            )}

            {localStatus === 'pending_sent' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleWithdraw() }}
                disabled={responding}
                className="w-full h-7 lg:h-8 rounded-lg text-[10px] lg:text-xs font-semibold flex items-center justify-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                {responding ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                {responding ? 'Withdrawing...' : 'Withdraw'}
              </button>
            )}

            {localStatus === 'pending_received' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRespond('accepted') }}
                  disabled={responding}
                  className="flex-1 h-7 lg:h-8 rounded-lg text-[10px] lg:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {responding ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />}
                  Accept
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRespond('rejected') }}
                  disabled={responding}
                  className="flex-1 h-7 lg:h-8 rounded-lg text-[10px] lg:text-xs font-semibold border border-surface dark:border-[#38434F] bg-surface dark:bg-[#283036] text-gray-500 dark:text-[#B0B7BE] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
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
                  className="flex-1 h-7 lg:h-8 rounded-lg text-[10px] lg:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                >
                  <MessageSquare size={11} />
                  Message
                </button>
                {connectionId && onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove() }}
                    disabled={removing}
                    className="h-7 lg:h-8 px-2 rounded-lg text-[10px] lg:text-xs font-semibold border border-surface dark:border-[#38434F] bg-surface dark:bg-[#283036] text-gray-500 dark:text-[#B0B7BE] transition-all flex items-center justify-center hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                  >
                    {removing ? <Loader2 size={11} className="animate-spin" /> : <X size={12} />}
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
