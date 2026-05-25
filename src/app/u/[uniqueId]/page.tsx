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
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts')

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Profile...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
          <Info size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Profile Not Found</h1>
        <p className="text-gray-500 max-w-sm mb-8">The profile you're looking for doesn't exist or has been moved.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-100"
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
    <div className="min-h-screen bg-[#F8FAFC]">
      
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        
        {/* ── Professional Header Card ── */}
        <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
          {/* Professional Cover */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] relative">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute -bottom-16 left-8 md:left-12">
               <div className="relative group">
                  <div className={`w-36 h-36 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-white ${!avatarUrl ? 'bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-black' : ''}`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  {user.is_verified && (
                    <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-500 border border-blue-50">
                      <ShieldCheck size={24} fill="currentColor" fillOpacity={0.1} />
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="pt-20 pb-10 px-8 md:px-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-3xl md:text-5xl font-black text-[#0F172A] font-instrument-serif tracking-tight m-0 uppercase italic">
                    {user.full_name}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                  {college && (
                    <div className="flex items-center gap-2 text-sm font-bold text-[#64748B]">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Building2 size={16} className="text-purple-600" />
                      </div>
                      {college.name}
                    </div>
                  )}
                  {user.role === 'senior' && user.company && (
                    <div className="flex items-center gap-2 text-sm font-bold text-[#64748B]">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Briefcase size={16} className="text-blue-600" />
                      </div>
                      {user.designation} at {user.company}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                    <Crown size={14} /> {user.role === 'senior' ? 'Campus Alumnus' : 'Verified Student'}
                  </div>
                </div>

                {user.bio && (
                  <p className="mt-8 text-lg font-medium text-[#475569] leading-relaxed max-w-2xl bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50 italic">
                    "{user.bio}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4 min-w-[200px]">
                {user.linkedin_url && (
                  <a 
                    href={user.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0A66C2] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-100 no-underline"
                  >
                    <Linkedin size={20} /> LinkedIn Profile
                  </a>
                )}
                <div className="p-6 bg-[#0F172A] rounded-3xl text-white relative overflow-hidden shadow-xl shadow-gray-200">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/20 rounded-full blur-3xl -mr-12 -mt-12" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-3">Claspire Score</p>
                    <div className="flex items-end justify-between">
                      <span className="text-4xl font-black font-instrument-serif text-purple-400">{user.rise_points || 0}</span>
                      <Sparkles className="text-purple-400 mb-1" size={20} />
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
            <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
              <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <GraduationCap size={18} className="text-purple-600" /> Academic Path
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch of Study</p>
                  <p className="text-md font-bold text-gray-900">{user.branch || 'General Science'}</p>
                </div>
                {user.role === 'senior' ? (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Graduation Class</p>
                    <p className="text-md font-bold text-gray-900">{user.graduation_year || '2024'}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Year</p>
                        <p className="text-md font-bold text-gray-900">{user.year || '1'}st Year</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passout</p>
                        <p className="text-md font-bold text-gray-900">{user.passout_year || '2025'}</p>
                      </div>
                    </div>
                  </>
                )}
                {college && (
                  <div className="pt-6 border-t border-gray-100 flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{college.location}</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{college.state}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Card */}
            <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
              <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <Zap size={18} className="text-orange-500" /> Community Impact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100 text-center">
                  <p className="text-3xl font-black text-orange-600 mb-1">{user.doubt_count || 0}</p>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Doubts Asked</p>
                </div>
                <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                  <p className="text-3xl font-black text-blue-600 mb-1">{user.answer_count || 0}</p>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Answers Shared</p>
                </div>
              </div>
              <div className="mt-4 p-5 bg-green-50 rounded-3xl border border-green-100 text-center">
                <p className="text-3xl font-black text-green-600 mb-1">{user.referral_count || 0}</p>
                <p className="text-[10px] font-black text-green-400 uppercase tracking-tighter">Referrals Facilitated</p>
              </div>
            </div>
          </div>

          {/* Right Column: Activity Feed */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden flex-1">
              <div className="px-10 py-8 border-b border-[#F1F5F9] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#0F172A] font-instrument-serif m-0">Recent Contributions</h2>
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-2">Latest posts and discussions</p>
                </div>
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                  <MessageSquare size={24} />
                </div>
              </div>

              <div className="divide-y divide-[#F1F5F9]">
                {posts && posts.length > 0 ? (
                  posts.map((post: any) => (
                    <div 
                      key={post.id} 
                      onClick={() => router.push(`/community/c/${post.communities.slug}/p/${post.id}`)}
                      className="p-10 hover:bg-gray-50/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                          post.type === 'doubt' 
                            ? 'bg-orange-50 text-orange-600 border-orange-100 group-hover:bg-orange-100' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100'
                        }`}>
                          {post.type}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                          <Clock size={12} /> {timeAgo(post.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-black text-[#0F172A] group-hover:text-purple-600 transition-colors mb-4 leading-tight">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-500 text-md font-medium leading-relaxed line-clamp-2 mb-6">
                        {post.content}
                      </p>

                      {post.image_url && (
                        <div className="rounded-[32px] overflow-hidden border border-gray-100 shadow-sm mb-6 max-h-[400px]">
                          <img src={post.image_url} alt="Post content" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                            <ArrowUpCircle size={16} className="text-green-500" />
                          </div>
                          {post.upvote_count} Upvotes
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                            <Star size={16} className="text-purple-500" />
                          </div>
                          {post.answer_count} Answers
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-32 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                      <Zap size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Passive Contributor</h3>
                    <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium">This user hasn't made any public contributions to the community yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-20 border-t border-gray-200 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center text-white font-black">
                C
             </div>
             <p className="text-sm text-gray-500 font-bold">Claspire Digital Portfolio · 2024</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-black text-gray-400 uppercase tracking-widest no-underline hover:text-purple-600 transition-colors">Privacy</a>
            <a href="#" className="text-xs font-black text-gray-400 uppercase tracking-widest no-underline hover:text-purple-600 transition-colors">Community Guidelines</a>
            <a href="#" className="text-xs font-black text-gray-400 uppercase tracking-widest no-underline hover:text-purple-600 transition-colors">Support</a>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}} />
    </div>
  )
}
