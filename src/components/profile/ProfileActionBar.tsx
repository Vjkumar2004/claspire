'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, MessageSquare, Users, Handshake, Calendar, Clock, Check, X, CheckCircle, Loader2, ChevronDown, UserPlus, UserCheck } from 'lucide-react'
import MessageRequestButton from '@/components/MessageRequestButton'
import SeniorMessageRequestButton from '@/components/SeniorMessageRequestButton'

type Props = {
  profileUser: {
    id: string
    role: string
    full_name: string
    unique_id: string
  }
  viewer: { id: string; role: string } | null
  isOwnProfile: boolean
  connectionStatus?: string
  connectionId?: string | null
  followStatus?: string
}

export default function ProfileActionBar({ profileUser, viewer, isOwnProfile, connectionStatus = 'not_connected', connectionId = null, followStatus = 'not_following' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState(connectionStatus)
  const [showDropdown, setShowDropdown] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [localFollow, setLocalFollow] = useState(followStatus)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (isOwnProfile || !viewer) return null

  const isSeniorProfile = profileUser.role === 'senior'
  const viewerIsSenior = viewer.role === 'senior'

  const openMessages = () => {
    const base = viewerIsSenior ? '/dashboard/senior/messages' : '/dashboard/junior/messages'
    router.push(`${base}?user=${profileUser.id}`)
  }

  const requestMentorship = () => {
    if (viewerIsSenior) {
      openMessages()
    } else {
      router.push('/seniors')
    }
  }

  const requestReferral = () => {
    router.push('/jobs')
  }

  const bookMentorshipSession = () => {
    if (!viewerIsSenior && isSeniorProfile) {
      router.push('/seniors')
    } else {
      openMessages()
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: profileUser.id }),
      })
      if (res.ok) {
        setLocalStatus('pending_sent')
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!connectionId) return
    setLoading(true)
    try {
      const res = await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId, action: 'accepted' }),
      })
      if (res.ok) {
        setLocalStatus('connected')
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleIgnore = async () => {
    if (!connectionId) return
    setLoading(true)
    try {
      await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId, action: 'rejected' }),
      })
      setLocalStatus('not_connected')
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    console.log('handleRemove entered')
    if (!connectionId) return
    setRemoving(true)
    try {
      const res = await fetch('/api/network/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })
      if (res.ok) {
        console.log('API success')
        setLocalStatus('not_connected')
        setShowDropdown(false)
      }
    } catch { } finally {
      setRemoving(false)
    }
  }

  const handleFollow = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: profileUser.id, action: 'follow' }),
      })
      if (res.ok) {
        setLocalFollow('following')
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: profileUser.id, action: 'unfollow' }),
      })
      if (res.ok) {
        setLocalFollow('not_following')
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const followButton = () => {
    if (localStatus === 'connected') return null
    return (
      <button
        onClick={localFollow === 'following' ? handleUnfollow : handleFollow}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
          localFollow === 'following'
            ? 'bg-gray-100 dark:bg-[#283036] text-gray-600 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] hover:bg-gray-200 dark:hover:bg-[#1D2226]'
            : 'bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] text-slate-700 dark:text-[#B0B7BE] hover:bg-purple-50 dark:hover:bg-[#1D2226] hover:border-purple-200 hover:text-purple-600'
        }`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : localFollow === 'following' ? (
          <UserCheck size={14} />
        ) : (
          <UserPlus size={14} />
        )}
        {localFollow === 'following' ? 'Following' : 'Follow'}
      </button>
    )
  }

  const connectionButtons = () => {
    if (localStatus === 'pending_sent') {
      return (
        <button disabled className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold cursor-not-allowed">
          <Clock size={14} />
          Pending
        </button>
      )
    }

    if (localStatus === 'pending_received') {
      return (
        <div className="flex gap-2">
          <button onClick={handleAccept} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Accept
          </button>
          <button onClick={handleIgnore} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface dark:bg-[#283036] border border-red-200 dark:border-[#38434F] text-red-600 text-xs font-bold hover:bg-red-50 dark:hover:bg-[#1D2226] transition-colors disabled:opacity-50">
            <X size={14} />
            Ignore
          </button>
        </div>
      )
    }

    if (localStatus === 'connected') {
      return (
        <div className="flex gap-2">
          <button onClick={openMessages} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">
            <MessageSquare size={14} />
            Message
          </button>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => {
                console.log('dropdown opened')
                setShowDropdown(!showDropdown)
              }} 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] text-slate-700 dark:text-[#B0B7BE] text-xs font-bold hover:border-emerald-200 hover:text-emerald-600 transition-colors"
            >
              <CheckCircle size={14} />
              Connected
              <ChevronDown size={12} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-xl shadow-lg z-50 py-1">
                <button
                  onClick={() => {
                    console.log('remove clicked')
                    handleRemove()
                  }}
                  disabled={removing}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-[#1D2226] transition-colors"
                >
                  {removing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Remove Connection
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <button onClick={handleConnect} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] text-slate-700 dark:text-[#B0B7BE] text-xs font-bold hover:bg-purple-50 dark:hover:bg-[#1D2226] hover:border-purple-200 hover:text-purple-600 transition-colors disabled:opacity-50">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
        Connect
      </button>
    )
  }

  if (!isSeniorProfile) {
    return (
      <div className="flex flex-wrap gap-2">
        {connectionButtons()}
        {followButton()}
        <button onClick={openMessages} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] text-slate-700 dark:text-[#B0B7BE] text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors">
          <MessageSquare size={14} />
          Message
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!viewerIsSenior && (
        <>
          <button onClick={requestReferral} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors">
            <Handshake size={14} />
            Request Referral
          </button>
          <button onClick={bookMentorshipSession} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors">
            <Calendar size={14} />
            Book Mentorship Session
          </button>
        </>
      )}
      {connectionButtons()}
      {followButton()}
      {/* 
        Legacy message request system is being phased out and replaced by Network connections.
        {viewerIsSenior ? (
          <SeniorMessageRequestButton targetSeniorId={profileUser.id} targetSeniorName={profileUser.full_name} />
        ) : (
          <MessageRequestButton seniorId={profileUser.id} seniorName={profileUser.full_name} />
        )}
      */}
    </div>
  )
}
