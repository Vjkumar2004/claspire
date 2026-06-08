'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, UserX, Loader2, Users, Briefcase, Search, GraduationCap } from 'lucide-react'

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
  college?: { name: string; short_name: string } | null
  accepted_at: string
}

interface MyNetworkTabProps {
  refreshKey?: number
}

export default function MyNetworkTab({ refreshKey = 0 }: MyNetworkTabProps) {
  const router = useRouter()
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
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-2.5 bg-gray-100 rounded w-1/4" />
            </div>
            <div className="h-8 w-24 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-xl">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
          <Users size={20} className="text-gray-300" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">No connections yet</h3>
        <p className="text-xs text-gray-500">Discover people to connect with in the Discover tab</p>
      </div>
    )
  }

  const renderSection = (title: string, items: Connection[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((conn) => (
            <div
              key={conn.connection_id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className={`relative h-8 ${conn.banner_url ? '' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
                {conn.banner_url && (
                  <img src={conn.banner_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3.5 flex items-center gap-3">
              <div
                onClick={() => router.push(`/u/${conn.unique_id}`)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
              >
                {conn.avatar_url ? (
                  <img src={conn.avatar_url} alt={conn.full_name} className="w-full h-full object-cover" />
                ) : (
                  conn.full_name?.substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    onClick={() => router.push(`/u/${conn.unique_id}`)}
                    className="text-sm font-bold text-gray-900 hover:text-purple-600 cursor-pointer truncate"
                  >
                    {conn.full_name}
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                    conn.role === 'senior'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {conn.role === 'senior' ? 'Senior' : 'Student'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {conn.designation && conn.company
                    ? `${conn.designation} at ${conn.company}`
                    : conn.college?.short_name || ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => router.push(`/dashboard/junior/messages?user=${conn.user_id}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1 border border-purple-100"
                >
                  <MessageSquare size={12} />
                  Message
                </button>
                <button
                  onClick={() => router.push(`/u/${conn.unique_id}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Profile
                </button>
                <button
                  onClick={() => handleRemove(conn.connection_id)}
                  disabled={removingId === conn.connection_id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search your connections..."
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
          <h3 className="text-sm font-bold text-gray-900 mb-1">No matching connections</h3>
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
