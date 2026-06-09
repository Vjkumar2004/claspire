'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus, Loader2, Users, Briefcase, Search } from 'lucide-react'

interface FollowingUser {
  id: string
  user_id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  banner_url?: string | null
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
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchFollowing() }, [refreshKey])

  const fetchFollowing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/follow')
      if (res.ok) {
        const data = await res.json()
        setFollowing(data.following || [])
      }
    } catch { } finally { setLoading(false) }
  }

  const handleUnfollow = async (userId: string) => {
    setUnfollowId(userId)
    try {
      const res = await fetch('/api/network/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: userId, action: 'unfollow' }),
      })
      if (res.ok) setFollowing((prev) => prev.filter((f) => f.user_id !== userId))
    } catch { } finally { setUnfollowId(null) }
  }

  const filtered = following.filter((f) =>
    !searchQuery || f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const seniors = filtered.filter((f) => f.role === 'senior')
  const students = filtered.filter((f) => f.role === 'student')

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-2.5 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="h-7 w-7 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  const renderSection = (title: string, items: FollowingUser[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-4">
          {items.map((f) => (
            <div
              key={f.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
            >
              <div className={`relative h-8 ${f.banner_url ? '' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
                {f.banner_url && (
                  <img src={f.banner_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3.5 flex items-center gap-3">
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
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Unfollow"
              >
                {unfollowId === f.user_id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <UserMinus size={13} />
                )}
              </button>
            </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-xl">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
          <Users size={20} className="text-gray-300" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">Not following anyone yet</h3>
        <p className="text-xs text-gray-500">Follow people in the Discover tab to stay updated</p>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search who you follow..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
        />
      </div>

      {searchQuery && filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-xl">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
            <Search size={20} className="text-gray-300" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">No matching results</h3>
          <p className="text-xs text-gray-500">Try a different search term</p>
        </div>
      ) : (
        <>
          {renderSection('Students', students, <Users size={16} className="text-blue-500" />)}
          {renderSection('Seniors', seniors, <Briefcase size={16} className="text-emerald-500" />)}
        </>
      )}
    </div>
  )
}
