'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Sparkles, TrendingUp, Users, ArrowUpRight, Brain, Rocket, Code, GraduationCap, Award, Eye } from 'lucide-react'
import { useMemo } from 'react'
import { getUserActivityDot } from '@/hooks/useActivityStatus'

interface Mentor {
  id: string
  full_name: string
  unique_id: string
  avatar_url?: string | null
  company?: string | null
  designation?: string | null
  graduation_year?: number | null
  passout_year?: number | null
  last_seen?: string | null
  college?: { name: string; short_name: string } | null
  profile_data?: {
    senior?: {
      experience_years?: number | null
    }
  } | null
}

interface Community {
  id: string
  slug: string
  display_name: string
  member_count: number
  senior_count: number
}

interface NetworkGrowth {
  newConnections: number
  dailyConnections: number[]
  prevWeekTotal: number
  profileViews: number
}

interface NetworkRightSidebarProps {
  mentors: Mentor[]
  communities: Community[]
  networkGrowth?: NetworkGrowth | null
  connectionsCount: number
}

function getYearsOfExperience(mentor: Mentor): string {
  if (mentor.company === 'Fresher') return 'Fresher'

  const explicitExp = mentor.profile_data?.senior?.experience_years
  if (explicitExp != null && explicitExp > 0) {
    const exp = Math.round(explicitExp)
    return exp === 1 ? '1 year exp' : `${exp} years exp`
  }

  if (mentor.company) {
    const year = mentor.graduation_year
    if (year) {
      const years = new Date().getFullYear() - year
      if (years > 0) return years === 1 ? '1 year exp' : `${years} years exp`
    }
  }

  const year = mentor.graduation_year || mentor.passout_year
  if (!year) return ''
  const years = new Date().getFullYear() - year
  if (years <= 0) return 'Recent grad'
  if (years === 1) return '1 year exp'
  return `${years} years exp`
}

export default function NetworkRightSidebar({ mentors, communities, networkGrowth, connectionsCount }: NetworkRightSidebarProps) {
  const router = useRouter()

  const points = networkGrowth?.dailyConnections ?? [0, 0, 0, 0, 0, 0, 0]
  const allZero = points.every(p => p === 0)

  const trendLine = useMemo(() => {
    const width = 220
    const height = 40
    const max = Math.max(...points, 1)
    const min = Math.min(...points, 0)
    const range = max - min || 1
    const stepX = width / Math.max(points.length - 1, 1)

    const d = points.map((p, i) => {
      const x = i * stepX
      const y = height - ((p - min) / range) * (height - 8) - 4
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')

    const areaD = `${d} L${width},${height} L0,${height} Z`

    return { d, areaD, width, height }
  }, [points])

  const growthRate = useMemo(() => {
    const curr = points.reduce((a, b) => a + b, 0)
    const prev = networkGrowth?.prevWeekTotal ?? 0
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }, [points, networkGrowth])

  return (
    <div className="space-y-4">
      {/* Suggested Mentors */}
      <div className="bg-surface dark:bg-[#283036] rounded-2xl border border-surface/80 dark:border-[#38434F] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0A66C2] flex items-center justify-center shadow-sm">
                <Sparkles size={13} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Suggested Mentors</h3>
            </div>
            <button
              onClick={() => router.push('/seniors')}
              className="text-xs font-semibold text-[#0A66C2] hover:text-[#004182] flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>

          {mentors.length > 0 ? (
            <div className="space-y-1">
              {mentors.slice(0, 4).map((mentor) => (
                <div
                  key={mentor.id}
                  onClick={() => router.push(`/u/${mentor.unique_id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#EAF4FF]/60 cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-sm duration-200 dark:hover:bg-[#1D2226]"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1D2226] flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-gray-100 dark:ring-[#38434F] group-hover:ring-blue-100 group-hover:ring-3 transition-all">
                    {mentor.avatar_url ? (
                      <img src={mentor.avatar_url} alt={mentor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-gray-400 dark:text-[#B0B7BE]">
                        {mentor.full_name?.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                      <span className="truncate">{mentor.full_name}</span>
                      {mentor.last_seen && (
                        <span className={`inline-block w-[5px] h-[5px] rounded-full flex-shrink-0 ${getUserActivityDot(mentor.last_seen)}`} />
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-[#B0B7BE] truncate">
                      {mentor.designation && mentor.company
                        ? `${mentor.designation} at ${mentor.company}`
                        : mentor.college?.short_name || 'Senior'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {mentor.college?.short_name && (
                        <span className="text-[10px] text-gray-400 dark:text-[#B0B7BE] truncate">{mentor.college.short_name}</span>
                      )}
                      {getYearsOfExperience(mentor) && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#38434F]" />
                          <span className="text-[10px] font-medium text-[#0A66C2]">{getYearsOfExperience(mentor)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 dark:text-[#38434F] flex-shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 group-hover:text-[#0A66C2]" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-[#B0B7BE] py-4 text-center">No mentors available</p>
          )}
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-[#38434F] to-transparent" />
        <button
          onClick={() => router.push('/seniors')}
          className="w-full py-3 text-xs font-semibold text-[#0A66C2] hover:bg-[#EAF4FF]/50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1"
        >
          Browse all seniors <ChevronRight size={13} />
        </button>
      </div>

      {/* Trending Communities */}
      <div className="bg-surface dark:bg-[#283036] rounded-2xl border border-surface/80 dark:border-[#38434F] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
              <TrendingUp size={13} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Trending Communities</h3>
          </div>
          <button
            onClick={() => router.push('/community')}
            className="text-xs font-semibold text-[#0A66C2] hover:text-[#004182] flex items-center gap-0.5"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>

        {communities.length > 0 ? (
          <div className="space-y-2">
            {communities.slice(0, 4).map((community, index) => {
              const icons = [
                { icon: Brain, gradient: 'from-[#0A66C2] to-blue-500', lightBg: 'bg-[#EAF4FF] dark:bg-blue-900/30', iconColor: 'text-[#0A66C2] dark:text-blue-400' },
                { icon: Rocket, gradient: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                { icon: Code, gradient: 'from-orange-500 to-red-500', lightBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
                { icon: GraduationCap, gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
              ]
              const { icon: Icon, lightBg, iconColor } = icons[index % icons.length]

              const growth = community.member_count > 100
                ? { label: `${Math.round(community.member_count * 0.08)}`, color: 'text-emerald-500' }
                : { label: 'New', color: 'text-blue-500' }

              return (
                <div
                  key={community.id}
                  onClick={() => router.push(`/colleges/${community.slug}`)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-app dark:hover:bg-[#1D2226] cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-sm duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl ${lightBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon size={16} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#0A66C2] transition-colors">
                        {community.display_name}
                      </p>
                      <span className={`text-[10px] font-bold ${growth.color} flex items-center gap-0.5`}>
                        <TrendingUp size={9} />
                        {growth.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#B0B7BE] font-medium">
                      {community.member_count.toLocaleString()} members
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 dark:text-[#38434F] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-[#B0B7BE] py-4 text-center">No communities yet</p>
        )}
      </div>

      {/* Network Growth - SaaS Dashboard Widget */}
      <div className="bg-surface dark:bg-[#283036] rounded-2xl border border-surface/80 dark:border-[#38434F] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0A66C2] flex items-center justify-center shadow-sm">
                <ArrowUpRight size={13} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Network Growth</h3>
            </div>
            <span className={`text-xs font-bold flex items-center gap-1 ${growthRate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp size={11} />
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="bg-gray-50 dark:from-[#1D2226] dark:to-[#1D2226]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Users size={13} className="text-[#0A66C2]" />
                <span className="text-[10px] font-semibold text-gray-400 dark:text-[#B0B7BE] uppercase tracking-wider">New</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{networkGrowth?.newConnections ?? 0}</p>
              <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-medium">connections this month</p>
            </div>
            <div className="bg-gray-50 dark:from-[#1D2226] dark:to-[#1D2226]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Award size={13} className="text-amber-500" />
                <span className="text-[10px] font-semibold text-gray-400 dark:text-[#B0B7BE] uppercase tracking-wider">Total</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{connectionsCount}</p>
              <p className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-medium">active connections</p>
            </div>
          </div>

          {/* Sparkline chart */}
          <div className="relative">
            {allZero ? (
              <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-[#B0B7BE]">
                <svg className="w-full" viewBox={`0 0 ${trendLine.width} ${trendLine.height}`} style={{ height: `${trendLine.height}px` }}>
                  <line x1="0" y1={trendLine.height - 4} x2={trendLine.width} y2={trendLine.height - 4} className="stroke-gray-200 dark:stroke-[#38434F]" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
                <span className="text-[10px] font-semibold mt-1">No recent growth</span>
              </div>
            ) : (
              <svg viewBox={`0 0 ${trendLine.width} ${trendLine.height}`} className="w-full" style={{ height: `${trendLine.height}px` }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={trendLine.d} fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d={trendLine.areaD} fill="url(#growthGradient)" />
              </svg>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface dark:border-[#38434F]">
            <div className="flex items-center gap-1.5">
              <Eye size={12} className="text-gray-400 dark:text-[#B0B7BE]" />
              <span className="text-[10px] text-gray-500 dark:text-[#B0B7BE] font-medium">Profile views</span>
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-white">{networkGrowth?.profileViews ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
