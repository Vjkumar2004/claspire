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
    <div className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm">
      <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
        <MessageCircle className="w-4 h-4 text-indigo-500" />
        Your Impact
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-slate-50 rounded-md p-2.5 border border-slate-100"
          >
            <metric.icon className={`w-4 h-4 ${metric.color} mb-1`} />
            <p className="text-lg font-bold text-slate-900 leading-none">{metric.value}</p>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-tight">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(YourImpactCard)
