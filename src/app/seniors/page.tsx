'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Building2,
  Filter,
  Loader2,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import MessageRequestButton from '@/components/MessageRequestButton'
import SeniorMessageRequestButton from '@/components/SeniorMessageRequestButton'

interface Senior {
  id: string
  full_name: string
  unique_id: string
  designation: string
  company: string
  graduation_year: number
  avatar_url?: string
  rise_points: number
  college_id: string
  college: {
    name: string
    short_name: string
    location: string
    state?: string
  }
}

interface CollegeOption {
  id: string
  name: string
  short_name: string
  location: string
  state?: string
}

interface FilterMeta {
  colleges: CollegeOption[]
  companies: string[]
  locations: string[]
}

const PAGE_SIZE = 12
const FEATURED_SIZE = 9

export default function SeniorsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [isFeaturedView, setIsFeaturedView] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [location, setLocation] = useState('')
  const [company, setCompany] = useState('')

  const [appliedFilters, setAppliedFilters] = useState({
    q: '',
    college: '',
    location: '',
    company: '',
  })

  const [filterMeta, setFilterMeta] = useState<FilterMeta>({
    colleges: [],
    companies: [],
    locations: [],
  })

  const hasActiveFilters = useMemo(
    () =>
      !!(
        appliedFilters.q ||
        appliedFilters.college ||
        appliedFilters.location ||
        appliedFilters.company
      ),
    [appliedFilters]
  )

  const buildQueryString = (
    offset: number,
    featured: boolean,
    filters: typeof appliedFilters
  ) => {
    const active = !!(filters.q || filters.college || filters.location || filters.company)
    const params = new URLSearchParams()
    params.set('limit', featured && !active ? String(FEATURED_SIZE) : String(PAGE_SIZE))
    params.set('offset', String(offset))
    if (featured && !active) params.set('featured', 'true')
    if (filters.q) params.set('q', filters.q)
    if (filters.college) params.set('college', filters.college)
    if (filters.location) params.set('location', filters.location)
    if (filters.company) params.set('company', filters.company)
    if (user?.id) params.set('exclude_id', user.id)
    return params.toString()
  }

  const fetchSeniors = async (
    options: {
      offset?: number
      append?: boolean
      featured?: boolean
      filters?: typeof appliedFilters
    } = {}
  ) => {
    const {
      offset = 0,
      append = false,
      featured: featuredOpt,
      filters: filtersOverride,
    } = options

    const filters = filtersOverride ?? appliedFilters
    const active = !!(filters.q || filters.college || filters.location || filters.company)
    const featured = featuredOpt ?? (!active && offset === 0)

    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/seniors?${buildQueryString(offset, featured, filters)}`)
      if (!res.ok) return

      const data = await res.json()
      const list: Senior[] = data.seniors || []
      setSeniors((prev) => (append ? [...prev, ...list] : list))
      setTotal(data.total ?? list.length)
      setHasMore(!!data.hasMore)
      setIsFeaturedView(!!data.featured)
    } catch (err) {
      console.error('Error fetching seniors:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetch('/api/seniors?meta=true')
      .then((r) => r.json())
      .then((data) => {
        setFilterMeta({
          colleges: data.colleges || [],
          companies: data.companies || [],
          locations: data.locations || [],
        })
      })
      .catch(() => {})

    fetchSeniors({ offset: 0, featured: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = () => {
    const filters = {
      q: searchQuery.trim(),
      college: collegeId,
      location: location.trim(),
      company: company.trim(),
    }
    const active = !!(filters.q || filters.college || filters.location || filters.company)
    setAppliedFilters(filters)
    fetchSeniors({ offset: 0, featured: !active, append: false, filters })
    setShowFilters(false)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCollegeId('')
    setLocation('')
    setCompany('')
    const empty = { q: '', college: '', location: '', company: '' }
    setAppliedFilters(empty)
    fetchSeniors({ offset: 0, featured: true, append: false })
  }

  const loadMore = () => {
    if (!hasMore || loadingMore) return
    fetchSeniors({
      offset: seniors.length,
      append: true,
      featured: false,
      filters: appliedFilters,
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyFilters()
  }

  const listTitle =
    isFeaturedView && !hasActiveFilters ? 'Platform Mentors' : 'Search Results'

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero Section — original UI */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-50/30 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 mb-6">
            <Award size={14} className="text-[#7C3AED]" />
            <span className="text-[12px] font-bold text-[#7C3AED] uppercase tracking-wider">
              Verified Experts
            </span>
          </div>

          <h1 className="font-extrabold text-4xl md:text-5xl text-gray-900 mb-6 leading-[1.2] tracking-tight">
            Connect with seniors who<br />
            have <span className="text-[#7C3AED]">walked the path</span>.
          </h1>

          <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg mb-10 font-medium">
            Get 1:1 mentorship, career advice, and industry insights from
            verified alumni working at top companies worldwide.
          </p>

          {/* Search Bar — original */}
          <div className="max-w-2xl mx-auto relative group mb-4">
            <div className="absolute inset-0 bg-[#7C3AED]/5 rounded-xl blur-xl group-hover:bg-[#7C3AED]/10 transition-all" />
            <div className="relative bg-white border border-gray-200 rounded-lg p-2 flex items-center shadow-sm">
              <div className="pl-4 pr-2 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search by name, company, or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 min-w-0 w-full py-3 text-black outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`mr-1 flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all border ${
                  showFilters || hasActiveFilters
                    ? 'bg-purple-50 border-purple-200 text-[#7C3AED]'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-[#7C3AED]'
                }`}
              >
                <Filter size={16} />
                Filters
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                )}
              </button>
            </div>
          </div>

          {/* Professional filter panel — matches original palette */}
          {showFilters && (
            <div className="max-w-2xl mx-auto text-left">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-900">Refine mentors</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-semibold text-gray-500 hover:text-[#7C3AED] flex items-center gap-1 transition-colors"
                    >
                      <X size={14} />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      College
                    </label>
                    <div className="relative">
                      <Building2
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <select
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50/50 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 transition-all appearance-none"
                      >
                        <option value="">All colleges</option>
                        {filterMeta.colleges.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.short_name || c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        list="senior-locations"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City or state"
                        className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50/50 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                      <datalist id="senior-locations">
                        {filterMeta.locations.map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Company
                    </label>
                    <div className="relative">
                      <Briefcase
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        list="senior-companies"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50/50 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                      <datalist id="senior-companies">
                        {filterMeta.companies.map((co) => (
                          <option key={co} value={co} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyFilters}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors shadow-sm shadow-purple-200/50 flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  Apply filters
                </button>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && !showFilters && (
            <div className="max-w-2xl mx-auto mt-3 flex flex-wrap justify-center gap-2">
              {appliedFilters.q && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
                  &quot;{appliedFilters.q}&quot;
                </span>
              )}
              {appliedFilters.college && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
                  {filterMeta.colleges.find((c) => c.id === appliedFilters.college)?.short_name ||
                    'College'}
                </span>
              )}
              {appliedFilters.location && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <MapPin size={11} />
                  {appliedFilters.location}
                </span>
              )}
              {appliedFilters.company && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <Briefcase size={11} />
                  {appliedFilters.company}
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-500 hover:text-[#7C3AED] underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seniors Grid — original cards */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              {listTitle}
              <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {loading ? '…' : total}
              </span>
            </h2>
            {isFeaturedView && !hasActiveFilters && (
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Showing top contributors — use filters or load more to see all
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[280px] bg-gray-100 rounded-md border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : seniors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seniors
                .filter((senior) => senior.id !== user?.id)
                .map((senior) => (
                <div
                  key={senior.id}
                  className="group bg-white border border-gray-200 rounded-md p-6 hover:border-purple-300 hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      onClick={() => router.push(`/u/${senior.unique_id}`)}
                      className={`w-12 h-12 rounded-md ${senior.avatar_url ? 'bg-transparent' : 'bg-gray-100'} flex items-center justify-center text-sm font-black text-gray-500 border border-gray-200 group-hover:border-purple-300 group-hover:text-[#7C3AED] transition-all shadow-sm overflow-hidden cursor-pointer flex-shrink-0`}
                    >
                      {senior.avatar_url ? (
                        <img
                          src={senior.avatar_url}
                          alt={senior.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        senior.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          onClick={() => router.push(`/u/${senior.unique_id}`)}
                          className="text-base font-bold text-gray-900 group-hover:text-[#7C3AED] transition-colors cursor-pointer truncate tracking-tight"
                        >
                          {senior.full_name}
                        </h3>
                        {senior.rise_points > 50 && (
                          <div
                            className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 text-[10px] font-bold flex-shrink-0"
                            title="Top Contributor"
                          >
                            <Award size={10} />
                            Verified
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate">
                        @{senior.unique_id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-start gap-3">
                      <Briefcase size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate leading-snug">
                          {senior.designation}
                        </p>
                        <p className="text-xs text-gray-500 truncate leading-snug">
                          {senior.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <GraduationCap size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 leading-snug">
                          Class of {senior.graduation_year}
                        </p>
                        <p className="text-xs text-gray-500 truncate leading-snug">
                          {senior.college?.name || 'College not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-auto">
                    {user?.role === 'senior' ? (
                      <SeniorMessageRequestButton
                        targetSeniorId={senior.id}
                        targetSeniorName={senior.full_name}
                      />
                    ) : (
                      <MessageRequestButton
                        seniorId={senior.id}
                        seniorName={senior.full_name}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-lg text-sm font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 transition-colors shadow-sm shadow-purple-200/50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load more mentors'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-md">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Users size={24} className="text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              No seniors matched your search
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Try exploring other colleges or roles
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-bold text-[#7C3AED] hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
