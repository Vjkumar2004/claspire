'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus, Loader2, Users, Briefcase } from 'lucide-react'

interface FollowingUser {
  id: string
  user_id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  company?: string | null
  designation?: string | null
  branch?: string | null
  college_id?: string | null
  graduation_year?: number | null
  followed_at: string
}

interface FollowingTabProps {
  refreshKey?: number
}

export default function FollowingTab({ refreshKey = 0 }: FollowingTabProps) {
  const router = useRouter()
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unfollowId, setUnfollowId] = useState<string | null>(null)

  useEffect(() => {
    fetchFollowing()
  }, [refreshKey])

  const fetchFollowing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/follow')
      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following || [])
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (userId: string) => {
    setUnfollowId(userId)
    try {
      const res = await fetch('/api/network/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: userId, action: 'unfollow' }),
      })
      if (res.ok) {
        setFollowing((prev) => prev.filter((f) => f.user_id !== userId))
      }
    } catch { } finally {
      setUnfollowId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-purple-600" />
      </div>
    )
  }

  const seniors = following.filter((f) => f.role === 'senior')
  const students = following.filter((f) => f.role === 'student')

  const renderSection = (title: string, items: FollowingUser[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((f) => (
            <div
              key={f.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-purple-200 hover:shadow-sm transition-all"
            >
              <div
                onClick={() => router.push(`/u/${f.unique_id}`)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
              >
                {f.avatar_url ? (
                  <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                ) : (
                  f.full_name?.substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4
                  onClick={() => router.push(`/u/${f.unique_id}`)}
                  className="text-sm font-bold text-gray-900 hover:text-purple-600 cursor-pointer truncate"
                >
                  {f.full_name}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {f.designation && f.company
                    ? `${f.designation} at ${f.company}`
                    : f.branch || f.role}
                </p>
              </div>

              <button
                onClick={() => handleUnfollow(f.user_id)}
                disabled={unfollowId === f.user_id}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Unfollow"
              >
                {unfollowId === f.user_id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserMinus size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <Users size={24} className="text-gray-300" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Not following anyone yet</h3>
        <p className="text-gray-500 text-sm">Follow people in the Discover tab to stay updated</p>
      </div>
    )
  }

  return (
    <div>
      {renderSection('Students', students, <Users size={16} className="text-blue-500" />)}
      {renderSection('Seniors', seniors, <Briefcase size={16} className="text-emerald-500" />)}
    </div>
  )
}
