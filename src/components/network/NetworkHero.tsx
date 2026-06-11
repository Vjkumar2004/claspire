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
    { label: 'Students', value: formatCount(platformStats?.students ?? 0), icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Seniors', value: formatCount(platformStats?.seniors ?? 0), icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Mentors', value: formatCount(platformStats?.seniors ?? 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Colleges', value: formatCount(platformStats?.colleges ?? 0), icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const nodes = recentSeniors.slice(0, 6)

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50/80 to-fuchsia-50 border border-purple-100/60 shadow-sm">
      {/* Gradient blobs */}
      <div className="hero-blob w-52 h-52 bg-purple-300/20 -top-16 -right-16" />
      <div className="hero-blob w-72 h-72 bg-blue-300/15 -bottom-24 -left-24" />

      <div className="relative z-10 flex flex-col lg:flex-row">
        {/* Left column */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100/80 rounded-full border border-purple-200/50 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">India&apos;s Student Network</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-3">
            Build Your<br />
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">Professional Network</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-500 font-medium mb-6 max-w-xl leading-relaxed">
            Connect with students, seniors, alumni and mentors across India and grow together.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center gap-2.5 bg-white/80 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon size={15} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-gray-900 leading-none">{stat.value}</p>
                    <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column - Network Visualization */}
        <div className="hidden lg:flex w-[320px] xl:w-[360px] flex-shrink-0 p-5 relative items-center justify-center">
          <div className="relative w-full h-[240px]">
            {/* SVG connecting lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 240" fill="none">
              <path d="M160,120 L70,65" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <path d="M160,120 L250,65" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <path d="M160,120 L70,175" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <path d="M160,120 L250,175" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <path d="M160,120 L160,35" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              {nodes.length > 5 && (
                <path d="M70,65 L250,65" stroke="#DDD6FE" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              )}
            </svg>

            {/* Center pulse */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full bg-purple-400/10 animate-[pulse-ring_3s_ease-in-out_infinite]" />
              <div className="absolute w-14 h-14 rounded-full bg-purple-400/15 animate-[pulse-ring_3s_ease-in-out_infinite_-1s]" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Users size={16} className="text-white" />
              </div>
            </div>

            {/* Floating nodes */}
            {nodes[0] && (
              <div className="absolute left-[50px] top-[40px] network-node" style={{ animationDelay: '0s' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:scale-110 transition-transform" onClick={() => router.push(`/u/${nodes[0].unique_id}`)}>
                  {nodes[0].avatar_url ? (
                    <img src={nodes[0].avatar_url} alt={nodes[0].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-gray-400">
                      {nodes[0].full_name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {nodes[1] && (
              <div className="absolute right-[50px] top-[40px] network-node" style={{ animationDelay: '-1.5s' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:scale-110 transition-transform" onClick={() => router.push(`/u/${nodes[1].unique_id}`)}>
                  {nodes[1].avatar_url ? (
                    <img src={nodes[1].avatar_url} alt={nodes[1].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-gray-400">
                      {nodes[1].full_name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {nodes[2] && (
              <div className="absolute left-[50px] bottom-[40px] network-node" style={{ animationDelay: '-3s' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:scale-110 transition-transform" onClick={() => router.push(`/u/${nodes[2].unique_id}`)}>
                  {nodes[2].avatar_url ? (
                    <img src={nodes[2].avatar_url} alt={nodes[2].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-gray-400">
                      {nodes[2].full_name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {nodes[3] && (
              <div className="absolute right-[50px] bottom-[40px] network-node" style={{ animationDelay: '-0.5s' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:scale-110 transition-transform" onClick={() => router.push(`/u/${nodes[3].unique_id}`)}>
                  {nodes[3].avatar_url ? (
                    <img src={nodes[3].avatar_url} alt={nodes[3].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-gray-400">
                      {nodes[3].full_name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {nodes[4] && (
              <div className="absolute left-1/2 -translate-x-1/2 top-[18px] network-node" style={{ animationDelay: '-2s' }}>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:scale-110 transition-transform border-2 border-purple-200" onClick={() => router.push(`/u/${nodes[4].unique_id}`)}>
                  {nodes[4].avatar_url ? (
                    <img src={nodes[4].avatar_url} alt={nodes[4].full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-[8px] font-bold text-gray-400">
                      {nodes[4].full_name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
