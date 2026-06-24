import React from 'react'
import { Activity, MessageSquare, Send, UserCheck, Users, Globe, Hash } from 'lucide-react'

interface CommunityActivityCardProps {
  todayPosts: number
  todayAnswers: number
  todayReferrals: number
  todaySeniors: number
  totalCommunities?: number
  totalMembers?: number
  totalDiscussions?: number
}

function CommunityActivityCard({ 
  todayPosts, 
  todayAnswers, 
  todayReferrals, 
  todaySeniors,
  totalCommunities,
  totalMembers,
  totalDiscussions
}: CommunityActivityCardProps) {
  const primaryActivities = [
    { label: "Today's Posts", value: todayPosts, icon: MessageSquare, color: 'text-blue-500' },
    { label: "Today's Answers", value: todayAnswers, icon: Activity, color: 'text-[#F4A01C]' },
    { label: "Referrals Made", value: todayReferrals, icon: Send, color: 'text-emerald-500' },
    { label: "New Seniors", value: todaySeniors, icon: UserCheck, color: 'text-amber-500' },
  ]

  const optionalMetrics = [
    { label: "Total Communities", value: totalCommunities || 0, icon: Globe, color: 'text-indigo-500' },
    { label: "Total Members", value: totalMembers || 0, icon: Users, color: 'text-rose-500' },
    { label: "Total Discussions", value: totalDiscussions || 0, icon: Hash, color: 'text-cyan-500' },
  ].filter(m => m.value > 0)

  return (
    <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-3.5 shadow-sm">
      <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3 flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-rose-500" />
        Community Activity
      </h4>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        {primaryActivities.map((activity) => (
          <div
            key={activity.label}
            className="bg-app dark:bg-[#1D2226] rounded-md p-2.5 border border-surface dark:border-[#38434F]"
          >
            <activity.icon className={`w-4 h-4 ${activity.color} mb-1`} />
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{activity.value}</p>
            <p className="text-[9px] text-slate-500 dark:text-[#B0B7BE] font-semibold mt-0.5">{activity.label}</p>
          </div>
        ))}
      </div>

      {optionalMetrics.length > 0 && (
        <>
          <div className="border-t border-surface dark:border-[#38434F] my-3" />
          <div className="space-y-2">
            {optionalMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-slate-500 dark:text-[#B0B7BE] font-semibold flex items-center gap-1.5">
                  <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
                  {metric.label}
                </span>
                <span className="text-slate-900 dark:text-white font-bold">{metric.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(CommunityActivityCard)
