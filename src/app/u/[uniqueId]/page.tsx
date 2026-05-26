'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Linkedin, GraduationCap, Building2, 
  Briefcase, MessageSquare, Star, Sparkles, 
  ChevronRight, Award, Zap, Globe, Github, Info,
  MapPin, ShieldCheck, ArrowUpCircle, ExternalLink,
  Users, Crown, Calendar, Clock
} from 'lucide-react'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const uniqueId = params?.uniqueId as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (uniqueId) {
      fetchPublicProfile()
    }
  }, [uniqueId])

  const fetchPublicProfile = async () => {
    try {
      const res = await fetch(`/api/u/${uniqueId}`)
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        setError(json.error || 'User not found')
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d ago` 
    if (hours > 0) return `${hours}h ago` 
    if (mins > 0) return `${mins}m ago` 
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-plus-jakarta-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-extrabold animate-pulse uppercase tracking-widest text-[9px]">Loading Public Identity...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-plus-jakarta-sans text-xs">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-5 text-red-500">
          <Info size={30} />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-1">Identity Profile Not Found</h1>
        <p className="text-slate-400 max-w-xs mb-6">The professional profile you're looking for doesn't exist or is currently restricted.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-bold shadow-sm cursor-pointer border-none"
        >
          Go Home
        </button>
      </div>
    )
  }

  const { user, posts } = data
  const avatarUrl = user.avatar_url
  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const college = user.colleges

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-plus-jakarta-sans text-xs">
      
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        
        {/* ── Professional Header Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          {/* Professional Cover */}
          <div className="h-44 md:h-56 bg-gradient-to-r from-slate-100 via-indigo-50/60 to-purple-50 relative border-b border-slate-200/60">
            <div className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -bottom-16 left-6 md:left-10 z-10">
               <div className="relative group">
                  <div className={`w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-white ${!avatarUrl ? 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white text-3xl font-black' : ''}`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  {user.is_verified && (
                    <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center text-blue-500 border border-blue-50">
                      <ShieldCheck size={18} fill="currentColor" fillOpacity={0.1} />
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-6 md:px-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight m-0">
                    {user.full_name}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#475569]">
                  {college && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 size={14} className="text-[#7C3AED]" />
                      {college.name}
                    </div>
                  )}
                  {user.role === 'senior' && user.company && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Briefcase size={14} className="text-blue-500" />
                      {user.designation} at {user.company}
                    </div>
                  )}
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                  <div className="flex items-center gap-1 text-[9px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase tracking-wider">
                    <Crown size={11} /> {user.role === 'senior' ? 'Campus Alumnus' : 'Verified Student'}
                  </div>
                </div>

                {user.bio && (
                  <p className="mt-6 text-xs font-semibold text-slate-500 leading-relaxed max-w-xl bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                    "{user.bio}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                {user.linkedin_url && (
                  <a 
                    href={user.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg font-bold text-xs shadow-sm transition-colors no-underline cursor-pointer"
                  >
                    <Linkedin size={16} /> LinkedIn Profile
                  </a>
                )}
                <div className="p-4 bg-[#0B0F19] rounded-xl text-white relative overflow-hidden shadow-sm border border-slate-800">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider mb-2">Claspire Score</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-extrabold text-purple-400 leading-none">{user.rise_points || 0}</span>
                      <Sparkles className="text-purple-400" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Academic Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap size={14} className="text-[#7C3AED]" /> Academic Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Branch of Study</p>
                  <p className="text-xs font-bold text-slate-700">{user.branch || 'General Science'}</p>
                </div>
                {user.role === 'senior' ? (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Graduation Class</p>
                    <p className="text-xs font-bold text-slate-700">{user.graduation_year || '2024'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Current Year</p>
                      <p className="text-xs font-bold text-slate-700">{user.year || '1'}st Year</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Passout Class</p>
                      <p className="text-xs font-bold text-slate-700">{user.passout_year || '2025'}</p>
                    </div>
                  </div>
                )}
                {college && (
                  <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5">
                    <div className="w-8 h-8 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{college.location}</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">{college.state}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Zap size={14} className="text-orange-500" /> Platform Impact
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 text-center">
                  <p className="text-2xl font-extrabold text-orange-600 mb-0.5">{user.doubt_count || 0}</p>
                  <p className="text-[8px] font-bold text-orange-400 uppercase tracking-tight">Doubts Asked</p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                  <p className="text-2xl font-extrabold text-blue-600 mb-0.5">{user.answer_count || 0}</p>
                  <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tight">Answers Shared</p>
                </div>
              </div>
              <div className="mt-3.5 p-4 bg-green-50/50 rounded-xl border border-green-100 text-center">
                <p className="text-2xl font-extrabold text-green-600 mb-0.5">{user.referral_count || 0}</p>
                <p className="text-[8px] font-bold text-green-400 uppercase tracking-tight">Referrals Facilitated</p>
              </div>
            </div>
          </div>

          {/* Right Column: Activity Feed */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex-1">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#0F172A] m-0">Recent Contributions</h2>
                  <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1">Latest verified posts and discussions</p>
                </div>
                <div className="w-9 h-9 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-center text-slate-400">
                  <MessageSquare size={16} />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {posts && posts.length > 0 ? (
                  posts.map((post: any) => (
                    <div 
                      key={post.id} 
                      onClick={() => router.push(`/community/c/${post.communities.slug}/p/${post.id}`)}
                      className="p-6 hover:bg-slate-50/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border transition-colors ${
                          post.type === 'doubt' 
                            ? 'bg-orange-50 text-orange-600 border-orange-100 group-hover:bg-orange-100' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100'
                        }`}>
                          {post.type}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                          <Clock size={11} /> {timeAgo(post.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors mb-2 leading-tight">
                        {post.title}
                      </h3>
                      
                      <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2 mb-4">
                        {post.content}
                      </p>

                      {post.image_url && (
                        <div className="rounded-xl overflow-hidden border border-slate-150 shadow-sm mb-4 max-h-[300px]">
                          <img src={post.image_url} alt="Post content" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-150">
                            <ArrowUpCircle size={12} className="text-green-500" />
                          </div>
                          {post.upvote_count} Upvotes
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-150">
                            <Star size={12} className="text-[#7C3AED]" />
                          </div>
                          {post.answer_count} Answers
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-350">
                      <Zap size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Passive Contributor</h3>
                    <p className="text-slate-400 max-w-xs mx-auto text-xs font-semibold">This user hasn't made any public contributions to the community yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-20 border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                C
             </div>
             <p className="text-xs text-slate-500 font-bold">Claspire Digital Portfolio · 2026</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider no-underline hover:text-[#7C3AED] transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider no-underline hover:text-[#7C3AED] transition-colors">Community Guidelines</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider no-underline hover:text-[#7C3AED] transition-colors">Support</a>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}} />
    </div>
  )
}
