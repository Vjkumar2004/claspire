'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, Loader2, UserPlus, UserCheck, GraduationCap, Briefcase, Users, X } from 'lucide-react'

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
  rise_points?: number | null
  college?: { name: string; short_name: string } | null
  connectionStatus: string
  mutualConnections: number
  score?: number
  isFollowing?: boolean
}

interface PeopleCardProps {
  person: PeopleCardPerson
  onConnect?: (userId: string) => Promise<boolean>
  onFollow?: (userId: string, follow: boolean) => Promise<void>
  onRemove?: (connectionId: string) => Promise<void>
  connectionId?: string
  showActions?: boolean
}

export default function PeopleCard({ person, onConnect, onFollow, onRemove, connectionId, showActions = true }: PeopleCardProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [following, setFollowing] = useState(person.isFollowing || false)
  const [followLoading, setFollowLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState(person.connectionStatus)
  const [removing, setRemoving] = useState(false)

  console.log('Rendering banner for', person.full_name, 'URL:', person.banner_url)

  const roleLabel = person.role === 'senior' ? 'Senior' : 'Student'

  const roleColor = person.role === 'senior'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-blue-50 text-blue-700 border-blue-100'

  const handleConnect = async () => {
    if (!onConnect || connecting) return
    setConnecting(true)
    try {
      const ok = await onConnect(person.id)
      if (ok) setLocalStatus('pending_sent')
    } catch { } finally {
      setConnecting(false)
    }
  }

  const handleFollow = async () => {
    if (!onFollow || followLoading) return
    setFollowLoading(true)
    try {
      await onFollow(person.id, !following)
      setFollowing(!following)
    } catch { } finally {
      setFollowLoading(false)
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

  const handleMessage = () => {
    router.push(`/dashboard/junior/messages?user=${person.id}`)
  }

  const headline = person.designation && person.company
    ? `${person.designation} at ${person.company}`
    : person.designation
    ? person.designation
    : person.role === 'senior'
    ? 'Senior'
    : 'Student'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
      {/* Banner */}
      <div className={`relative h-16 md:h-20 border-b border-gray-100 flex-shrink-0 ${person.banner_url ? '' : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10'}`}>
        {person.banner_url && (
          <img src={person.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div
          onClick={() => router.push(`/u/${person.unique_id}`)}
          className="absolute -bottom-7 md:-bottom-10 left-4 md:left-5 w-14 h-14 md:w-20 md:h-20 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-lg md:text-2xl font-black text-gray-500 overflow-hidden shadow-sm cursor-pointer hover:border-purple-100 transition-all z-10"
        >
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
          ) : (
            person.full_name?.substring(0, 2).toUpperCase() || '?'
          )}
        </div>
        {/* Same college indicator */}
        {person.college && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[9px] md:text-[10px] font-semibold text-white">
            <GraduationCap size={10} />
            <span className="truncate max-w-[60px] md:max-w-none">{person.college.short_name || person.college.name}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-10 md:pt-14 px-4 md:px-5 pb-4 md:pb-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => router.push(`/u/${person.unique_id}`)}
              className="text-base md:text-lg font-extrabold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors truncate"
            >
              {person.full_name}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 font-medium truncate mt-0.5">{headline}</p>
          </div>
        </div>

        {/* College + Branch */}
        {person.college && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <GraduationCap size={14} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{person.college.name}</span>
          </p>
        )}

        {/* Mutual Connections */}
        {person.mutualConnections > 0 && (
          <div className="items-center gap-1.5 mt-2 text-[10px] md:text-xs font-medium text-gray-500 hidden sm:flex">
            <Users size={12} className="text-gray-400" />
            <span>{person.mutualConnections} mutual connection{person.mutualConnections !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {localStatus === 'none' && (
              <>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex-1 h-9 md:h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_2px_8px_rgba(124,58,237,0.2)] hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
                >
                  {connecting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>Connect</span>
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-1 sm:flex-none h-9 md:h-10 px-4 rounded-xl text-xs md:text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                    following
                      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {followLoading ? <Loader2 size={16} className="animate-spin" /> : following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  <span>{following ? 'Following' : 'Follow'}</span>
                </button>
              </>
            )}

            {localStatus === 'pending_sent' && (
              <button
                disabled
                className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg py-1.5 md:py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
              >
                <Clock size={14} />
                <span>Pending</span>
              </button>
            )}

            {localStatus === 'pending_received' && (
              <button
                disabled
                className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-1.5 md:py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
              >
                <UserPlus size={14} />
                <span>Respond</span>
              </button>
            )}

            {localStatus === 'accepted' && (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={handleMessage}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 md:py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare size={14} />
                  <span>Message</span>
                </button>
                {connectionId && onRemove && (
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="flex-1 sm:flex-none px-3 py-1.5 md:py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 transition-colors flex items-center justify-center gap-1.5 group/remove hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    {removing ? <Loader2 size={12} className="animate-spin" /> : <X size={14} className="sm:hidden group-hover/remove:block" />}
                    <UserCheck size={14} className="hidden sm:block group-hover/remove:hidden text-emerald-600" />
                    <span className="sm:hidden group-hover/remove:inline">Remove</span>
                    <span className="hidden sm:inline group-hover/remove:hidden">Connected</span>
                    <span className="hidden sm:hidden group-hover/remove:inline">Remove</span>
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
