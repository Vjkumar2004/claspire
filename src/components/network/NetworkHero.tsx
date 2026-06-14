'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, Users, Briefcase, Building2 } from 'lucide-react'

interface PlatformStats {
  students: number
  seniors: number
  colleges: number
  communities: number
}

interface Mentor {
  id: string
  full_name: string
  unique_id: string
  avatar_url?: string | null
  company?: string | null
  designation?: string | null
  graduation_year?: number | null
  passout_year?: number | null
  college?: { name: string; short_name: string } | null
}

interface RecentSenior {
  id: string
  full_name: string
  unique_id: string
  avatar_url?: string | null
}

interface NetworkHeroProps {
  platformStats?: PlatformStats | null
  recentSeniors: RecentSenior[]
  featuredMentor: Mentor | null
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`
  if (n > 0) return `${n}+`
  return '0'
}

export default function NetworkHero({ platformStats, recentSeniors }: NetworkHeroProps) {
  const router = useRouter()

  const stats = [
    { label: 'Students', value: formatCount(platformStats?.students ?? 0), icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Seniors', value: formatCount(platformStats?.seniors ?? 0), icon: Briefcase, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Mentors', value: formatCount(platformStats?.seniors ?? 0), icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: 'Colleges', value: formatCount(platformStats?.colleges ?? 0), icon: Building2, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  ]

  const nodes = recentSeniors.slice(0, 6)

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50/80 to-fuchsia-50 dark:from-[#1D2226] dark:via-[#283036] dark:to-[#1D2226] border border-purple-100/60 dark:border-[#38434F] shadow-sm">
      <img src="/network-banner.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Gradient blobs */}
      <div className="hero-blob w-52 h-52 bg-purple-300/20 dark:bg-purple-900/30 -top-16 -right-16" />
      <div className="hero-blob w-72 h-72 bg-blue-300/15 dark:bg-blue-900/30 -bottom-24 -left-24" />

      <div className="relative z-10 flex flex-col lg:flex-row">
        {/* Left column */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100/80 dark:bg-purple-900/30 rounded-full border border-purple-200/50 dark:border-purple-800/50 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">India&apos;s Student Network</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-3">
            Build Your<br />
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">Professional Network</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-500 dark:text-[#B0B7BE] font-medium mb-6 max-w-xl leading-relaxed">
            Connect with students, seniors, alumni and mentors across India and grow together.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center gap-2.5 bg-white/80 dark:bg-[#283036]/80 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-gray-200/60 dark:border-[#38434F] shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-[#38434F] transition-all">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} dark:bg-opacity-30 flex items-center justify-center`}>
                    <Icon size={15} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-none">{stat.value}</p>
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-[#B0B7BE] mt-0.5">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
