'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, HeartHandshake, Compass, UserCheck, ChevronRight, GraduationCap, Settings, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NetworkSidebarProps {
  activeTab: string
  onTabChange: (tab: 'discover' | 'network' | 'requests' | 'following') => void
  connections: number
  following: number
  incomingRequests: number
}

export default function NetworkSidebar({ activeTab, onTabChange, connections, following, incomingRequests }: NetworkSidebarProps) {
  const router = useRouter()
  const { user } = useAuth()

  const links: { id: 'discover' | 'network' | 'requests' | 'following'; label: string; icon: React.ElementType; count?: number; badge?: number }[] = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'network', label: 'My Network', icon: UserCheck, count: connections },
    { id: 'requests', label: 'Requests', icon: UserPlus, badge: incomingRequests },
    { id: 'following', label: 'Following', icon: HeartHandshake, count: following },
  ]

  const profileStrength = [
    user?.avatar_url,
    user?.banner_url,
    user?.bio,
    user?.branch,
    user?.college_id,
  ].filter(Boolean).length

  const strengthPercent = Math.round((profileStrength / 5) * 100)

  const strengthColor = strengthPercent >= 80
    ? 'from-emerald-400 to-emerald-500'
    : strengthPercent >= 50
      ? 'from-amber-400 to-amber-500'
      : 'from-gray-300 to-gray-400'

  return (
    <div className="space-y-3">
      {/* Profile Card - Glassmorphism */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-[#283036]/80 rounded-2xl border border-white/40 dark:border-[#38434F] shadow-sm overflow-hidden">
        <div className={`h-16 ${user?.banner_url ? '' : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10'}`}>
          {user?.banner_url && (
            <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="px-4 pb-4 -mt-8">
          <div
            className="w-[64px] h-[64px] rounded-full border-[3px] border-white/80 bg-gray-100 dark:bg-[#1D2226] flex items-center justify-center text-sm font-black text-gray-500 dark:text-[#B0B7BE] overflow-hidden shadow-lg mx-auto cursor-pointer ring-1 ring-black/5 dark:ring-[#1D2226]/5 backdrop-blur-sm"
            onClick={() => router.push(`/u/${user?.unique_id}`)}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.substring(0, 2).toUpperCase() || '?'
            )}
          </div>
          <h3
            className="text-sm font-bold text-gray-900 dark:text-white text-center mt-2 cursor-pointer hover:text-purple-600 transition-colors"
            onClick={() => router.push(`/u/${user?.unique_id}`)}
          >
            {user?.full_name}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-[#B0B7BE] text-center font-medium capitalize">
            {user?.role || 'Student'}
          </p>

          {/* Profile Strength */}
          <div className="mt-3 px-0.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold text-gray-400 dark:text-[#B0B7BE] uppercase tracking-wider">Profile Strength</span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-[#B0B7BE]">{strengthPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-[#1D2226]/80 dark:bg-[#1D2226]/80 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${strengthColor} transition-all duration-700 ease-out`}
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-[#38434F]/80 dark:border-[#38434F]/80">
            <div className="text-center">
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">{connections}</p>
              <p className="text-[9px] text-gray-500 dark:text-[#B0B7BE] font-medium">Connections</p>
            </div>
            <div className="w-px h-7 bg-gray-100 dark:bg-[#1D2226]" />
            <div className="text-center">
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">{following}</p>
              <p className="text-[9px] text-gray-500 dark:text-[#B0B7BE] font-medium">Following</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => router.push(`/settings/profile`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-[#B0B7BE] bg-gray-50 dark:bg-[#1D2226]/80 dark:bg-[#1D2226]/80 border border-gray-200 dark:border-[#38434F]/60 dark:border-[#38434F]/60 hover:bg-gray-100 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] hover:text-gray-700 dark:text-white dark:hover:text-white transition-all"
            >
              <Settings size={12} />
              Edit Profile
            </button>
            <button
              onClick={() => router.push(`/u/${user?.unique_id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold text-purple-600 bg-purple-50/80 border border-purple-200/60 hover:bg-purple-100 hover:text-purple-700 transition-all"
            >
              <ExternalLink size={12} />
              View Profile
            </button>
          </div>
        </div>
      </div>

      {/* Navigation - Glassmorphism */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-[#283036]/80 rounded-2xl border border-white/40 dark:border-[#38434F] shadow-sm p-1.5">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = activeTab === link.id
          return (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left ${
                isActive
                  ? 'bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-900/30 dark:to-purple-900/10 text-purple-700 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:bg-[#1D2226]/80 dark:bg-[#1D2226]/80 dark:hover:bg-[#1D2226]/80 hover:text-gray-900 dark:text-white dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {link.badge}
                </span>
              )}
              {link.count !== undefined && link.count > 0 && !link.badge && (
                <span className="text-xs font-medium text-gray-400 dark:text-[#B0B7BE]">{link.count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick links - Glassmorphism */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-[#283036]/80 rounded-2xl border border-white/40 dark:border-[#38434F] shadow-sm p-3">
        <button
          onClick={() => router.push(`/u/${user?.unique_id}`)}
          className="w-full flex items-center gap-2.5 text-[11px] font-semibold text-gray-400 dark:text-[#B0B7BE] hover:text-purple-600 transition-colors"
        >
          <GraduationCap size={13} />
          <span className="flex-1 text-left">View My Profile</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
