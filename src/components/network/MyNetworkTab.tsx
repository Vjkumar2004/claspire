'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, UserX, Loader2, Users, Briefcase, Search, GraduationCap } from 'lucide-react'
import { getUserActivityDot } from '@/hooks/useActivityStatus'
import { useAuth } from '@/hooks/useAuth'

interface Connection {
  connection_id: string
  user_id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  banner_url?: string | null
  company?: string | null
  designation?: string | null
  branch?: string | null
  graduation_year?: number | null
  passout_year?: number | null
  last_seen?: string | null
  college?: { name: string; short_name: string } | null
  accepted_at: string
}

interface MyNetworkTabProps {
  refreshKey?: number
}

export default function MyNetworkTab({ refreshKey = 0 }: MyNetworkTabProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchConnections() }, [refreshKey])

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/connections')
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch { } finally { setLoading(false) }
  }

  const handleRemove = async (connectionId: string) => {
    setRemovingId(connectionId)
    try {
      const res = await fetch('/api/network/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })
      if (res.ok) setConnections((prev) => prev.filter((c) => c.connection_id !== connectionId))
    } catch { } finally { setRemovingId(null) }
  }

  const filtered = connections.filter((c) =>
    !searchQuery || c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const seniors = filtered.filter((c) => c.role === 'senior')
  const students = filtered.filter((c) => c.role === 'student')

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="network-card p-4 flex items-center gap-4 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-[#1D2226]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-[#1D2226] rounded w-1/3" />
              <div className="h-2.5 bg-app dark:bg-[#1D2226] rounded w-1/4" />
            </div>
            <div className="h-8 w-24 bg-gray-100 dark:bg-[#1D2226] rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-12 network-card">
        <div className="w-14 h-14 bg-[#EAF4FF] dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Users size={22} className="text-[#0A66C2] dark:text-purple-300" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No connections yet</h3>
        <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">Discover people to connect with in the Discover tab</p>
      </div>
    )
  }

  const renderSection = (title: string, items: Connection[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-bold text-gray-700 dark:text-white">{title}</h3>
          <span className="text-xs font-semibold text-gray-400 dark:text-[#B0B7BE] bg-gray-100 dark:bg-[#1D2226] px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((conn) => (
            <div
              key={conn.connection_id}
              className="network-card p-3.5 flex items-center gap-3"
            >
              <div
                onClick={() => router.push(`/u/${conn.unique_id}`)}
                className="w-11 h-11 rounded-full bg-gray-100 dark:bg-[#1D2226] flex items-center justify-center text-xs font-black text-gray-400 dark:text-[#B0B7BE] border border-surface dark:border-[#38434F] overflow-hidden cursor-pointer flex-shrink-0"
              >
                {conn.avatar_url ? (
                  <img src={conn.avatar_url} alt={conn.full_name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  conn.full_name?.substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    onClick={() => router.push(`/u/${conn.unique_id}`)}
                    className="text-sm font-bold text-gray-900 dark:text-white hover:text-[#0A66C2] cursor-pointer truncate flex items-center gap-1.5"
                  >
                    <span className="truncate">{conn.full_name}</span>
                    {conn.last_seen && (
                      <span className={`inline-block w-[5px] h-[5px] rounded-full flex-shrink-0 ${getUserActivityDot(conn.last_seen)}`} />
                    )}
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                    conn.role === 'senior'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {conn.role === 'senior' ? 'Senior' : 'Student'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#B0B7BE] mt-0.5 truncate">
                  {conn.designation && conn.company
                    ? `${conn.designation} at ${conn.company}`
                    : conn.college?.short_name || conn.branch || ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    const base = user?.role === 'senior' ? '/dashboard/senior/messages' : '/dashboard/junior/messages'
                    router.push(`${base}?user=${conn.user_id}`)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-connect flex items-center gap-1"
                >
                  <MessageSquare size={12} />
                  Message
                </button>
                <button
                  onClick={() => router.push(`/u/${conn.unique_id}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-[#B0B7BE] bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] hover:bg-app dark:bg-[#1D2226] dark:hover:bg-[#1D2226] hover:border-gray-300 transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={() => handleRemove(conn.connection_id)}
                  disabled={removingId === conn.connection_id}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-[#B0B7BE] hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove connection"
                >
                  {removingId === conn.connection_id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <UserX size={13} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE]" />
        <input
          type="text"
          placeholder="Search your connections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 text-sm border border-surface dark:border-[#38434F] rounded-xl bg-surface dark:bg-[#283036] text-gray-900 dark:text-white outline-none focus:border-[#0A66C2]/50 focus:ring-2 focus:ring-purple-50 dark:focus:ring-purple-900/30 transition-all font-medium"
        />
      </div>

      {searchQuery && filtered.length === 0 ? (
        <div className="text-center py-12 network-card">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-blue-400 dark:text-blue-300" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No matching connections</h3>
          <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">Try a different search term</p>
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
