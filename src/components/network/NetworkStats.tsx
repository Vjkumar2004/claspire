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
    { label: 'Connections', value: connections, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Following', value: following, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Requests', value: requests, icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Communities', value: communities, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`${stat.bg} ${stat.border} border rounded-xl p-4 flex items-center gap-3`}
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
