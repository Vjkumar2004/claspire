import React from 'react'
import { MessageSquare, MessageCircle, ThumbsUp, Share2 } from 'lucide-react'

interface YourImpactCardProps {
  doubtCount: number
  answerCount: number
  referralCount: number
  upvotesReceived?: number
}

function YourImpactCard({ doubtCount, answerCount, referralCount, upvotesReceived = 0 }: YourImpactCardProps) {
  const metrics = [
    { label: 'Posts Created', value: doubtCount, icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Answers Given', value: answerCount, icon: MessageCircle, color: 'text-purple-500' },
    { label: 'Upvotes Earned', value: upvotesReceived, icon: ThumbsUp, color: 'text-emerald-500' },
    { label: 'Referrals Shared', value: referralCount, icon: Share2, color: 'text-rose-500' },
  ]

  return (
    <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-3.5 shadow-sm">
      <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3 flex items-center gap-1.5">
        <MessageCircle className="w-4 h-4 text-indigo-500" />
        Your Impact
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-app dark:bg-[#1D2226] rounded-md p-2.5 border border-surface dark:border-[#38434F]"
          >
            <metric.icon className={`w-4 h-4 ${metric.color} mb-1`} />
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-none">{metric.value}</p>
            <p className="text-[9px] text-slate-500 dark:text-[#B0B7BE] font-semibold mt-0.5 leading-tight">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(YourImpactCard)
