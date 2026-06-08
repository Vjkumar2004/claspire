'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, HeartHandshake, Compass, UserCheck } from 'lucide-react'
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

  return (
    <div className="space-y-4">
      {/* Profile Summary Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className={`h-16 ${user?.banner_url ? '' : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10'}`}>
          {user?.banner_url && (
            <img src={user.banner_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="px-4 pb-4 -mt-8">
          <div className="w-14 h-14 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-base font-black text-gray-500 overflow-hidden shadow-md mx-auto">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.substring(0, 2).toUpperCase() || '?'
            )}
          </div>
          <h3
            className="text-sm font-bold text-gray-900 text-center mt-2 cursor-pointer hover:text-purple-600 transition-colors"
            onClick={() => router.push(`/u/${user?.unique_id}`)}
          >
            {user?.full_name}
          </h3>
          <p className="text-[11px] text-gray-500 text-center font-medium">{user?.role === 'senior' ? 'Senior' : 'Student'}</p>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-extrabold text-gray-900">{connections}</p>
              <p className="text-[10px] text-gray-500 font-semibold">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-extrabold text-gray-900">{following}</p>
              <p className="text-[10px] text-gray-500 font-semibold">Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-200 rounded-xl p-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = activeTab === link.id
          return (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                isActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
                <span className="text-xs font-semibold text-gray-400">{link.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
