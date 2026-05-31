'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, MessageSquare, Users, Handshake, Calendar } from 'lucide-react'
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
}

export default function ProfileActionBar({ profileUser, viewer, isOwnProfile }: Props) {
  const router = useRouter()

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

  if (!isSeniorProfile) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={requestMentorship}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
        >
          <GraduationCap size={14} />
          Request Mentorship
        </button>
        <button
          type="button"
          onClick={openMessages}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
        >
          <Users size={14} />
          Connect
        </button>
        <button
          type="button"
          onClick={openMessages}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
        >
          <MessageSquare size={14} />
          Ask Question
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!viewerIsSenior && (
        <>
          <button
            type="button"
            onClick={requestReferral}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors"
          >
            <Handshake size={14} />
            Request Referral
          </button>
          <button
            type="button"
            onClick={bookMentorshipSession}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
          >
            <Calendar size={14} />
            Book Mentorship Session
          </button>
        </>
      )}
      {viewerIsSenior ? (
        <SeniorMessageRequestButton
          targetSeniorId={profileUser.id}
          targetSeniorName={profileUser.full_name}
        />
      ) : (
        <MessageRequestButton
          seniorId={profileUser.id}
          seniorName={profileUser.full_name}
        />
      )}
    </div>
  )
}
