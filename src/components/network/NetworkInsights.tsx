'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, Briefcase, Sparkles, Building2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Insight {
  label: string
  icon: React.ElementType
  description: string
  href?: string
}

export default function NetworkInsights() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    if (!user) return
    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/network/stats')
        const stats = await res.json()
        const items: Insight[] = []

        if (user.college_id) {
          items.push({
            label: 'Your College Network',
            icon: GraduationCap,
            description: stats.connections > 0
              ? `${stats.connections} connection${stats.connections !== 1 ? 's' : ''} from your college`
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

        if (stats.connections > 0) {
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
      } catch {
        setInsights([])
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [user])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Networking Insights</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Networking Insights</h3>
      <div className="space-y-2">
        {insights.map((item) => {
          const Icon = item.icon
          const content = (
            <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
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
