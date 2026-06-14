'use client'

import { Users, UserCheck, UserPlus, Building2 } from 'lucide-react'

interface NetworkStatsProps {
  connections: number
  following: number
  requests: number
  communities: number
}

export default function NetworkStats({ connections, following, requests, communities }: NetworkStatsProps) {
  const stats = [
    { label: 'Connections', value: connections, icon: UserCheck },
    { label: 'Following', value: following, icon: Users },
    { label: 'Requests', value: requests, icon: UserPlus },
    { label: 'Communities', value: communities, icon: Building2 },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex items-center gap-1.5 bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-1.5"
          >
            <Icon size={13} className="text-gray-400 dark:text-[#B0B7BE]" />
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">{stat.value}</span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-[#B0B7BE] hidden sm:inline">{stat.label}</span>
          </div>
        )
      })}
    </div>
  )
}
