import React from 'react'
import { GraduationCap, Building2, Award, Globe, TrendingUp, HelpCircle } from 'lucide-react'
import { resolveDisplayBio } from '@/lib/profile-data'
import YourProgressCard from './YourProgressCard'
import QuickActionsCard from './QuickActionsCard'
import YourImpactCard from './YourImpactCard'

interface LeftSidebarProps {
  user: any
  userCommunity: any
  filter: string
  setFilter: (val: string) => void
  setFeedSearchQuery: (val: string) => void
}

function LeftSidebar({ user, userCommunity, filter, setFilter, setFeedSearchQuery }: LeftSidebarProps) {
  return (
    <aside className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-[88px] self-start space-y-4">
      {/* Identity Card */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <div 
          className="h-20 relative bg-slate-100"
          style={{
            background: user?.banner_url 
              ? `url(${user.banner_url}) center/cover no-repeat` 
              : 'linear-gradient(to right, #7e22ce, #312e81)'
          }}
        >
          {!user?.banner_url && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
          )}
        </div>

        <div className="px-4 pb-4 relative flex flex-col items-center -mt-10">

          {/* User Avatar with outer ring */}
          <div className="w-20 h-20 rounded-md border-4 border-white overflow-hidden bg-slate-50 shadow-md flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-slate-800 uppercase">
                {user?.full_name?.[0] || 'U'}
              </span>
            )}
          </div>

          {/* Name & Badge details */}
          <h3 className="font-bold text-slate-900 text-sm mt-3 text-center leading-tight">
            {user?.full_name || 'Guest User'}
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 text-center truncate w-full">
            @{user?.unique_id || 'guest'}
          </p>

          <div className="flex items-center gap-1 mt-2">
            <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${user?.role === 'senior'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-purple-50 text-purple-600 border-purple-100'
              }`}>
              {user?.role === 'senior' ? '★ Verified Senior Mentor' : 'Mentee Member'}
            </span>
          </div>

          {/* Professional headline/bio context */}
          <p className="text-[11px] text-slate-500 text-center font-medium mt-3 px-1 leading-normal border-b border-slate-100 pb-3 w-full">
            {resolveDisplayBio(user?.bio) || (user?.role === 'senior'
              ? `Mentor • Specialist at ${user?.company || 'Industry Partners'}`
              : `Student of ${user?.branch || 'Engineering Department'}`)}
          </p>

          {/* Extended academic & student details */}
          <div className="w-full pt-3 space-y-2 text-[10px] text-slate-500 font-semibold border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{userCommunity?.colleges?.short_name || user?.college || 'No campus linked'}</span>
            </div>
            {user?.branch && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{user.branch}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Graduation: {user?.graduation_year || user?.passout_year || 'Class of 2026'}</span>
            </div>
          </div>

          {/* High Density Metric Tally grid */}
          <div className="w-full pt-3 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="block text-[14px] font-black text-[#7C3AED] leading-none">
                {user?.rise_points || user?.points || 0}
              </span>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mt-1 block">
                Rise RP
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <span className="block text-[14px] font-black text-slate-800 leading-none">
                {user?.answer_count || 0}
              </span>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mt-1 block">
                Answers
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Your Progress Card */}
      <YourProgressCard
        risePoints={user?.rise_points || 0}
        rpLevel={user?.rp_level || 1}
      />

      {/* Quick Actions Card */}
      <QuickActionsCard />

      {/* Your Impact Card */}
      <YourImpactCard
        doubtCount={user?.doubt_count || 0}
        answerCount={user?.answer_count || 0}
        referralCount={user?.referral_count || 0}
        upvotesReceived={0} // Not readily available in user data
      />

      {/* Navigation shortcuts list */}
      <div className="bg-white rounded-md border border-slate-200 p-2.5 shadow-sm">
        <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">
          Ecosystem Hubs
        </h4>
        <nav className="space-y-0.5">
          {[
            { key: 'all', label: 'Global Feed Home', icon: Globe },
            { key: 'trending', label: 'Trending Posts', icon: TrendingUp },
            { key: 'doubt', label: 'Q&A doubts', icon: HelpCircle }
          ].map((item) => {
            const isActive = filter === item.key
            return (
              <button
                key={item.key}
                onClick={() => {
                  setFilter(item.key)
                  setFeedSearchQuery('') // Reset query on layout change
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded font-bold text-xs transition-colors cursor-pointer ${isActive ? 'bg-purple-50 text-[#7C3AED]' : 'text-slate-600 hover:text-black hover:bg-slate-50'
                  }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default React.memo(LeftSidebar)
