import React from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Sparkles, Briefcase, Zap } from 'lucide-react'

interface RightSidebarProps {
  communities: any[]
  userCommunity: any
  campusJobs: any[]
  posts: any[]
}

function RightSidebar({ communities, userCommunity, campusJobs, posts }: RightSidebarProps) {
  const router = useRouter()

  return (
    <aside className="lg:col-span-3 sticky top-[88px] self-start space-y-4 hidden lg:block">

      {/* Top communities leader board */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Campus Leaders
          </h4>
        </div>

        <div className="p-1.5 space-y-0.5">
          {communities.slice(0, 4).map((c: any) => (
            <div
              key={c.id}
              onClick={() => router.push(`/community/c/${c.slug}`)}
              className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="w-7 h-7 rounded bg-purple-50 border border-slate-100 flex items-center justify-center font-bold text-[#7C3AED] overflow-hidden text-[10px] flex-shrink-0">
                {c.colleges?.logo_url ? (
                  <img src={c.colleges.logo_url} alt={c.colleges?.short_name || c.slug} className="w-full h-full object-contain" />
                ) : (
                  c.colleges?.short_name?.[0] || 'C'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-xs text-slate-800 truncate">c/{c.slug}</h5>
                <p className="text-[9px] text-slate-400 font-semibold">{c.member_count || 0} members</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/colleges')}
          className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold text-center border-t border-slate-100 transition-colors cursor-pointer block"
        >
          Explore Campuses ↗
        </button>
      </div>

      {/* Suggested For You Hubs */}
      <div className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm">
        <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Suggested Circles
        </h4>
        <div className="space-y-2.5">
          {communities
            .filter((c: any) => c.slug !== userCommunity?.slug)
            .slice(0, 3)
            .map((c: any) => (
              <div key={c.id} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center font-bold text-slate-500 text-[10px] flex-shrink-0">
                  {c.colleges?.short_name?.[0] || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-xs text-slate-800 truncate">{c.colleges?.short_name || c.display_name}</h5>
                  <p className="text-[9px] text-slate-400 font-semibold truncate">{c.colleges?.location || 'Tamil Nadu'}</p>
                </div>
                <button
                  onClick={() => router.push(`/community/c/${c.slug}`)}
                  className="px-2 py-0.5 border border-slate-200 hover:border-[#7C3AED] hover:text-[#7C3AED] bg-white rounded font-bold text-[9px] text-slate-600 transition-colors cursor-pointer"
                >
                  Join
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Active Placements / Jobs list (real data) */}
      <div className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm">
        <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-rose-500" />
          Campus Placements
        </h4>
        <div className="space-y-2.5 text-[10px] font-semibold text-slate-600">
          {campusJobs.length > 0 ? (
            campusJobs.map((job: any, idx: number) => (
              <div
                key={job.id}
                className={`flex items-center justify-between ${idx < campusJobs.length - 1 ? 'border-b border-slate-50 pb-2' : ''}`}
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-bold text-slate-800 truncate">{job.role}</p>
                  <p className="text-slate-400 mt-0.5 text-[9px] truncate">
                    {job.company_name}{job.referral_available ? ' • Referral' : ''}{job.job_type ? ` • ${job.job_type}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/careers/${job.id}`)}
                  className={`px-2 py-0.5 rounded font-bold text-[9px] cursor-pointer flex-shrink-0 ${idx === 0
                    ? 'bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600'
                    : 'bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600'
                    }`}
                >
                  {idx === 0 ? 'Apply' : 'View'}
                </button>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-[10px] text-center py-2">No active placements yet</p>
          )}
        </div>
        {campusJobs.length > 0 && (
          <button
            onClick={() => router.push('/careers')}
            className="mt-2.5 w-full text-center text-[10px] font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
          >
            View All Jobs →
          </button>
        )}
      </div>

      {/* Platform statistics summary */}
      <div className="bg-slate-950 text-white rounded-md p-3.5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <h4 className="font-bold text-xs mb-3 flex items-center gap-1.5 relative z-10">
          <Zap className="w-4 h-4 text-purple-400" />
          Network Statistics
        </h4>
        <div className="space-y-2.5 relative z-10 text-[10px] font-semibold text-slate-300">
          <div className="flex items-center justify-between">
            <span>Communities Joined</span>
            <span className="text-white font-bold">{communities.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Active Members</span>
            <span className="text-white font-bold">
              {communities.reduce((acc: number, c: any) => acc + (c.member_count || 0), 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>New Submissions</span>
            <span className="text-white font-bold">
              {posts.filter((p: any) => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default React.memo(RightSidebar)
