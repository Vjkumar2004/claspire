'use client'

import { useState, useEffect } from 'react'
import { Loader2, User as UserIcon } from 'lucide-react'

interface BlockedUser {
  id: string
  blocked_id: string
  created_at: string
  full_name: string
  avatar_url?: string
  unique_id?: string
  role?: string
}

export default function BlockedUsersList() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    fetchBlockedUsers()
  }, [])

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/block/list')
      if (res.ok) {
        const data = await res.json()
        setBlockedUsers(data.blocked_users || [])
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (blockedId: string) => {
    setUnblocking(blockedId)
    try {
      const res = await fetch('/api/block/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_id: blockedId })
      })

      if (res.ok) {
        setBlockedUsers(prev => prev.filter(user => user.blocked_id !== blockedId))
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setUnblocking(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
        Blocked Users
      </h3>

      {blockedUsers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No blocked users</p>
        </div>
      ) : (
        <div className="space-y-1">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={16} className="text-gray-400" />
                  )}
                </div>
                
                <div>
                  <p className="text-white text-sm font-medium">
                    {user.full_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-400 text-xs">
                      @{user.unique_id}
                    </span>
                    {user.role && (
                      <>
                        <span className="text-gray-600 text-xs">•</span>
                        <span className="text-gray-500 text-xs capitalize">
                          {user.role}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleUnblock(user.blocked_id)}
                disabled={unblocking === user.blocked_id}
                className="border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg px-3 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {unblocking === user.blocked_id ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : null}
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
