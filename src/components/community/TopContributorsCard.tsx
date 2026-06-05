import React from 'react'
import { useRouter } from 'next/navigation'
import { Award } from 'lucide-react'

interface Contributor {
  id: string
  full_name: string
  avatar_url: string | null
  rise_points: number
  rp_level: number
  unique_id: string | null
}

interface TopContributorsCardProps {
  contributors: Contributor[]
}

function TopContributorsCard({ contributors }: TopContributorsCardProps) {
  const router = useRouter()

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  return (
    <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          Top Contributors
        </h4>
      </div>

      <div className="p-1.5 space-y-0.5">
        {contributors.length > 0 ? (
          contributors.map((contributor, index) => (
            <div
              key={contributor.id}
              onClick={() => router.push(`/u/${contributor.unique_id}`)}
              className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <span className="text-sm flex-shrink-0">{getRankEmoji(index)}</span>
              <div className="w-7 h-7 rounded-full bg-purple-50 border border-slate-100 flex items-center justify-center font-bold text-[#7C3AED] overflow-hidden text-[10px] flex-shrink-0">
                {contributor.avatar_url ? (
                  <img src={contributor.avatar_url} alt={contributor.full_name} className="w-full h-full object-cover" />
                ) : (
                  contributor.full_name?.[0] || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-slate-800 truncate">{contributor.full_name}</h5>
                <p className="text-[9px] text-slate-400 font-semibold">{contributor.rise_points} RP • Level {contributor.rp_level}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-[10px] text-center py-3">No contributors yet</p>
        )}
      </div>
    </div>
  )
}

export default React.memo(TopContributorsCard)
