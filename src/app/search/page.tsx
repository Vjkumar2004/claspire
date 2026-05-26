'use client'
import React, { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import SearchCard, { SearchCardProps } from '@/components/search/SearchCard'
import SearchSkeleton from '@/components/search/SearchSkeleton'
import { Users, Briefcase, GraduationCap, Building2, MessageSquare, Compass, Info, TrendingUp } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'All Results', icon: Compass },
  { id: 'people', label: 'People', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'communities', label: 'Communities', icon: Building2 },
  { id: 'colleges', label: 'Colleges', icon: GraduationCap },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'posts', label: 'Posts', icon: MessageSquare }
]

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryParam = searchParams.get('q') || ''
  
  const [results, setResults] = useState<SearchCardProps[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [trendingJobs, setTrendingJobs] = useState<{ role: string; company: string; count: string }[]>([])

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const limit = 10

  // Fetch real active job postings dynamically for the right sidebar
  useEffect(() => {
    const fetchTrendingJobs = async () => {
      try {
        const res = await fetch('/api/jobs')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const activeJobs = data.slice(0, 3).map((j: any) => ({
              role: j.role,
              company: j.company_name,
              count: j.salary_range ? `${j.salary_range} • Active` : 'Active Hiring Now'
            }))
            if (activeJobs.length > 0) {
              setTrendingJobs(activeJobs)
              return
            }
          }
        }
      } catch (e) {
        console.error('Failed to load trending jobs:', e)
      }
      
      // Fallback active listings if user is unauthenticated or endpoint is empty
      setTrendingJobs([
        { role: 'Software Developer', company: 'Clasipire Hub', count: 'Active hiring' },
        { role: 'Frontend Engineer', company: 'L\'Designs', count: 'Referral open' },
        { role: 'Product Analyst', company: 'Innovate Ltd', count: 'Apply now' }
      ])
    }
    
    fetchTrendingJobs()
  }, [])

  // Fetch results handler
  const fetchSearchResults = async (currentOffset: number, filter: string, replace = false) => {
    if (!queryParam) return

    if (currentOffset === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(queryParam)}&type=${filter}&limit=${limit}&offset=${currentOffset}`
      )
      const data = await res.json()
      const newItems = data.results || []
      
      if (replace) {
        setResults(newItems)
      } else {
        setResults((prev) => [...prev, ...newItems])
      }
      
      setTotal(data.total || 0)
      setHasMore(newItems.length === limit)
    } catch (err) {
      console.error('Failed to load search results:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Trigger search on query or filter changes
  useEffect(() => {
    setOffset(0)
    fetchSearchResults(0, activeFilter, true)
  }, [queryParam, activeFilter])

  // Continuous infinite scrolling intersection observer
  useEffect(() => {
    if (loading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          const nextOffset = offset + limit
          setOffset(nextOffset)
          fetchSearchResults(nextOffset, activeFilter, false)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loading, hasMore, offset, activeFilter, loadingMore])

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-8 font-plus-jakarta-sans text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3-Column LinkedIn Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* LEFT COLUMN: Filter Sidebar (Sticky on desktop, hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 pb-3 border-b border-gray-200/80">
                Search Filters
              </h2>
              <nav className="space-y-1">
                {FILTERS.map((f) => {
                  const isActive = activeFilter === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-purple-50 text-[#7C3AED]'
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <f.icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-gray-400'}`} />
                      <span>{f.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tips Widget */}
            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hidden lg:block">
              <div className="flex gap-2.5 items-start">
                <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">Search Tips</h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-normal font-medium">
                    Find exact profiles by searching full names, specific tech roles like "Frontend", or verified institution tags.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Main Feed */}
          <div className="lg:col-span-6 space-y-4 w-full">
            
            {/* Desktop search results summary */}
            <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Search results for "<span className="text-[#7C3AED]">{queryParam}</span>"
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Showing {total} {total === 1 ? 'match' : 'matches'} filtered by {FILTERS.find((f) => f.id === activeFilter)?.label}
              </p>
            </div>

            {/* Rounded horizontally scrollable Top Filter Pills (Mobile visible) */}
            <div className="flex lg:hidden overflow-x-auto gap-2 py-1 scrollbar-none pb-2 select-none -mx-4 px-4">
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#7C3AED] border-transparent text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Feed Results */}
            {loading ? (
              <SearchSkeleton />
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  let shownSeniorsHeader = false
                  let shownJobsHeader = false
                  let shownPostsHeader = false
                  let shownCollegesHeader = false
                  
                  // Pre-calculate indices to find the last senior
                  const seniorIndices = results
                    .map((r, idx) => (r.type === 'senior' || r.type === 'student' ? idx : -1))
                    .filter((idx) => idx !== -1)
                  const lastSeniorIdx = seniorIndices.length > 0 ? seniorIndices[seniorIndices.length - 1] : -1
                  
                  return results.map((card, idx) => {
                    let header = null
                    
                    // Only show context group headers if the search is a general search ("all" filter)
                    if (activeFilter === 'all') {
                      if ((card.type === 'senior' || card.type === 'student') && !shownSeniorsHeader) {
                        shownSeniorsHeader = true
                        header = (
                          <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-gray-200/80">
                            <span>👥 Related Alumni & Seniors</span>
                            <span className="text-[10px] text-gray-400 font-semibold normal-case">({queryParam} Network)</span>
                          </h3>
                        )
                      } else if (card.type === 'job' && !shownJobsHeader) {
                        shownJobsHeader = true
                        header = (
                          <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-gray-200/80">
                            <span>💼 Placements & Referral Openings</span>
                          </h3>
                        )
                      } else if (card.type === 'post' && !shownPostsHeader) {
                        shownPostsHeader = true
                        header = (
                          <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-gray-200/80">
                            <span>💬 Trending Community Posts & Activity</span>
                          </h3>
                        )
                      } else if ((card.type === 'college' || card.type === 'community' || card.type === 'group') && !shownCollegesHeader) {
                        shownCollegesHeader = true
                        header = (
                          <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-gray-200/80">
                            <span>🎓 Institution Profiles & Communities</span>
                          </h3>
                        )
                      }
                    }
                    
                    let viewMoreSeniorsCard = null
                    if (idx === lastSeniorIdx && activeFilter === 'all') {
                      viewMoreSeniorsCard = (
                        <div className="bg-gradient-to-r from-purple-50/50 via-white to-purple-50/20 border border-purple-100 rounded-md p-3.5 text-center shadow-[0_1px_3px_rgba(124,58,237,0.02)] mt-2 mb-4">
                          <p className="text-[11px] font-semibold text-gray-500">
                            Want to network with more alumni or mentors from {queryParam}?
                          </p>
                          <button
                            onClick={() => {
                              setActiveFilter('people')
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="mt-2 px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer transition-all hover:shadow"
                          >
                            View All {queryParam} Seniors & Alumni →
                          </button>
                        </div>
                      )
                    }
                    
                    return (
                      <React.Fragment key={`${card.type}-${card.id}`}>
                        {header}
                        <SearchCard card={card} query={queryParam} />
                        {viewMoreSeniorsCard}
                      </React.Fragment>
                    )
                  })
                })()}
                
                {/* Load more infinite scroll element */}
                {hasMore && (
                  <div ref={loadMoreRef} className="py-6 flex justify-center">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {!hasMore && (
                  <div className="text-center py-4 text-gray-400 font-bold text-xs">
                    No more matches found in this category.
                  </div>
                )}
              </div>
            ) : (
              // 3. Clean Empty State UI without static Search Recommendations
              <div className="bg-white border border-gray-200 rounded-md p-8 sm:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-center">
                <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-5">
                  <Compass className="w-8 h-8 text-[#7C3AED]" />
                </div>
                
                <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug">
                  No matching results found
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed max-w-sm mx-auto mt-2 font-semibold">
                  We couldn't find matches for "{queryParam}". Try refining your search filters, checking your spelling, or exploring broader keywords.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sidebar Recommendations */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Dynamic Placements Recommendation card */}
            <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Active Placements
              </h3>
              
              <div className="space-y-3">
                {trendingJobs.map((rec, i) => (
                  <div key={i} className="group cursor-pointer" onClick={() => router.push('/jobs')}>
                    <h4 className="text-xs font-bold text-gray-800 group-hover:text-[#7C3AED] transition-colors leading-tight">
                      {rec.role}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 leading-none">
                      {rec.company} • {rec.count}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3.5 border-t border-gray-100">
                <Link href="/jobs" className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] hover:underline no-underline block text-center">
                  Explore Placements →
                </Link>
              </div>
            </div>

            {/* General Disclaimer */}
            <div className="px-4 text-[10px] text-gray-400 font-semibold leading-relaxed text-center lg:text-left">
              Claspire © {new Date().getFullYear()} • Professional student & senior placement network.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-plus-jakarta-sans text-xs">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}
