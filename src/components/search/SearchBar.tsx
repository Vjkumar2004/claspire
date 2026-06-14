'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Award, Briefcase, GraduationCap, Building2, MessageSquare, History, Users, RefreshCw, FileText } from 'lucide-react'

interface SuggestionItem {
  id: string
  type: 'senior' | 'student' | 'job' | 'community' | 'college' | 'group' | 'post'
  title: string
  subtitle: string
  imageUrl: string | null
  href: string
  score?: number
}

export interface RecentSearchItem {
  id: string
  type: 'query' | 'senior' | 'student' | 'job' | 'community' | 'college' | 'group' | 'post'
  title: string
  subtitle?: string
  imageUrl?: string | null
  href: string
}

export default function SearchBar({ isMobileOverlay = false, onCloseMobile }: { isMobileOverlay?: boolean; onCloseMobile?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cacheRef = useRef<Record<string, SuggestionItem[]>>({})

  // Focus input automatically on mobile overlay
  useEffect(() => {
    if (isMobileOverlay && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isMobileOverlay])

  // Load recent searches from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('claspire_recent_searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Handle outside clicks to close dropdown
  useEffect(() => {
    if (isMobileOverlay) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isMobileOverlay])

  // Debounced query search suggestion aggregation
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      setLoading(false)
      return
    }

    // Check memoized cache first
    if (cacheRef.current[trimmed]) {
      setSuggestions(cacheRef.current[trimmed])
      setLoading(false)
      return
    }

    setLoading(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`)
        const data = await res.json()
        const items = data.results || []
        
        // Save to cache
        cacheRef.current[trimmed] = items
        setSuggestions(items)
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
      } finally {
        setLoading(false)
      }
    }, 250) // Fast 250ms debouncing response

    return () => clearTimeout(delayDebounce)
  }, [query])

  const saveRecentSearch = (item: RecentSearchItem | string) => {
    let newItem: RecentSearchItem
    if (typeof item === 'string') {
      const trimmed = item.trim()
      if (!trimmed) return
      newItem = {
        id: `query-${trimmed}`,
        type: 'query',
        title: trimmed,
        href: `/search?q=${encodeURIComponent(trimmed)}`
      }
    } else {
      newItem = item
    }

    const updated = [newItem, ...recentSearches.filter((t) => t.id !== newItem.id)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('claspire_recent_searches', JSON.stringify(updated))
  }

  const handleSearchSubmit = (searchTerm: string) => {
    const term = searchTerm.trim()
    if (!term) return
    saveRecentSearch(term)
    setIsOpen(false)
    if (onCloseMobile) onCloseMobile()
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const handleSuggestionClick = (item: SuggestionItem) => {
    const recentItem: RecentSearchItem = {
      id: `${item.type}-${item.id}`,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      href: item.href
    }
    saveRecentSearch(recentItem)
    setIsOpen(false)
    if (onCloseMobile) onCloseMobile()
    router.push(item.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItemsCount = suggestions.length + (query ? 0 : recentSearches.length)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < totalItemsCount - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItemsCount - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        if (query) {
          const selected = suggestions[activeIndex]
          if (selected) {
            handleSuggestionClick(selected)
          }
        } else {
          const selected = recentSearches[activeIndex]
          if (selected) {
            saveRecentSearch(selected)
            setIsOpen(false)
            if (onCloseMobile) onCloseMobile()
            router.push(selected.href)
          }
        }
      } else {
        handleSearchSubmit(query)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      if (onCloseMobile) onCloseMobile()
    }
  }

  const deleteRecentItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    const updated = recentSearches.filter((item) => item.id !== itemId)
    setRecentSearches(updated)
    localStorage.setItem('claspire_recent_searches', JSON.stringify(updated))
  }

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    localStorage.removeItem('claspire_recent_searches')
  }

  const getRecentIcon = (type: string) => {
    switch (type) {
      case 'senior':
        return <Award className="w-4 h-4 text-emerald-600" />
      case 'student':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'job':
        return <Briefcase className="w-4 h-4 text-amber-600" />
      case 'community':
        return <Building2 className="w-4 h-4 text-purple-600" />
      case 'college':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />
      case 'group':
        return <Users className="w-4 h-4 text-cyan-600" />
      case 'post':
        return <MessageSquare className="w-4 h-4 text-gray-600 dark:text-[#B0B7BE]" />
      default:
        return <FileText className="w-4 h-4 text-gray-400 dark:text-[#B0B7BE]" />
    }
  }

  const getRecentBadgeStyle = (type: string) => {
    switch (type) {
      case 'senior':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700'
      case 'student':
        return 'bg-blue-50 border-blue-100 text-blue-700'
      case 'job':
        return 'bg-amber-50 border-amber-100 text-amber-700'
      case 'community':
        return 'bg-purple-50 border-purple-100 text-[#7C3AED]'
      case 'college':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700'
      case 'group':
        return 'bg-cyan-50 border-cyan-100 text-cyan-700'
      case 'post':
        return 'bg-gray-50 dark:bg-[#1D2226] border-gray-100 dark:border-[#38434F] text-gray-700 dark:text-[#B0B7BE]'
      default:
        return 'bg-gray-50 dark:bg-[#1D2226] border-gray-100 dark:border-[#38434F] text-gray-700 dark:text-[#B0B7BE]'
    }
  }

  // Segment suggestions by logical groups
  const topMatch = suggestions.length > 0 && (suggestions[0].score ?? 0) >= 100 ? suggestions[0] : null
  const remainingSuggestions = topMatch ? suggestions.slice(1) : suggestions

  const people = remainingSuggestions.filter((s) => s.type === 'senior' || s.type === 'student')
  const jobs = remainingSuggestions.filter((s) => s.type === 'job')
  const communities = remainingSuggestions.filter((s) => s.type === 'college' || s.type === 'community' || s.type === 'group')
  const posts = remainingSuggestions.filter((s) => s.type === 'post')

  return (
    <div ref={containerRef} className="relative w-full font-plus-jakarta-sans text-xs">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people, jobs, groups, colleges..."
          className={`w-full bg-[#EEF3F8] dark:bg-[#283036] text-gray-800 dark:text-[#B0B7BE] text-[13px] font-semibold pl-10 pr-10 py-1.5 sm:py-2 rounded-md border border-transparent focus:border-gray-300 dark:focus:border-[#38434F] focus:bg-white dark:focus:bg-[#283036] focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#38434F] transition-all duration-200 ${
            isMobileOverlay ? 'h-11 sm:h-12' : 'h-9'
          }`}
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#B0B7BE]" />
        
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:text-[#B0B7BE] dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete suggestion popup dropdown */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-md shadow-lg z-[9999] overflow-hidden ${
          isMobileOverlay ? 'w-full min-w-0' : 'min-w-[360px] lg:min-w-[400px]'
        }`}>
          {loading && suggestions.length === 0 ? (
            <div className="p-4 flex items-center justify-center gap-2 text-gray-500 dark:text-[#B0B7BE] font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-[#7C3AED]" />
              Searching Clasipire...
            </div>
          ) : !query ? (
            // 1. Rich LinkedIn-Style Recent Searches Dropdown
            recentSearches.length > 0 ? (
              <div className="p-2 space-y-0.5">
                <div className="flex justify-between items-center px-2.5 py-1.5 text-gray-400 dark:text-[#B0B7BE] font-bold tracking-wider uppercase text-[10px]">
                  <span>Recent Searches</span>
                  <button onClick={clearRecentSearches} className="hover:text-red-500 cursor-pointer">
                    Clear All
                  </button>
                </div>
                {recentSearches.map((item, i) => (
                  <div
                    key={item.id}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] group cursor-pointer ${
                      i === activeIndex ? 'bg-gray-50 dark:bg-[#1D2226]' : ''
                    }`}
                    onClick={() => {
                      saveRecentSearch(item)
                      setIsOpen(false)
                      if (onCloseMobile) onCloseMobile()
                      router.push(item.href)
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.type === 'query' ? (
                        <div className="w-8 h-8 rounded bg-gray-50 dark:bg-[#1D2226] border border-gray-150 flex items-center justify-center flex-shrink-0">
                          <History className="w-4 h-4 text-gray-400 dark:text-[#B0B7BE]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-50 dark:bg-[#1D2226] border border-gray-150 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            getRecentIcon(item.type)
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 dark:text-white leading-tight text-xs flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="truncate">{item.title}</span>
                          {item.type !== 'query' && (
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded border uppercase tracking-wider ${getRecentBadgeStyle(item.type)}`}>
                              {item.type === 'senior' ? 'Senior' : item.type}
                            </span>
                          )}
                        </p>
                        {item.subtitle && (
                          <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5 leading-none truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {/* Clear single item button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRecentItem(e, item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-[#B0B7BE] hover:text-red-500 rounded hover:bg-gray-250 transition-all cursor-pointer flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 dark:text-[#B0B7BE] font-bold">
                Try searching for names, roles, or colleges!
              </div>
            )
          ) : suggestions.length > 0 ? (
            // 2. Segmented Search Suggestions
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-[#38434F]">
              
              {/* LinkedIn-Style Top Match block */}
              {topMatch && (
                <div className="p-3 bg-gradient-to-br from-purple-50/40 to-white">
                  <div className="text-gray-400 dark:text-[#B0B7BE] font-bold tracking-wider uppercase text-[9px] mb-2 px-1">
                    Top Match
                  </div>
                  <button
                    onClick={() => handleSuggestionClick(topMatch)}
                    className={`w-full flex items-center gap-3.5 p-2 text-left rounded-md border border-purple-100/80 bg-white dark:bg-[#283036] hover:bg-purple-50/20 transition-all cursor-pointer shadow-[0_1px_3px_rgba(124,58,237,0.03)] ${
                      activeIndex === 0 ? 'bg-purple-50/30 border-purple-300' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-md bg-white dark:bg-[#283036] border border-gray-150 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm dark:shadow-[#1D2226]/50">
                      {topMatch.imageUrl ? (
                        <img 
                          src={topMatch.imageUrl} 
                          alt={topMatch.title} 
                          className={`w-full h-full ${
                            topMatch.type === 'college' || topMatch.type === 'community' ? 'object-contain p-1' : 'object-cover'
                          }`} 
                        />
                      ) : (
                        getRecentIcon(topMatch.type)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-gray-900 dark:text-white leading-snug text-[13px] flex items-center gap-1.5">
                        {topMatch.title}
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getRecentBadgeStyle(topMatch.type)}`}>
                          {topMatch.type === 'senior' ? 'Senior' : topMatch.type}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5 truncate">{topMatch.subtitle}</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Related Colleges & Communities & Groups Section */}
              {communities.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-gray-400 dark:text-[#B0B7BE] font-bold tracking-wider uppercase text-[9px] mb-0.5">
                    Related Communities & Colleges
                  </div>
                  {communities.map((item, idx) => {
                    const globalIdx = (topMatch ? 1 : 0) + idx
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className={`w-full flex items-center gap-3 px-2 py-1.5 text-left rounded hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] cursor-pointer ${
                          globalIdx === activeIndex ? 'bg-gray-50 dark:bg-[#1D2226]' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-white dark:bg-[#283036] border border-gray-150 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className={`w-full h-full ${
                                item.type === 'college' || item.type === 'community' ? 'object-contain p-1' : 'object-cover'
                              }`} 
                            />
                          ) : (
                            getRecentIcon(item.type)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight text-xs flex items-center gap-1.5">
                            {item.title}
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getRecentBadgeStyle(item.type)}`}>
                              {item.type}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Related People Section */}
              {people.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-gray-400 dark:text-[#B0B7BE] font-bold tracking-wider uppercase text-[9px] mb-0.5">
                    Related People (Seniors & Students)
                  </div>
                  {people.map((item, idx) => {
                    const globalIdx = (topMatch ? 1 : 0) + communities.length + idx
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className={`w-full flex items-center gap-3 px-2 py-1.5 text-left rounded hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] cursor-pointer ${
                          globalIdx === activeIndex ? 'bg-gray-50 dark:bg-[#1D2226]' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#1D2226] border border-gray-100 dark:border-[#38434F] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            getRecentIcon(item.type)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight text-xs flex items-center gap-1.5">
                            {item.title}
                            {item.type === 'senior' && (
                              <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100 uppercase">
                                Senior
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Jobs Section */}
              {jobs.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-gray-400 dark:text-[#B0B7BE] font-bold tracking-wider uppercase text-[9px] mb-0.5">
                    Jobs & Openings
                  </div>
                  {jobs.map((item, idx) => {
                    const globalIdx = (topMatch ? 1 : 0) + communities.length + people.length + idx
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className={`w-full flex items-center gap-3 px-2 py-1.5 text-left rounded hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] cursor-pointer ${
                          globalIdx === activeIndex ? 'bg-gray-50 dark:bg-[#1D2226]' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-gray-50 dark:bg-[#1D2226] border border-gray-100 dark:border-[#38434F] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <Briefcase className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight text-xs">{item.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Related Posts Section */}
              {posts.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-gray-400 dark:text-[#B0B7BE] font-bold tracking-wider uppercase text-[9px] mb-0.5">
                    Related Posts & Activity
                  </div>
                  {posts.map((item, idx) => {
                    const globalIdx = (topMatch ? 1 : 0) + communities.length + people.length + jobs.length + idx
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className={`w-full flex items-center gap-3 px-2 py-1.5 text-left rounded hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] cursor-pointer ${
                          globalIdx === activeIndex ? 'bg-gray-50 dark:bg-[#1D2226]' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-gray-50 dark:bg-[#1D2226] border border-gray-100 dark:border-[#38434F] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-[#B0B7BE]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight text-xs">{item.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5 truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Bottom "Search all results" block */}
              <div className="p-1.5 bg-gray-50 dark:bg-[#1D2226]">
                <button
                  onClick={() => handleSearchSubmit(query)}
                  className="w-full py-2 text-center text-[#7C3AED] hover:text-[#6D28D9] font-bold text-xs hover:underline cursor-pointer"
                >
                  Search all results for "{query}" →
                </button>
              </div>

            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 dark:text-[#B0B7BE] font-bold">
              No matching suggestions. Press enter to search anyway.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
