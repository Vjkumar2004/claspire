'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, Briefcase, Sparkles, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Insight {
  label: string
  icon: React.ElementType
  description: string
  href?: string
}

export default function NetworkInsights({ connectionsCount = 0 }: { connectionsCount?: number }) {
  const router = useRouter()
  const { user } = useAuth()
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    if (!user) return
    const items: Insight[] = []

    if (user.college_id) {
      items.push({
        label: 'Your College Network',
        icon: GraduationCap,
        description: connectionsCount > 0
          ? `${connectionsCount} connection${connectionsCount !== 1 ? 's' : ''} from your college`
          : 'Connect with peers from your college',
        href: `/network?college=${user.college_id}`,
      })
    }

    if (user.branch) {
      items.push({
        label: 'Your Department',
        icon: Users,
        description: `People in ${user.branch}`,
        href: `/network?branch=${user.branch}`,
      })
    }

    if (connectionsCount > 0) {
      items.push({
        label: 'Seniors in Your Network',
        icon: Briefcase,
        description: 'Connect with seniors for mentorship',
      })
    }

    items.push({
      label: 'Suggested Mentors',
      icon: Sparkles,
      description: 'Experienced seniors ready to guide you',
    })

    items.push({
      label: 'Trending Communities',
      icon: Building2,
      description: 'Join active communities in your college',
      href: '/community',
    })

    setInsights(items)
  }, [user, connectionsCount])

  if (!insights.length) {
    return null
  }

  return (
    <div className="bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-xl p-4">
      <h3 className="text-xs font-bold text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider mb-3">Networking Insights</h3>
      <div className="space-y-2">
        {insights.map((item) => {
          const Icon = item.icon
          const content = (
            <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-app dark:hover:bg-[#1D2226] transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] dark:bg-blue-900/30 text-[#0A66C2] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-[#B0B7BE] mt-0.5 line-clamp-2">{item.description}</p>
              </div>
            </div>
          )
          if (item.href) {
            return (
              <div key={item.label} onClick={() => router.push(item.href!)}>
                {content}
              </div>
            )
          }
          return <div key={item.label}>{content}</div>
        })}
      </div>
    </div>
  )
}
