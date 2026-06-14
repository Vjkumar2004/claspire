import React from 'react'
import { Zap, TrendingUp } from 'lucide-react'

interface YourProgressCardProps {
  risePoints: number
  rpLevel: number
}

function YourProgressCard({ risePoints, rpLevel }: YourProgressCardProps) {
  // Calculate next level thresholds
  const getLevelInfo = (level: number) => {
    const thresholds = [
      { level: 1, name: 'Newcomer', min: 0, max: 100 },
      { level: 2, name: 'Contributor', min: 100, max: 500 },
      { level: 3, name: 'Mentor', min: 500, max: 1500 },
      { level: 4, name: 'Expert', min: 1500, max: 3000 },
      { level: 5, name: 'Master', min: 3000, max: 5000 },
      { level: 6, name: 'Legend', min: 5000, max: Infinity },
    ]
    
    const currentLevel = thresholds.find(t => t.level === level) || thresholds[0]
    const nextLevel = thresholds.find(t => t.level === level + 1)
    
    return { currentLevel, nextLevel }
  }

  const { currentLevel, nextLevel } = getLevelInfo(rpLevel)
  const progress = nextLevel 
    ? Math.min(100, ((risePoints - currentLevel.min) / (nextLevel.max - currentLevel.min)) * 100)
    : 100
  const pointsToNext = nextLevel 
    ? Math.max(0, nextLevel.max - risePoints)
    : 0

  return (
    <div className="bg-white dark:bg-[#283036] rounded-md border border-slate-200 dark:border-[#38434F] p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          Your Progress
        </h4>
        <span className="text-[9px] font-bold text-purple-600 dark:text-[#0A66C2] bg-purple-50 dark:bg-[#0A66C2]/15 px-2 py-0.5 rounded-full">
          Level {rpLevel}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
          <span className="text-slate-600 dark:text-[#B0B7BE]">{currentLevel.name}</span>
          <span className="text-slate-400 dark:text-[#B0B7BE]">
            {risePoints} RP / {nextLevel?.max || 'Max'} RP
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-[#1D2226] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {nextLevel && (
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-[#B0B7BE] font-semibold">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span>{pointsToNext} RP to {nextLevel.name}</span>
        </div>
      )}
    </div>
  )
}

export default React.memo(YourProgressCard)
