'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Linkedin, GraduationCap, Building2, 
  Briefcase, Save, Camera, ArrowRight, ShieldCheck, 
  LayoutDashboard, Users, Lock, ChevronRight, MessageSquare, 
  ArrowUpCircle, Star, Sparkles, LogOut, Bell, Menu, X, 
  Settings, Award, Zap, Globe, Github, Info
} from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'professional'>('info')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [formData, setFormData] = useState({
    bio: '',
    branch: '',
    year: '',
    cgpa: '',
    linkedin_url: '',
    passout_year: '',
    company: '',
    designation: '',
    graduation_year: ''
  })

  const [doubtCount, setDoubtCount] = useState(0)
  const [answerCount, setAnswerCount] = useState(0)

  useEffect(() => {
    fetchUserData()
    const interval = setInterval(fetchUserData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkForNewPost = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const refreshNeeded = urlParams.get('refresh') === 'true' || 
                           localStorage.getItem('profile_refresh_needed') === 'true'
      
      if (refreshNeeded && !loading) {
        fetchUserData()
        localStorage.removeItem('profile_refresh_needed')
        if (urlParams.get('refresh') === 'true') {
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }
      }
    }
    
    checkForNewPost()
  }, [loading])

  const handleStartDiscussion = () => {
    if (joinedCommunities.length > 0) {
      const community = joinedCommunities[0].communities
      router.push(`/community/c/${community.slug}?create=true`)
    } else {
      router.push('/community?create=true')
    }
  }

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        setPosts(data.myPosts || [])
        setJoinedCommunities(data.joinedCommunities || [])
        setDoubtCount(data.user.doubt_count || 0)
        setAnswerCount(data.user.answer_count || 0)
        setFormData({
          bio: data.user.bio || '',
          branch: data.user.branch || '',
          year: data.user.year?.toString() || '1',
          cgpa: data.user.cgpa?.toString() || '',
          linkedin_url: data.user.linkedin_url || '',
          passout_year: data.user.passout_year?.toString() || '2025',
          company: data.user.company || '',
          designation: data.user.designation || '',
          graduation_year: data.user.graduation_year?.toString() || '2024'
        })
        setAvatarUrl(data.user.avatar_url || '')
      } else {
        router.push('/login')
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (
      formData.linkedin_url && 
      !formData.linkedin_url.startsWith('https://linkedin.com') &&
      !formData.linkedin_url.startsWith('https://www.linkedin.com')
    ) {
      setError('LinkedIn URL must start with https://linkedin.com or https://www.linkedin.com')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...formData,
           cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
           year: parseInt(formData.year),
           passout_year: parseInt(formData.passout_year),
           graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null
        })
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess('Changes saved successfully! ✨')
        setUser(data.user)
        const localUser = JSON.parse(localStorage.getItem('claspire_user') || '{}')
        localStorage.setItem('claspire_user', JSON.stringify({ ...localUser, ...data.user }))
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // const updateStudentExtras = (patch: Partial<any>) => {
  //   setProfileData((prev) => mergeStudentExtras(prev, patch))
  // }

  // const updateSeniorExtras = (patch: Partial<any>) => {
  //   setProfileData((prev) => mergeSeniorExtras(prev, patch))
  // }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-plus-jakarta-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-extrabold tracking-widest text-[10px] uppercase">Retrieving Profile...</p>
        </motion.div>
      </div>
    )
  }

  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const collegeName = user.colleges?.short_name || 'Claspire Student'

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: user.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior' },
    { id: 'community', label: 'Community', icon: <Users size={16} />, href: '/community' },
    { id: 'profile', label: 'Settings', icon: <Settings size={16} />, active: true },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-plus-jakarta-sans text-xs">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-6 top-24 bottom-6 w-64 bg-white rounded-2xl border border-slate-200/80 shadow-sm hidden lg:flex flex-col p-5 z-40">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className={`w-9 h-9 rounded-lg ${avatarUrl ? 'bg-transparent' : 'bg-[#7C3AED]'} flex items-center justify-center text-white font-extrabold text-sm overflow-hidden flex-shrink-0`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0F172A] truncate m-0">{user.full_name}</p>
            <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-wider mt-0.5">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
           {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => item.href && router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none bg-transparent ${
                  item.active 
                    ? 'bg-purple-50 text-[#7C3AED]' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#0F172A]'
                }`}
              >
                <div className={`transition-transform ${item.active ? 'text-[#7C3AED]' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                {item.label}
              </button>
           ))}
        </nav>

        <button 
          onClick={async () => { 
            localStorage.removeItem('claspire_user'); 
            try { await fetch('/api/auth/signout', { method: 'POST' }) } catch {} 
            router.push('/login'); 
          }}
          className="mt-auto w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent"
        >
           <LogOut size={16} />
           Sign Out
        </button>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="lg:ml-72 pt-24 px-4 lg:px-8 max-w-5xl mx-auto pb-20">
         
         {/* ── Profile Cover & Header ── */}
         <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
            {/* Cover Area */}
            <div className="h-44 md:h-56 bg-gradient-to-r from-slate-100 via-indigo-50 to-purple-50 relative border-b border-slate-200/60">
               <div className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:16px_16px]" />
               <div className="absolute -bottom-16 left-6 md:left-10 z-10">
                  <AvatarUpload
                    currentUrl={avatarUrl}
                    userName={user?.full_name || ''}
                    size={120}
                    onUploadSuccess={(url) => {
                      setAvatarUrl(url)
                      setUser({ ...user, avatar_url: url })
                    }}
                  />
               </div>
            </div>

            {/* Header Content */}
            <div className="pt-20 pb-8 px-6 md:px-10">
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                     <div className="flex items-center flex-wrap gap-2.5 mb-2.5">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">{user.full_name}</h1>
                        {user.is_verified && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <ShieldCheck size={12} fill="currentColor" fillOpacity={0.1} /> Verified
                          </span>
                        )}
                     </div>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#475569]">
                        <span className="flex items-center gap-1.5"><Building2 size={14} className="text-indigo-600" /> {collegeName}</span>
                         {user.role === 'senior' && user.company ? (
                            <>
                               <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                               <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-blue-600" /> {user.designation} at {user.company}</span>
                            </>
                         ) : null}
                        <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                        <span className="text-[10px] font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded uppercase">ID: {user.unique_id}</span>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <button 
                        onClick={() => router.push(`/u/${user.unique_id}`)}
                        className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#334155] hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                     >
                        View Public Profile
                     </button>
                     <button 
                        onClick={() => handleSave()} 
                        disabled={saving} 
                        className="px-5 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                     >
                        {saving ? 'Saving...' : 'Save Updates'}
                     </button>
                  </div>
               </div>

               {/* Tabs Navigation */}
               <div className="flex items-center gap-6 mt-10 border-b border-slate-200/80">
                  {[
                    { id: 'info', label: 'Account Info', icon: <User size={14} /> },
                    { id: 'professional', label: 'Professional', icon: <Briefcase size={14} /> },
                    { id: 'activity', label: 'Post Activity', icon: <MessageSquare size={14} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-all relative border-none bg-transparent cursor-pointer ${
                        activeTab === tab.id ? 'text-[#7C3AED]' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.icon} {tab.label}
                      {activeTab === tab.id && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED]" />
                      )}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Center Column */}
            <div className="lg:col-span-8 space-y-8">
               
               <AnimatePresence mode="wait">
                  {activeTab === 'info' && (
                    <motion.div 
                      key="info-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm"
                    >
                       <h2 className="text-sm font-extrabold text-[#0F172A] mb-6 flex items-center gap-2 tracking-tight">
                          <Zap size={16} className="text-purple-600" /> General Information
                       </h2>
                       <div className="space-y-5">
                          <div>
                             <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Your Bio / Professional One-liner</label>
                             <textarea 
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value.slice(0, 200)})}
                                placeholder="Write a highly professional professional summary..."
                                className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all h-24 resize-none font-medium shadow-inner"
                             />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Email Address</label>
                                <div className="w-full bg-[#F8FAFC] border border-slate-200/60 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-center justify-between font-bold">
                                   {user.email} <Lock size={12} className="opacity-40" />
                                </div>
                             </div>

                             <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">LinkedIn Profile</label>
                                <div className="relative">
                                   <input 
                                      type="text" value={formData.linkedin_url}
                                      onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                                      placeholder="https://linkedin.com/in/..."
                                      className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 pl-10 text-xs text-[#0F172A] outline-none transition-all font-semibold"
                                   />
                                   <Linkedin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600" />
                                </div>
                             </div>

                             {user.role !== 'senior' && (
                               <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Academic Year</label>
                                  <select 
                                     value={formData.year}
                                     onChange={(e) => setFormData({...formData, year: e.target.value})}
                                     className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-bold appearance-none cursor-pointer"
                                  >
                                     <option value="1">1st Year</option>
                                     <option value="2">2nd Year</option>
                                     <option value="3">3rd Year</option>
                                     <option value="4">Final Year</option>
                                  </select>
                               </div>
                             )}

                             {user.role !== 'senior' && (
                               <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Academic CGPA</label>
                                  <input 
                                     type="number" step="0.01" max="10"
                                     value={formData.cgpa}
                                     onChange={(e) => setFormData({...formData, cgpa: e.target.value})}
                                     placeholder="Current CGPA"
                                     className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-bold"
                                  />
                               </div>
                             )}
                          </div>
                          
                          {error && (
                             <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
                                ⚠️ {error}
                             </div>
                          )}
                          {success && (
                             <div className="bg-green-50 text-green-600 p-4 rounded-xl text-xs font-bold border border-green-100">
                                ✨ {success}
                             </div>
                          )}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'professional' && (
                    <motion.div 
                      key="pro-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm"
                    >
                       <h2 className="text-sm font-extrabold text-[#0F172A] mb-6 flex items-center gap-2 tracking-tight">
                          <Building2 size={16} className="text-blue-500" /> Career & Education
                       </h2>
                       
                       <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Academic Branch</label>
                                <input 
                                   type="text" value={formData.branch}
                                   onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                   placeholder="e.g. Computer Science"
                                   className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-bold"
                                />
                             </div>

                             {user.role !== 'senior' && (
                               <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Passout Year</label>
                                  <select 
                                     value={formData.passout_year}
                                     onChange={(e) => setFormData({...formData, passout_year: e.target.value})}
                                     className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-bold appearance-none cursor-pointer"
                                  >
                                     {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                     ))}
                                  </select>
                               </div>
                             )}

                             {user.role === 'senior' && (
                               <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Graduation Year</label>
                                  <select 
                                     value={formData.graduation_year}
                                     onChange={(e) => setFormData({...formData, graduation_year: e.target.value})}
                                     className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-bold appearance-none cursor-pointer"
                                  >
                                     {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                     ))}
                                  </select>
                                </div>
                             )}
                          </div>

                          {user.role === 'senior' && (
                             <div className="pt-6 border-t border-slate-100 space-y-4">
                                <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-200/60">
                                   <div className="flex items-center gap-2 mb-4">
                                      <Award className="text-purple-600" size={16} />
                                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Senior Verification Credentials</h3>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                      <div>
                                         <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Current Organization</label>
                                         <input 
                                            type="text" value={formData.company}
                                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                                            placeholder="Where do you work?"
                                            className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-semibold"
                                         />
                                      </div>
                                      <div>
                                         <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-0.5">Job Designation</label>
                                         <input 
                                            type="text" value={formData.designation}
                                            onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                            placeholder="Your role"
                                            className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl px-4 py-3 text-xs text-[#0F172A] outline-none transition-all font-semibold"
                                         />
                                      </div>
                                   </div>
                                </div>
                             </div>
                          )}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'activity' && (
                    <motion.div 
                      key="activity-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                    >
                       <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                          <div>
                             <h2 className="text-sm font-extrabold text-[#0F172A] m-0">Platform Activity Feed</h2>
                             <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1.5">Manage your platform questions, experiences, and community updates</p>
                          </div>
                       </div>
                       
                       <div className="divide-y divide-slate-100">
                          {posts.length > 0 ? posts.map(post => (
                             <div key={post.id} className="p-6 hover:bg-slate-50/50 flex items-start justify-between group transition-colors cursor-pointer">
                                <div className="flex gap-4 flex-1">
                                   <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs overflow-hidden flex-shrink-0 mt-0.5 shadow-sm">
                                      {post.users?.avatar_url ? (
                                         <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                                      ) : (
                                         post.users?.full_name?.[0] || 'U'
                                      )}
                                   </div>
                                   <div className="space-y-1.5 flex-1">
                                      <div className="flex items-center gap-2">
                                         <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                            post.type === 'doubt' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                         }`}>
                                            {post.type}
                                         </span>
                                         <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(post.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors">{post.title}</h3>
                                      
                                      {post.image_url && (
                                         <div className="mt-3 rounded-lg overflow-hidden border border-slate-150 max-w-xs shadow-sm">
                                            <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-48" />
                                         </div>
                                      )}

                                      <div className="flex items-center gap-4 pt-1">
                                         <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                            <ArrowUpCircle size={12} /> {post.upvote_count} Upvotes
                                         </div>
                                         <div className="flex items-center gap-1 text-[10px] text-[#7C3AED] font-bold">
                                            <Star size={12} /> {post.answer_count} Answers
                                         </div>
                                      </div>
                                   </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all self-center" size={16} />
                             </div>
                          )) : (
                             <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                   <MessageSquare size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-[#0F172A] mb-1">No activity yet</h3>
                                <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto mb-6">Ask questions or share platform updates with your college community to level up your professional ranking.</p>
                                <button 
                                  onClick={handleStartDiscussion}
                                  className="px-6 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors border-none"
                                >
                                  Start a Discussion
                                </button>
                             </div>
                          )}
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Right Column: Identity Card */}
            <div className="lg:col-span-4 space-y-8">
               
               {/* Verified Digital ID Card */}
               <motion.div 
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-[#0B0F19] p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden text-white"
               >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-[40px] -mr-8 -mt-8" />
                  
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-6">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                           <ShieldCheck className="text-blue-400" size={20} />
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Digital Portfolio ID</p>
                           <p className="text-xs font-extrabold text-purple-400 tracking-wider">#{user.unique_id?.split('-').pop()}</p>
                        </div>
                     </div>

                      <div className="space-y-4 mb-6">
                         <div>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Claspire Badge</p>
                            <p className="text-sm font-extrabold text-white">Standard Member</p>
                         </div>
                         {user.role === 'senior' ? (
                            <div>
                               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Graduation Year</p>
                               <p className="text-sm font-extrabold text-white">{formData.graduation_year || '2024'}</p>
                            </div>
                         ) : (
                            <div>
                               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Passout Class</p>
                               <p className="text-sm font-extrabold text-white">{formData.passout_year || '2025'}</p>
                            </div>
                         )}
                      </div>

                     <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Rise Points (RP)</p>
                           <p className="text-xl font-extrabold text-purple-400">{user.rise_points || 0}</p>
                        </div>
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                           <Sparkles className="text-purple-400" size={16} />
                        </div>
                     </div>
                  </div>
               </motion.div>

               {/* Growth Tracker */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-extrabold text-[#0F172A] mb-5 tracking-tight flex items-center gap-2">
                     <Award size={16} className="text-purple-600" /> Professional Metrics
                  </h3>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 flex-shrink-0">
                           <MessageSquare size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-slate-500 truncate">Doubts Asked</span>
                              <span className="text-xs font-bold text-[#0f172a]">{doubtCount}</span>
                           </div>
                           <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((doubtCount / Math.max(doubtCount + answerCount, 1)) * 100, 100)}%` }} />
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 flex-shrink-0">
                           <Zap size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-slate-500 truncate">Answers Shared</span>
                              <span className="text-xs font-bold text-[#0f172a]">{answerCount}</span>
                           </div>
                           <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-50 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((answerCount / Math.max(doubtCount + answerCount, 1)) * 100, 100)}%` }} />
                           </div>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100">
                        <button 
                           onClick={() => router.push(user.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior')}
                           className="w-full py-3 rounded-lg bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none"
                        >
                           Go to Dashboard <ArrowRight size={12} />
                        </button>
                     </div>
                  </div>
               </div>
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
