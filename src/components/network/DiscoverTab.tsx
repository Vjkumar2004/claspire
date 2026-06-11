'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, SlidersHorizontal, Loader2, Users, ChevronRight } from 'lucide-react'
import PeopleCard from './PeopleCard'

interface Person {
  id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  banner_url?: string | null
  college_id?: string | null
  branch?: string | null
  company?: string | null
  designation?: string | null
  graduation_year?: number | null
  passout_year?: number | null
  rise_points?: number | null
  college?: { name: string; short_name: string } | null
  connectionStatus: string
  isFollowing?: boolean
  mutualConnections: number
  score?: number
  last_seen?: string | null
}

interface DiscoverCache {
  people: Person[]
  total: number
  hasMore: boolean
  offset: number
  fetchedAt: number
}

const CACHE_KEY = 'network_discover_cache'
const CACHE_TTL = 300000

function getDiscoverCache(): DiscoverCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: DiscoverCache = JSON.parse(raw)
    if (Date.now() - cache.fetchedAt > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return cache
  } catch {
    return null
  }
}

function setDiscoverCache(data: DiscoverCache): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {}
}

interface DiscoverTabProps {
  onConnectAction: (userId: string) => Promise<boolean>
}

export default function DiscoverTab({ onConnectAction }: DiscoverTabProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const peopleRef = useRef<Person[]>([])

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
      const newTotal = data.total ?? list.length
      const newHasMore = !!data.hasMore
      const newOffset = append ? offset + LIMIT : LIMIT

      const updatedPeople = append ? [...peopleRef.current, ...list] : list
      peopleRef.current = updatedPeople
      setPeople(updatedPeople)
      setTotal(newTotal)
      setHasMore(newHasMore)
      setOffset(newOffset)

      setDiscoverCache({
        people: updatedPeople,
        total: newTotal,
        hasMore: newHasMore,
        offset: newOffset,
        fetchedAt: Date.now(),
      })
    } catch { } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [offset])

  useEffect(() => {
    const cached = getDiscoverCache()
    if (cached) {
      peopleRef.current = cached.people
      setPeople(cached.people)
      setTotal(cached.total)
      setHasMore(cached.hasMore)
      setOffset(cached.offset)
      setLoading(false)
      return
    }
    fetchPeople(false, '', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const updated = peopleRef.current.map((p) =>
        p.id === userId ? { ...p, connectionStatus: 'pending_sent' } : p
      )
      peopleRef.current = updated
      setPeople(updated)
      setDiscoverCache({ people: updated, total, hasMore, offset, fetchedAt: Date.now() })
    }
    return ok
  }

  const filterChips = [
    { value: '', label: 'All' },
    { value: 'student', label: 'Students' },
    { value: 'senior', label: 'Seniors' },
    { value: 'alumni', label: 'Alumni' },
  ]

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 lg:p-4 mb-4 lg:mb-6 flex items-center gap-2 lg:gap-3 transition-all duration-300">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            className="w-full h-10 lg:h-[52px] pl-9 lg:pl-11 pr-8 lg:pr-20 text-xs lg:text-sm border border-gray-200 rounded-xl bg-white text-gray-900 outline-none focus:border-purple-400 focus:ring-[3px] focus:ring-purple-500/15 transition-all duration-200 font-medium placeholder:text-gray-400"
          />
          <div className="hidden lg:flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center gap-1.5 text-[10px] font-semibold text-gray-400 bg-gray-100/80 border border-gray-200/60 rounded-lg px-2 py-1 pointer-events-none">
            <span className="text-[9px]">⌘</span>K
          </div>
        </div>

        {/* Filter Chips - Desktop only */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-shrink-0">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => {
                setRoleFilter(chip.value)
                setOffset(0)
                fetchPeople(false, searchQuery.trim(), chip.value)
              }}
              className={`px-4 py-2.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap ${
                roleFilter === chip.value
                  ? 'filter-chip-active'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {chip.label}
            </button>
          ))}

          {/* Filters Button (desktop) */}
          <button className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-full border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all whitespace-nowrap">
            <SlidersHorizontal size={13} />
            Filters
          </button>
        </div>

        {/* Filter Button (mobile only) */}
        <button className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all flex-shrink-0">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200/90 overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="h-[80px] lg:h-[90px] bg-gray-100" />
              <div className="px-3 lg:px-4 pb-2.5 lg:pb-3 pt-1 lg:pt-1.5 space-y-1.5 lg:space-y-2">
                <div className="flex justify-center -mt-[21px] lg:-mt-8 mb-1">
                  <div className="w-[42px] h-[42px] lg:w-16 lg:h-16 rounded-full border-[3px] lg:border-[4px] border-white bg-gray-100 shadow-md" />
                </div>
                <div className="h-3 lg:h-3.5 bg-gray-100 rounded w-2/3 mx-auto" />
                <div className="h-2 lg:h-2.5 bg-gray-50 rounded w-1/2 mx-auto" />
                <div className="h-2 bg-gray-50 rounded w-1/3 mx-auto" />
                <div className="mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-gray-100">
                  <div className="h-7 lg:h-8 bg-gray-100 rounded-lg w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : people.length > 0 ? (
        <>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 lg:mb-5">
            <div>
              <h3 className="text-sm lg:text-lg font-bold text-gray-900 flex items-center gap-2">
                People You May Know
                <span className="text-[10px] lg:text-xs font-semibold text-gray-400 bg-gray-100 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full">
                  {total}
                </span>
              </h3>
              <p className="hidden lg:block text-sm text-gray-500 mt-1">Professionals and students relevant to your network</p>
            </div>
            <button className="hidden lg:flex text-sm font-semibold text-purple-600 hover:text-purple-700 items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>

          {/* People Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
            {people.map((person, i) => (
              <PeopleCard
                key={person.id}
                person={person}
                onConnect={handleConnect}
                index={i}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-2.5 rounded-xl text-sm font-bold btn-connect flex items-center gap-2 disabled:opacity-60"
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
        <div className="text-center py-16 network-card">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-purple-400" />
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
