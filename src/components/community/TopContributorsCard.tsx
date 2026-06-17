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
    <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] overflow-hidden shadow-sm">
      <div className="p-3.5 border-b border-surface dark:border-[#38434F] flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
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
              className="flex items-center gap-2.5 p-2 rounded hover:bg-app dark:hover:bg-[#1D2226] cursor-pointer transition-colors"
            >
              <span className="text-sm flex-shrink-0">{getRankEmoji(index)}</span>
              <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-surface dark:border-[#38434F] flex items-center justify-center font-bold text-[#7C3AED] overflow-hidden text-[10px] flex-shrink-0">
                {contributor.avatar_url ? (
                  <img src={contributor.avatar_url} alt={contributor.full_name} className="w-full h-full object-cover" />
                ) : (
                  contributor.full_name?.[0] || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate">{contributor.full_name}</h5>
                <p className="text-[9px] text-slate-400 dark:text-[#B0B7BE] font-semibold">{contributor.rise_points} RP • Level {contributor.rp_level}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 dark:text-[#B0B7BE] text-[10px] text-center py-3">No contributors yet</p>
        )}
      </div>
    </div>
  )
}

export default React.memo(TopContributorsCard)
