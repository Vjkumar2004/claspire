'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Users, GraduationCap, Building2, ChevronRight, MessageSquare, TrendingUp, Zap, Clock, ArrowUpRight, Sparkles, Filter } from 'lucide-react'
import { getCollegeLogo, getCollegeInitial } from '@/lib/college-utils'

export default function CollegesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/colleges')
        const json = await res.json()
        if (json.success) setData(json)
      } catch (err) {
        console.error('Failed to fetch colleges:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = (data?.colleges || []).filter((c: any) =>
    c.colleges?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.colleges?.short_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const heroStats = data?.heroStats

  return (
    <div className="min-h-screen bg-[#F4F5F7]">

      {/* ===== HERO ===== */}
      <section className="relative rounded-2xl overflow-hidden min-h-[340px] lg:min-h-0 lg:h-[280px] mx-3 sm:mx-6 lg:mx-8 mt-3 sm:mt-6 lg:mt-8 mb-6 lg:mb-0 max-w-7xl lg:mx-auto shadow-xl">
        {/* Background image */}
        <img src="/college-banner.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />

        <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-10 flex flex-col lg:flex-row lg:items-center pt-5 pb-4 lg:py-0">
          {/* ===== LEFT SIDE (40%) — badge + heading + subtitle + desktop stats ===== */}
          <div className="lg:w-2/5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/15 mb-2.5">
              <Building2 size={11} className="text-purple-300" />
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">College Communities</span>
            </div>

            {/* Heading */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-1.5">
              Find Your{' '}
              <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">College Community</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[11px] sm:text-xs lg:text-sm text-white/70 font-medium mb-3 leading-relaxed max-w-sm">
              Connect with seniors, get placement guidance, and grow your network within your college community.
            </p>

            {/* Desktop stats row — glassmorphism inline pills */}
            {heroStats && (
              <div className="hidden lg:flex flex-wrap items-center gap-2">
                {[
                  { label: 'Colleges', value: heroStats.totalColleges, icon: Building2 },
                  { label: 'Students', value: heroStats.totalStudents, icon: Users },
                  { label: 'Seniors', value: heroStats.totalSeniors, icon: GraduationCap },
                  { label: 'Connections', value: heroStats.totalConnections, icon: ArrowUpRight },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 backdrop-blur-xl rounded-lg border border-white/10">
                      <Icon size={12} className="text-purple-300" />
                      <span className="text-xs font-bold text-white">{stat.value.toLocaleString()}</span>
                      <span className="text-[10px] text-white/50 font-medium">{stat.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ===== RIGHT SIDE (60%) — Desktop search ===== */}
          <div className="hidden lg:flex w-3/5 h-full items-center justify-end">
            <div className="relative w-[520px]">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl opacity-25 blur-md" />
              <div className="relative flex items-stretch bg-white rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 h-12">
                <div className="flex items-center justify-center pl-4 pr-2 text-gray-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your college by name, slug, or city..."
                  className="flex-1 min-w-0 px-0 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* ===== MOBILE: spacer pushes search + stats to bottom ===== */}
          <div className="lg:hidden flex-1" />

          {/* ===== MOBILE: Search bar with button ===== */}
          <div className="lg:hidden mb-5">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl opacity-25 blur-md" />
              <div className="relative flex items-stretch bg-white rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 h-11">
                <div className="flex items-center justify-center pl-3.5 pr-2 text-gray-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your college..."
                  className="flex-1 min-w-0 px-0 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400 font-medium"
                />
                <button className="flex-shrink-0 px-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold flex items-center justify-center">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* ===== MOBILE: Stats panel at bottom ===== */}
          {heroStats && (
            <div className="lg:hidden bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 px-3.5 py-2.5">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Colleges', value: heroStats.totalColleges, icon: Building2 },
                  { label: 'Students', value: heroStats.totalStudents, icon: Users },
                  { label: 'Seniors', value: heroStats.totalSeniors, icon: GraduationCap },
                  { label: 'Connections', value: heroStats.totalConnections, icon: ArrowUpRight },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="text-center">
                      <p className="text-xs font-bold text-white">{stat.value.toLocaleString()}</p>
                      <p className="text-[9px] text-white/50 font-medium uppercase tracking-wider mt-0.5">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ===== LEFT: COLLEGE GRID ===== */}
          <div className="flex-1 min-w-0">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                  {searchQuery ? `Results for "${searchQuery}"` : 'All Colleges'}
                </h2>
                <span className="text-[11px] sm:text-xs font-bold text-gray-500 bg-gray-200/70 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                  {filtered.length}
                </span>
                {/* Mobile Filters button */}
                <button className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-[11px] font-bold text-purple-600 active:bg-purple-100 transition-colors">
                  <Filter size={12} />
                  Filters
                </button>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => router.push('/colleges/request')}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-lg transition-all"
                >
                  <Sparkles size={13} />
                  Request College
                </button>
              )}
            </div>

            {loading ? (
              <div>
                {/* Mobile skeleton */}
                <div className="flex sm:hidden flex-col gap-3">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] animate-pulse p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="flex gap-3 pt-1">
                          <div className="h-3 bg-gray-100 rounded w-12" />
                          <div className="h-3 bg-gray-100 rounded w-12" />
                          <div className="h-3 bg-gray-100 rounded w-12" />
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                    </div>
                  ))}
                </div>
                {/* Desktop skeleton */}
                <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200/80 shadow-sm animate-pulse flex flex-col">
                      <div className="flex justify-center pt-7">
                        <div className="w-[68px] h-[68px] rounded-xl bg-gray-100 border border-gray-100 shadow-sm" />
                      </div>
                      <div className="px-5 pb-5 pt-5 flex flex-col items-center flex-1">
                        <div className="mt-3 h-4 bg-gray-200 rounded w-3/4" />
                        <div className="mt-1.5 h-3 bg-gray-100 rounded w-1/2" />
                        <div className="mt-3 h-4 bg-gray-200 rounded w-20" />
                        <div className="flex-1" />
                        <div className="mt-4 w-full border-t border-gray-100 pt-3.5 flex justify-center gap-5">
                          <div className="h-3 bg-gray-100 rounded w-14" />
                          <div className="h-3 bg-gray-100 rounded w-14" />
                          <div className="h-3 bg-gray-100 rounded w-14" />
                        </div>
                        <div className="mt-4 h-9 bg-gray-100 rounded-lg w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filtered.length > 0 ? (
              <>
                {/* Desktop grid */}
                <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {filtered.map((c: any) => {
                    const logoUrl = getCollegeLogo(c.colleges)
                    return (
                      <div
                        key={c.id}
                        className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
                        onClick={() => router.push(`/colleges/${c.slug}`)}
                      >
                        <div className="flex justify-center pt-7">
                          <div className="w-[68px] h-[68px] rounded-xl border border-gray-100 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            {logoUrl ? (
                              <img src={logoUrl} alt={c.colleges?.short_name || c.slug} className="w-full h-full object-contain p-2" />
                            ) : (
                              <span className="text-lg font-black bg-gradient-to-br from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                {getCollegeInitial(c.colleges)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-5 pb-5 pt-5 flex flex-col items-center flex-1">
                          <h3 className="mt-3 text-base font-bold text-gray-900 text-center leading-snug line-clamp-2">
                            {c.colleges?.name}
                          </h3>
                          {c.colleges?.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 font-medium">
                              <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                              <span>{c.colleges.location}</span>
                            </div>
                          )}
                          {(c.colleges?.type) && (
                            <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100/80">
                              {c.colleges.type}
                            </span>
                          )}
                          <div className="flex-1" />
                          <div className="w-full border-t border-gray-100 pt-3.5 mt-4">
                            <div className="flex items-center justify-center gap-5">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <Users size={13} className="text-blue-500" />
                                <span className="font-bold text-gray-800">{c.member_count?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <GraduationCap size={13} className="text-emerald-500" />
                                <span className="font-bold text-gray-800">{c.senior_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <MessageSquare size={13} className="text-purple-500" />
                                <span className="font-bold text-gray-800">{c.doubt_count || 0}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/colleges/${c.slug}`) }}
                            className="mt-4 w-full py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            View Community
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Mobile horizontal cards */}
                <div className="flex sm:hidden flex-col gap-3">
                  {filtered.map((c: any) => {
                    const logoUrl = getCollegeLogo(c.colleges)
                    return (
                      <div
                        key={c.id}
                        className="bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => router.push(`/colleges/${c.slug}`)}
                      >
                        {/* Left: Logo */}
                        <div className="w-12 h-12 rounded-xl border border-gray-100 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                          {logoUrl ? (
                            <img src={logoUrl} alt={c.colleges?.short_name || c.slug} className="w-full h-full object-contain p-1.5" />
                          ) : (
                            <span className="text-sm font-black bg-gradient-to-br from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                              {getCollegeInitial(c.colleges)}
                            </span>
                          )}
                        </div>

                        {/* Center: Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{c.colleges?.name}</h3>
                          {c.colleges?.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                              <span className="text-[11px] text-gray-500 font-medium truncate">{c.colleges.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                              <Users size={11} className="text-blue-500" />
                              <span className="font-bold text-gray-700">{c.member_count?.toLocaleString() || 0}</span>
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                              <GraduationCap size={11} className="text-emerald-500" />
                              <span className="font-bold text-gray-700">{c.senior_count || 0}</span>
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                              <MessageSquare size={11} className="text-purple-500" />
                              <span className="font-bold text-gray-700">{c.doubt_count || 0}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right: Arrow button */}
                        <button className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 flex-shrink-0 flex items-center justify-center active:bg-purple-100 transition-colors">
                          <ChevronRight size={15} className="text-purple-600" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Request college banner (inline, below grid) */}
                {!searchQuery && (
                  <div className="mt-6 bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-100 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={15} className="text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">Can't find your college?</p>
                        <p className="text-xs text-gray-500 font-medium hidden sm:block">Request it and we'll verify within 24 hours.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/colleges/request')}
                      className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm flex-shrink-0"
                    >
                      Request
                      <ChevronRight size={13} className="hidden sm:block" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-16 sm:py-20 bg-white rounded-xl sm:rounded-2xl border border-dashed border-gray-200 shadow-sm px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-gray-100">
                  <Search size={20} className="text-gray-300" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">No colleges found</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-5 sm:mb-6">We couldn't find any college matching &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => router.push('/colleges/request')}
                  className="text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all shadow-sm"
                >
                  Request your college
                </button>
              </div>
            )}
          </div>

          {/* ===== RIGHT SIDEBAR ===== */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <div className="space-y-5 sticky top-28">
              {/* Trending Colleges */}
              {data?.trending && data.trending.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                      <TrendingUp size={13} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Trending Colleges</h3>
                  </div>
                  <div className="space-y-1">
                    {data.trending.map((college: any, i: number) => {
                      const logoUrl = getCollegeLogo(college.colleges)
                      return (
                        <div
                          key={college.id}
                          onClick={() => router.push(`/colleges/${college.slug}`)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/60 hover:to-transparent cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-sm duration-200"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-purple-300 transition-all text-[10px] font-black text-gray-400">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              getCollegeInitial(college.colleges)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                              {college.colleges?.short_name || college.display_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-500 font-medium">{college.member_count?.toLocaleString()} members</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="text-[10px] font-semibold text-amber-500">#{i + 1}</span>
                            </div>
                          </div>
                          <ChevronRight size={13} className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Fastest Growing */}
              {data?.fastestGrowing && data.fastestGrowing.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                      <Zap size={13} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Fastest Growing</h3>
                  </div>
                  <div className="space-y-1">
                    {data.fastestGrowing.map((college: any, i: number) => {
                      const logoUrl = getCollegeLogo(college.colleges)
                      return (
                        <div
                          key={college.id}
                          onClick={() => router.push(`/colleges/${college.slug}`)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-transparent cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-sm duration-200"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-emerald-300 transition-all text-[10px] font-black text-gray-400">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              getCollegeInitial(college.colleges)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                              {college.colleges?.short_name || college.display_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-500 font-medium">{college.senior_count} seniors</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="text-[10px] font-semibold text-emerald-500">{Math.round((college.senior_count / (college.member_count || 1)) * 100)}% seniors</span>
                            </div>
                          </div>
                          <ChevronRight size={13} className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recently Active */}
              {data?.recentlyActive && data.recentlyActive.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                      <Clock size={13} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Recently Active</h3>
                  </div>
                  <div className="space-y-1">
                    {data.recentlyActive.map((college: any) => {
                      const logoUrl = getCollegeLogo(college.colleges)
                      return (
                        <div
                          key={college.id}
                          onClick={() => router.push(`/colleges/${college.slug}`)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-transparent cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-sm duration-200"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-blue-300 transition-all text-[10px] font-black text-gray-400">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              getCollegeInitial(college.colleges)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {college.colleges?.short_name || college.display_name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                              {college.doubt_count} discussions
                            </p>
                          </div>
                          <ChevronRight size={13} className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mobile: Request college CTA */}
              <div className="lg:hidden">
                <button
                  onClick={() => router.push('/colleges/request')}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles size={14} />
                  Request your college
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
