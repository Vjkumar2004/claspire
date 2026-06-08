'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, UserX, Loader2, Users, Briefcase } from 'lucide-react'

interface Connection {
  connection_id: string
  user_id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
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

  useEffect(() => {
    fetchConnections()
  }, [refreshKey])

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/connections')
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (connectionId: string) => {
    setRemovingId(connectionId)
    try {
      const res = await fetch('/api/network/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.connection_id !== connectionId))
      }
    } catch { } finally {
      setRemovingId(null)
    }
  }

  const handleMessage = (userId: string) => {
    router.push(`/dashboard/junior/messages?user=${userId}`)
  }

  const seniors = connections.filter((c) => c.role === 'senior')
  const students = connections.filter((c) => c.role === 'student')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-purple-600" />
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <Users size={24} className="text-gray-300" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">No connections yet</h3>
        <p className="text-gray-500 text-sm">Discover people to connect with in the Discover tab</p>
      </div>
    )
  }

  const renderSection = (title: string, items: Connection[], icon: React.ReactNode) => {
    if (items.length === 0) return null
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="space-y-3">
          {items.map((conn) => (
            <div
              key={conn.connection_id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-purple-200 hover:shadow-sm transition-all"
            >
              <div
                onClick={() => router.push(`/u/${conn.unique_id}`)}
                className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    conn.role === 'senior'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {conn.role === 'senior' ? 'Senior' : 'Student'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {conn.designation && conn.company
                    ? `${conn.designation} at ${conn.company}`
                    : conn.college?.short_name || ''}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleMessage(conn.user_id)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5 border border-purple-100"
                >
                  <MessageSquare size={13} />
                  Message
                </button>
                <button
                  onClick={() => router.push(`/u/${conn.unique_id}`)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Profile
                </button>
                <button
                  onClick={() => handleRemove(conn.connection_id)}
                  disabled={removingId === conn.connection_id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove connection"
                >
                  {removingId === conn.connection_id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserX size={14} />
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
      {renderSection('Students', students, <Users size={16} className="text-blue-500" />)}
      {renderSection('Seniors', seniors, <Briefcase size={16} className="text-emerald-500" />)}
    </div>
  )
}
