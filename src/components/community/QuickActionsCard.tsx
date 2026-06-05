import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, BookOpen, Target } from 'lucide-react'

function QuickActionsCard() {
  const router = useRouter()

  const actions = [
    { 
      key: 'create-post', 
      label: 'Create Post', 
      icon: Plus, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => router.push('?create=true')
    },
    { 
      key: 'find-seniors', 
      label: 'Find Seniors', 
      icon: Users, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: () => router.push('/seniors')
    },
    { 
      key: 'browse-resources', 
      label: 'Browse Resources', 
      icon: BookOpen, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => router.push('/community?filter=resource')
    },
    { 
      key: 'referral-requests', 
      label: 'Referral Requests', 
      icon: Target, 
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      action: () => router.push('/careers')
    },
  ]

  return (
    <div className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm">
      <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
        <Plus className="w-4 h-4 text-slate-600" />
        Quick Actions
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={action.action}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full ${action.bgColor} flex items-center justify-center`}>
              <action.icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <span className="text-[9px] font-bold text-slate-700 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default React.memo(QuickActionsCard)
