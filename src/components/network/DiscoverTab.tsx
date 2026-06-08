'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Loader2, Users, RefreshCw } from 'lucide-react'
import PeopleCard from './PeopleCard'

interface Person {
  id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
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
}

interface DiscoverTabProps {
  onConnectAction: (userId: string) => Promise<boolean>
  refreshKey?: number
}

export default function DiscoverTab({ onConnectAction, refreshKey = 0 }: DiscoverTabProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const LIMIT = 20

  const fetchPeople = useCallback(async (append: boolean = false, query: string = '', role: string = '') => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    const params = new URLSearchParams()
    params.set('limit', String(LIMIT))
    params.set('offset', append ? String(offset) : '0')
    if (query) params.set('q', query)
    if (role) params.set('role', role)

    try {
      const res = await fetch(`/api/network/discover?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      const list = data.people || []
      setPeople((prev) => (append ? [...prev, ...list] : list))
      setTotal(data.total ?? list.length)
      setHasMore(!!data.hasMore)
      setOffset(append ? offset + LIMIT : LIMIT)
    } catch { } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [offset])

  useEffect(() => {
    fetchPeople(false, '', '')
  }, [refreshKey])

  const handleSearch = () => {
    setOffset(0)
    fetchPeople(false, searchQuery.trim(), roleFilter)
    setAppliedQuery(searchQuery.trim())
  }

  const loadMore = () => {
    if (!hasMore || loadingMore) return
    fetchPeople(true, appliedQuery, roleFilter)
  }

  const handleConnect = async (userId: string): Promise<boolean> => {
    const ok = await onConnectAction(userId)
    if (ok) {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === userId ? { ...p, connectionStatus: 'pending_sent' } : p
        )
      )
    }
    return ok
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search people, colleges, departments, alumni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setOffset(0)
            fetchPeople(false, searchQuery.trim(), e.target.value)
          }}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="senior">Seniors</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[260px] bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : people.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              People You May Know
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {total}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map((person) => (
              <PeopleCard
                key={person.id}
                person={person}
                onConnect={handleConnect}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm"
              >
                {loadingMore ? (
                  <><Loader2 size={16} className="animate-spin" /> Loading...</>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Users size={24} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">No people found</h3>
          <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
          {appliedQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setRoleFilter('')
                setAppliedQuery('')
                setOffset(0)
                fetchPeople(false, '', '')
              }}
              className="text-sm font-bold text-purple-600 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
