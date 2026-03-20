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
import Navbar from '@/components/Navbar'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchUserData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Check if user is returning from community page after creating a post
  useEffect(() => {
    const checkForNewPost = () => {
      // Check URL parameters or localStorage to see if we need to refresh
      const urlParams = new URLSearchParams(window.location.search)
      const refreshNeeded = urlParams.get('refresh') === 'true' || 
                           localStorage.getItem('profile_refresh_needed') === 'true'
      
      if (refreshNeeded && !loading) {
        fetchUserData()
        // Clean up the flag
        localStorage.removeItem('profile_refresh_needed')
        // Clean URL
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
      // Use the first joined community
      const community = joinedCommunities[0].communities
      router.push(`/community/c/${community.slug}?create=true`)
    } else {
      // If no joined communities, redirect to main community page
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
           <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 bg-purple-500/20 rounded-full animate-pulse" />
              </div>
           </div>
           <p className="text-white font-black font-instrument-serif text-xl tracking-wide animate-pulse uppercase">Syncing Profile...</p>
        </motion.div>
      </div>
    )
  }

  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const collegeName = user.colleges?.short_name || 'Claspire Student'

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: user.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior' },
    { id: 'community', label: 'Community', icon: <Users size={20} />, href: '/community' },
    { id: 'profile', label: 'Settings', icon: <Settings size={20} />, active: true },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-6 top-24 bottom-6 w-72 bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm hidden lg:flex flex-col p-6 z-40">
        <div className="flex items-center gap-3 px-4 mb-10">
          <div className={`w-10 h-10 rounded-xl ${avatarUrl ? 'bg-transparent' : 'bg-purple-600'} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-200 overflow-hidden`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-sm font-black text-[#0F172A] m-0">{user.full_name}</p>
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-0.5">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
           {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => item.href && router.push(item.href)}
                className={`w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl text-sm font-bold transition-all group cursor-pointer ${
                  item.active 
                    ? 'bg-[#F5F3FF] text-[#7C3AED] shadow-sm shadow-purple-500/5' 
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <div className={`transition-transform group-hover:scale-110 ${item.active ? 'text-[#7C3AED]' : 'text-gray-400 group-hover:text-[#0F172A]'}`}>
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
          className="mt-auto w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group cursor-pointer border-none bg-transparent"
        >
           <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
           Sign Out
        </button>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="lg:ml-[320px] pt-24 px-4 lg:px-8 max-w-7xl mx-auto pb-20">
         
         {/* ── Profile Cover & Header ── */}
         <div className="bg-white rounded-[40px] border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
            {/* Cover Area */}
            <div className="h-48 md:h-64 bg-gradient-to-br from-[#7C3AED] via-[#4F46E5] to-[#06B6D4] relative">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
               <div className="absolute -bottom-16 left-8 md:left-12">
                  <AvatarUpload
                    currentUrl={avatarUrl}
                    userName={user?.full_name || ''}
                    size={144}
                    onUploadSuccess={(url) => {
                      setAvatarUrl(url)
                      setUser({ ...user, avatar_url: url })
                    }}
                  />
               </div>
            </div>

            {/* Header Content */}
            <div className="pt-20 pb-8 px-8 md:px-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-black text-[#0F172A] m-0 font-instrument-serif">{user.full_name}</h1>
                        {user.is_verified && <ShieldCheck size={24} className="text-blue-500" fill="currentColor" fillOpacity={0.1} />}
                     </div>
                     <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#64748B]">
                        <span className="flex items-center gap-1.5"><Building2 size={16} className="text-purple-600" /> {collegeName}</span>
                         {user.role === 'senior' && user.company ? (
                            <>
                               <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block" />
                               <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-blue-600" /> {user.designation} at {user.company}</span>
                               <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block" />
                            </>
                         ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block" />
                         )}
                        <span className="flex items-center gap-1.5 uppercase tracking-widest text-[11px] font-black text-purple-600">{user.unique_id}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                        onClick={() => router.push(`/u/${user.unique_id}`)}
                        className="px-6 py-3 rounded-2xl bg-white border border-[#E2E8F0] text-sm font-bold text-[#0F172A] hover:bg-gray-50 transition-colors cursor-pointer"
                     >
                        View Public Profile
                     </button>
                     <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-2xl bg-[#0F172A] text-white text-sm font-bold hover:bg-black transition-all cursor-pointer disabled:opacity-50 shadow-xl shadow-gray-200">
                        {saving ? 'Saving...' : 'Save Updates'}
                     </button>
                  </div>
               </div>

               {/* Tabs Navigation */}
               <div className="flex items-center gap-8 mt-12 border-b border-[#F1F5F9]">
                  {[
                    { id: 'info', label: 'Account Info', icon: <User size={16} /> },
                    { id: 'professional', label: 'Professional', icon: <Briefcase size={16} /> },
                    { id: 'activity', label: 'Post Activity', icon: <MessageSquare size={16} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-4 text-sm font-black flex items-center gap-2 transition-all relative border-none bg-transparent cursor-pointer ${
                        activeTab === tab.id ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#475569]'
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-[32px] border border-[#E2E8F0] p-8 shadow-sm"
                    >
                       <h2 className="text-xl font-black text-[#0F172A] font-instrument-serif mb-8 flex items-center gap-3">
                          <Zap size={20} className="text-purple-600" /> General Information
                       </h2>
                       <div className="space-y-6">
                          <div>
                             <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Your Bio / One-liner</label>
                             <textarea 
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value.slice(0, 200)})}
                                placeholder="Write a short intro about yourself..."
                                className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all h-28 resize-none font-medium"
                             />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="group">
                                <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
                                <div className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#94A3B8] flex items-center justify-between font-bold">
                                   {user.email} <Lock size={14} className="opacity-40" />
                                </div>
                             </div>

                             <div>
                                <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">LinkedIn Profile</label>
                                <div className="relative">
                                   <input 
                                      type="text" value={formData.linkedin_url}
                                      onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                                      placeholder="https://linkedin.com/in/..."
                                      className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 pl-12 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all font-bold"
                                   />
                                   <Linkedin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-600" />
                                </div>
                             </div>

                             {user.role !== 'senior' && (
                               <div>
                                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Academic Year</label>
                                  <select 
                                     value={formData.year}
                                     onChange={(e) => setFormData({...formData, year: e.target.value})}
                                     className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all font-bold appearance-none cursor-pointer"
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
                                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Academic CGPA</label>
                                  <input 
                                     type="number" step="0.01" max="10"
                                     value={formData.cgpa}
                                     onChange={(e) => setFormData({...formData, cgpa: e.target.value})}
                                     placeholder="Current CGPA"
                                     className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all font-bold"
                                  />
                               </div>
                             )}
                          </div>
                          
                          {error && (
                             <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100">
                                ⚠️ {error}
                             </div>
                          )}
                          {success && (
                             <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-xs font-bold border border-green-100">
                                ✨ {success}
                             </div>
                          )}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'professional' && (
                    <motion.div 
                      key="pro-tab"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-[32px] border border-[#E2E8F0] p-8 shadow-sm"
                    >
                       <h2 className="text-xl font-black text-[#0F172A] font-instrument-serif mb-8 flex items-center gap-3">
                          <Building2 size={20} className="text-blue-500" /> Career & Education
                       </h2>
                       
                       <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Academic Branch</label>
                                <input 
                                   type="text" value={formData.branch}
                                   onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                   placeholder="e.g. Computer Science"
                                   className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all font-bold"
                                />
                             </div>

                             {user.role !== 'senior' && (
                               <div>
                                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Passout Year</label>
                                  <select 
                                     value={formData.passout_year}
                                     onChange={(e) => setFormData({...formData, passout_year: e.target.value})}
                                     className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all font-bold appearance-none cursor-pointer"
                                  >
                                     {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                     ))}
                                  </select>
                               </div>
                             )}

                             {user.role === 'senior' && (
                               <div>
                                  <label className="block text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2 px-1">Graduation Year</label>
                                  <select 
                                     value={formData.graduation_year}
                                     onChange={(e) => setFormData({...formData, graduation_year: e.target.value})}
                                     className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:bg-white focus:border-purple-600 transition-all font-bold appearance-none cursor-pointer"
                                  >
                                     {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                     ))}
                                  </select>
                               </div>
                             )}
                          </div>

                          {user.role === 'senior' && (
                             <div className="pt-8 border-t border-[#F1F5F9] space-y-6">
                                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                                   <div className="flex items-center gap-2 mb-4">
                                      <Award className="text-purple-600" size={18} />
                                      <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">Senior Verification Info</h3>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                         <label className="block text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-2 px-1">Current Organization</label>
                                         <input 
                                            type="text" value={formData.company}
                                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                                            placeholder="Where do you work?"
                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:border-purple-600 transition-all font-bold"
                                         />
                                      </div>
                                      <div>
                                         <label className="block text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-2 px-1">Job Designation</label>
                                         <input 
                                            type="text" value={formData.designation}
                                            onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                            placeholder="Your role"
                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-sm text-[#0F172A] outline-none focus:border-purple-600 transition-all font-bold"
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm overflow-hidden"
                    >
                       <div className="p-8 border-b border-[#F1F5F9]">
                          <h2 className="text-xl font-black text-[#0F172A] font-instrument-serif m-0">Platform Contributions</h2>
                          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-2">Manage your doubts and community posts</p>
                       </div>
                       
                       <div className="divide-y divide-[#F1F5F9]">
                          {posts.length > 0 ? posts.map(post => (
                             <div key={post.id} className="p-8 hover:bg-gray-50 flex items-start justify-between group transition-colors cursor-pointer">
                                <div className="flex gap-4 flex-1">
                                   <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs overflow-hidden flex-shrink-0 mt-1 shadow-sm">
                                      {post.users?.avatar_url ? (
                                         <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                                      ) : (
                                         post.users?.full_name?.[0] || 'U'
                                      )}
                                   </div>
                                   <div className="space-y-2 flex-1">
                                      <div className="flex items-center gap-3">
                                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                            post.type === 'doubt' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                         }`}>
                                            {post.type}
                                         </span>
                                         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <h3 className="text-md font-bold text-[#0F172A] group-hover:text-purple-600 transition-colors">{post.title}</h3>
                                      
                                      {post.image_url && (
                                         <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 max-w-sm shadow-sm group-hover:shadow-md transition-shadow">
                                            <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-72" />
                                         </div>
                                      )}

                                      <div className="flex items-center gap-6">
                                         <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                                            <ArrowUpCircle size={14} /> {post.upvote_count} Upvotes
                                         </div>
                                         <div className="flex items-center gap-1.5 text-xs text-purple-600 font-bold">
                                            <Star size={14} /> {post.answer_count} Answers
                                         </div>
                                      </div>
                                   </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" size={20} />
                             </div>
                          )) : (
                             <div className="p-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                   <MessageSquare size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-[#0F172A] mb-2">No activity yet</h3>
                                <p className="text-sm text-[#64748B] font-medium max-w-xs mx-auto">Start asking doubts or sharing knowledge with your community to build your profile.</p>
                                <button 
                                  onClick={handleStartDiscussion}
                                  className="mt-8 px-8 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm shadow-xl shadow-purple-100 cursor-pointer hover:bg-purple-700 transition-colors"
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
               
               {/* Digital ID Card */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="bg-[#0F172A] p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-white"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-[60px] -mr-16 -mt-16" />
                  
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-10">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                           <ShieldCheck className="text-blue-400" size={24} />
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Verified Student ID</p>
                           <p className="text-sm font-black text-purple-400 tracking-wider">#{user.unique_id?.split('-').pop()}</p>
                        </div>
                     </div>

                      <div className="space-y-6 mb-10">
                         <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Claspire Badge</p>
                            <p className="text-lg font-bold">Standard Member</p>
                         </div>
                         {user.role === 'senior' ? (
                            <div>
                               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Graduation Year</p>
                               <p className="text-lg font-bold">{formData.graduation_year || '2024'}</p>
                            </div>
                         ) : (
                            <div>
                               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Passout Class</p>
                               <p className="text-lg font-bold">{formData.passout_year || '2025'}</p>
                            </div>
                         )}
                      </div>

                     <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Rise Points (RP)</p>
                           <p className="text-2xl font-black text-purple-400">{user.rise_points || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                           <Sparkles className="text-[#0F172A]" size={24} />
                        </div>
                     </div>
                  </div>
               </motion.div>

               {/* Growth Tracker */}
               <div className="bg-white p-8 rounded-[40px] border border-[#E2E8F0] shadow-sm">
                  <h3 className="text-lg font-black text-[#0F172A] font-instrument-serif mb-6">Growth Activity</h3>
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                           <MessageSquare size={20} />
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-[#64748B]">Doubts Asked</span>
                              <span className="text-xs font-black text-[#0F172A]">{doubtCount}</span>
                           </div>
                           <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((doubtCount / Math.max(doubtCount + answerCount, 1)) * 100, 100)}%` }} />
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                           <Zap size={20} />
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-[#64748B]">Answers Shared</span>
                              <span className="text-xs font-black text-[#0F172A]">{answerCount}</span>
                           </div>
                           <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((answerCount / Math.max(doubtCount + answerCount, 1)) * 100, 100)}%` }} />
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-[#F1F5F9]">
                        <button 
                           onClick={() => router.push(user.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior')}
                           className="w-full py-4 rounded-2xl bg-[#0F172A] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                           Go to Dashboard <ArrowRight size={14} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  )
}
