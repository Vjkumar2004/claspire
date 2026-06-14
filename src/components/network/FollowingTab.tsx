'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus, Loader2, Users, Briefcase, Search } from 'lucide-react'
import PeopleCard from './PeopleCard'

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
  last_seen?: string | null
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

  const handleConnectAction = async (userId: string): Promise<boolean> => {
    // For following tab, this is handled by handleUnfollow
    return false
  }

  const filtered = following.filter((f) =>
    !searchQuery || f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const seniors = filtered.filter((f) => f.role === 'senior')
  const students = filtered.filter((f) => f.role === 'student')

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-[#283036] rounded-xl border border-gray-200/90 dark:border-[#38434F] overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="h-[80px] lg:h-[90px] bg-gray-100 dark:bg-[#1D2226]" />
            <div className="px-3 lg:px-4 pb-2.5 lg:pb-3 pt-1 lg:pt-1.5 space-y-1.5 lg:space-y-2">
              <div className="flex justify-center -mt-[21px] lg:-mt-8 mb-1">
                <div className="w-[42px] h-[42px] lg:w-16 lg:h-16 rounded-full border-[3px] lg:border-[4px] border-white dark:border-[#283036] bg-gray-100 dark:bg-[#1D2226] shadow-md" />
              </div>
              <div className="h-3 lg:h-3.5 bg-gray-100 dark:bg-[#38434F] rounded w-2/3 mx-auto" />
              <div className="h-2 lg:h-2.5 bg-gray-50 dark:bg-[#38434F] rounded w-1/2 mx-auto" />
              <div className="h-2 bg-gray-50 dark:bg-[#38434F] rounded w-1/3 mx-auto" />
              <div className="mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-gray-100 dark:border-[#38434F]">
                <div className="h-7 lg:h-8 bg-gray-100 dark:bg-[#38434F] rounded-lg w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderSection = (title: string, items: FollowingUser[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          {icon}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <span className="text-xs font-semibold text-gray-400 dark:text-[#B0B7BE] bg-gray-100 dark:bg-[#1D2226] px-3 py-1 rounded-full">{items.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
          {items.map((f) => (
            <PeopleCard
              key={f.id}
              person={{
                id: f.user_id,
                full_name: f.full_name,
                unique_id: f.unique_id,
                role: f.role,
                avatar_url: f.avatar_url,
                banner_url: f.banner_url,
                company: f.company,
                designation: f.designation,
                branch: f.branch,
                college_id: f.college_id,
                graduation_year: f.graduation_year,
                last_seen: f.last_seen,
                connectionStatus: 'none',
                mutualConnections: 0,
                isFollowing: true,
              }}
              onConnect={handleConnectAction}
              showActions={false}
            />
          ))}
        </div>
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-[#283036] rounded-2xl border border-gray-200 dark:border-[#38434F]">
        <div className="w-16 h-16 bg-gray-50 dark:bg-[#1D2226] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-gray-300 dark:text-[#B0B7BE]" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Not following anyone yet</h3>
        <p className="text-sm text-gray-500 dark:text-[#B0B7BE]">Follow people in the Discover tab to stay updated</p>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE]" />
        <input
          type="text"
          placeholder="Search who you follow..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 dark:border-[#38434F] rounded-xl bg-white dark:bg-[#1D2226] text-gray-900 dark:text-white outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-50 dark:focus:ring-purple-900/30 transition-all font-medium"
        />
      </div>

      {searchQuery && filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#283036] rounded-2xl border border-gray-200 dark:border-[#38434F]">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#1D2226] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-300 dark:text-[#B0B7BE]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">No matching results</h3>
          <p className="text-sm text-gray-500 dark:text-[#B0B7BE]">Try a different search term</p>
        </div>
      ) : (
        <>
          {renderSection('Students', students, <Users size={18} className="text-blue-500" />)}
          {renderSection('Seniors', seniors, <Briefcase size={18} className="text-emerald-500" />)}
        </>
      )}
    </div>
  )
}
