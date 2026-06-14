'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Network, Bookmark, Settings, LogOut,
  ShieldCheck, MapPin, GraduationCap, Copy, Check, ExternalLink,
  BarChart3, Eye, Trophy, Target, Medal, BookOpen,
  Menu, X, Sparkles, HelpCircle, Star, Zap,
  Award, UserPlus, Circle, CheckCircle,
  Briefcase, Clock, Share2, Plus, FileText, Camera, Linkedin, Github, Globe, Loader2,
} from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'
import { showToast } from '@/components/Toast'
import StudentProfileEditor from '@/components/profile/StudentProfileEditor'
import SeniorProfileEditor from '@/components/profile/SeniorProfileEditor'
import {
  parseProfileData,
  getStudentExtras,
  getSeniorExtras,
  mergeStudentExtras,
  mergeSeniorExtras,
  type UserProfileData,
} from '@/lib/profile-data'

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.src = url
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.naturalWidth
      let h = img.naturalHeight
      const MAX_W = 1920
      const MAX_H = 1080
      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const tryQuality = (q: number): Promise<Blob> =>
        new Promise(r => canvas.toBlob(b => r(b!), 'image/jpeg', q))
      tryQuality(0.8).then(async blob => {
        let quality = 0.8
        let finalBlob = blob
        while (finalBlob.size > 2 * 1024 * 1024 && quality > 0.1) {
          quality = Math.round((quality - 0.1) * 10) / 10
          finalBlob = await tryQuality(quality)
        }
        const fileName = file.name.replace(/\.[^.]+$/, '.jpg') || 'banner.jpg'
        resolve(new File([finalBlob], fileName, { type: 'image/jpeg' }))
      }).catch(reject)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileData, setProfileData] = useState<UserProfileData>({})
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerError, setBannerError] = useState('')

  const [copied, setCopied] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [statsLoaded, setStatsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    bio: '',
    branch: '',
    year: '1',
    passout_year: '2025',
    company: '',
    designation: '',
    graduation_year: '2024',
  })

  const isSenior = user?.role === 'senior'
  const studentExtras = getStudentExtras(profileData)
  const seniorExtras = getSeniorExtras(profileData)
  const collegeName = user?.colleges?.name || user?.colleges?.short_name || ''
  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const hasBanner = !!user?.banner_url
  const socialLinks = (isSenior ? seniorExtras.social_links : studentExtras.social_links) || {}
  const bannerFileRef = useRef<HTMLInputElement>(null)

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setBannerError('')
    setBannerUploading(true)

    if (!file.type.startsWith('image/')) {
      setBannerError('Invalid file type. Please upload an image')
      setBannerUploading(false)
      return
    }

    let uploadFile = file
    if (file.size > 2 * 1024 * 1024) {
      try {
        uploadFile = await compressImage(file)
      } catch {
        setBannerError('Failed to compress image')
        setBannerUploading(false)
        return
      }
      if (uploadFile.size > 2 * 1024 * 1024) {
        setBannerError('Image too large. Please upload an image under 2MB')
        showToast({ type: 'error', title: 'Image too large', message: 'Please upload an image under 2MB' })
        setBannerUploading(false)
        return
      }
    }

    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('type', 'banner')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setBannerError(data.error || 'Upload failed')
      } else if (data.url) {
        setUser({ ...user, banner_url: data.url })
      }
    } catch {
      setBannerError('Upload failed. Try again.')
    } finally {
      setBannerUploading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user?.id && !statsLoaded) {
      fetch(`/api/profile/${user.id}/stats`)
        .then(r => r.json())
        .then(d => { setViewCount(d.viewCount || 0); setStatsLoaded(true) })
        .catch(() => setStatsLoaded(true))
    }
  }, [user?.id, statsLoaded])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      const data = await res.json()
      if (!data.user) {
        router.push('/login')
        return
      }
      setUser(data.user)
      setProfileData(parseProfileData(data.user.profile_data))
      setFormData({
        bio: data.user.bio || '',
        branch: data.user.branch || '',
        year: data.user.year?.toString() || '1',
        passout_year: data.user.passout_year?.toString() || '2025',
        company: data.user.company || '',
        designation: data.user.designation || '',
        graduation_year: data.user.graduation_year?.toString() || '2024',
      })
      setAvatarUrl(data.user.avatar_url || '')
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const nextProfileData = isSenior
      ? mergeSeniorExtras(profileData, seniorExtras)
      : mergeStudentExtras(profileData, studentExtras)

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
          passout_year: parseInt(formData.passout_year),
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          profile_data: nextProfileData,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Profile saved successfully!')
        setUser(data.user)
        setProfileData(parseProfileData(data.user.profile_data))
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSaving(false)
    }
  }

  const updateStudentExtras = (patch: Partial<any>) => {
    setProfileData((prev) => mergeStudentExtras(prev, patch))
  }

  const updateSeniorExtras = (patch: Partial<any>) => {
    setProfileData((prev) => mergeSeniorExtras(prev, patch))
  }

  const copyClaspireId = () => {
    navigator.clipboard.writeText(user?.unique_id || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const calcProfileCompletion = () => {
    let total = 0
    let done = 0
    if (formData.bio) { total++; done++ } else total++
    if (studentExtras.skills?.length > 0 || seniorExtras.skills?.length > 0) { total++; done++ } else total++
    if (studentExtras.projects?.length > 0 || seniorExtras.projects?.length > 0) { total++; done++ } else total++
    if (studentExtras.resume_url || seniorExtras.resume_url) { total++; done++ } else total++
    const lookingFor = Object.values(studentExtras.areas_looking_for || {}).some(v => v)
    const mentorship = Object.values(seniorExtras.mentorship || {}).some(v => v)
    if (lookingFor || mentorship) { total++; done++ } else total++
    return Math.round((done / total) * 100)
  }

  const completion = calcProfileCompletion()
  const completionRadius = 42
  const completionCircumference = 2 * Math.PI * completionRadius
  const completionOffset = completionCircumference - (completion / 100) * completionCircumference

  const [activeSection, setActiveSection] = useState('about-me')

  const sectionLinks = isSenior
    ? [
        { label: 'About Me', icon: BookOpen, id: 'about-me' },
        { label: 'Professional Info', icon: Briefcase, id: 'professional-info' },
        { label: 'Skills', icon: Zap, id: 'skills' },
        { label: 'Projects', icon: ExternalLink, id: 'projects' },
        { label: 'Certifications', icon: Award, id: 'certifications' },
        { label: 'Links', icon: ExternalLink, id: 'links' },
        { label: 'Resume', icon: FileText, id: 'resume' },
        { label: 'Mentorship', icon: Target, id: 'mentorship' },
      ]
    : [
        { label: 'About Me', icon: BookOpen, id: 'about-me' },
        { label: 'Academic Info', icon: GraduationCap, id: 'academic-info' },
        { label: 'Skills', icon: Zap, id: 'skills' },
        { label: 'Projects', icon: ExternalLink, id: 'projects' },
        { label: 'Certifications', icon: Award, id: 'certifications' },
        { label: 'Links & Resume', icon: Share2, id: 'links-resume' },
        { label: 'Looking For', icon: Target, id: 'looking-for' },
      ]

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-3 border-[#A78BFA] border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s', opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-plus-jakarta-sans">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="fixed left-0 top-16 bottom-0 w-[260px] bg-white border-r border-slate-200/80 shadow-sm hidden lg:flex flex-col z-50">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${avatarUrl ? 'bg-transparent' : 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]'} flex items-center justify-center text-white font-extrabold text-sm overflow-hidden shadow-md`}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0F172A] truncate leading-tight">{user.full_name}</p>
              <p className="text-[10px] font-semibold text-[#7C3AED] uppercase tracking-wider mt-0.5">{isSenior ? 'Senior' : 'Student'}</p>
            </div>
          </div>
        </div>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-2 pb-1">On this page</p>
        <nav className="flex-1 py-1 px-3 space-y-0.5">
          {sectionLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className={`sidebar-nav-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer ${
                activeSection === item.id
                  ? 'active bg-[#F5F3FF] text-[#7C3AED]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={16} className={activeSection === item.id ? 'text-[#7C3AED]' : 'text-slate-400'} />
              <span>{item.label}</span>
              {activeSection === item.id && (
                <span className="ml-auto w-1.5 h-5 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#6D28D9]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/signout', { method: 'POST' })
              sessionStorage.clear()
              localStorage.removeItem('claspire_user')
              localStorage.removeItem('claspire_recent_searches')
              router.push('/login')
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ===== MOBILE HEADER ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-lg border-b border-slate-100 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${avatarUrl ? '' : 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]'} flex items-center justify-center text-white font-bold text-[10px] overflow-hidden shadow-sm`}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <span className="text-sm font-bold text-[#0F172A]">Edit Profile</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#6D28D9] transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="lg:ml-[260px] pt-14 lg:pt-0">

        {/* ===== MOBILE HERO ===== */}
      <div className="lg:hidden">
        {/* Banner */}
        <div className="relative h-28">
          <div
            className="absolute inset-0 bg-contain bg-center bg-slate-100"
            style={{
              backgroundImage: user.banner_url
                ? 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.25)), url(' + user.banner_url + ')'
                : 'linear-gradient(160deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)'
            }}
          />
          {bannerUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 backdrop-blur-sm">
              <Loader2 size={28} color="white" className="animate-spin" />
            </div>
          )}
          {bannerError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] text-red-600 font-bold whitespace-nowrap shadow-sm">
              ⚠️ {bannerError}
            </div>
          )}
          {/* Edit Banner button */}
          <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          <button
            type="button"
            onClick={() => bannerFileRef.current?.click()}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-all"
            title="Edit Banner"
          >
            <Camera size={13} />
          </button>
        </div>

        {/* Avatar — overlaps banner bottom */}
        <div className="relative z-10 flex justify-center -mt-12 mb-3">
          <AvatarUpload
            currentUrl={avatarUrl}
            userName={user.full_name}
            size={96}
            onUploadSuccess={(url) => {
              setAvatarUrl(url)
              setUser({ ...user, avatar_url: url })
            }}
          />
        </div>

        {/* Profile info */}
        <div className="px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <h1 className="text-2xl font-bold text-[#0F172A] m-0 tracking-tight">{user.full_name}</h1>
            {user.is_verified && (
              <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" fill="#10B981" fillOpacity="0.2" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-500 m-0">
            {isSenior
              ? `${user.designation || 'Professional'}${user.company ? ` at ${user.company}` : ''}`
              : `${user.branch || 'Student'}${user.passout_year ? ` · Class of ${user.passout_year}` : ''}`
            }
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-1">
            {collegeName && (
              <span className="flex items-center gap-1"><GraduationCap size={12} /> {collegeName}</span>
            )}
            {isSenior && user.graduation_year && (
              <span className="flex items-center gap-1"><Clock size={12} /> Grad {user.graduation_year}</span>
            )}
          </div>

          {/* Social icons row */}
          <div className="flex items-center justify-center gap-2.5 mt-3">
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all">
                <Linkedin size={15} />
              </a>
            )}
            {socialLinks.github && (
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all">
                <Github size={15} />
              </a>
            )}
            {socialLinks.portfolio && (
              <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all">
                <Globe size={15} />
              </a>
            )}
            {socialLinks.website && !socialLinks.portfolio && (
              <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all">
                <Globe size={15} />
              </a>
            )}
          </div>

          {/* Action buttons — 2-col grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#7C3AED] text-white text-sm font-bold hover:bg-[#6D28D9] transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              <Sparkles size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/u/${user.unique_id}`)}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink size={15} />
              View Profile
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP HERO ===== */}
      <div className="hidden lg:block">
        <section className="relative">
          <div className="relative h-[280px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: user.banner_url
                  ? 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.35)), url(' + user.banner_url + ')'
                  : 'linear-gradient(160deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)'
              }}
            />
            {bannerUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 backdrop-blur-sm">
                <Loader2 size={28} color="white" className="animate-spin" />
              </div>
            )}
            {bannerError && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] text-red-600 font-bold whitespace-nowrap shadow-sm">
                ⚠️ {bannerError}
              </div>
            )}
            <div className="absolute inset-0 z-10">
              <div className="h-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10">
                <div className="h-full flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <AvatarUpload
                      currentUrl={avatarUrl}
                      userName={user.full_name}
                      size={120}
                      onUploadSuccess={(url) => {
                        setAvatarUrl(url)
                        setUser({ ...user, avatar_url: url })
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-4xl font-bold text-white m-0 tracking-tight leading-tight">{user.full_name}</h1>
                      {user.is_verified && (
                        <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0" fill="#10B981" fillOpacity="0.25" />
                      )}
                    </div>
                    <p className="text-lg font-semibold text-white/80 m-0 leading-snug">
                      {isSenior
                        ? `${user.designation || 'Professional'}${user.company ? ` at ${user.company}` : ''}`
                        : `${user.branch || 'Student'}${user.passout_year ? ` · Class of ${user.passout_year}` : ''}`
                      }
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-white/60 mt-0.5">
                      {collegeName && (
                        <span className="flex items-center gap-1.5"><GraduationCap size={13} className="text-white/40" /> {collegeName}</span>
                      )}
                      {isSenior && user.graduation_year && (
                        <span className="flex items-center gap-1.5"><Clock size={13} className="text-white/40" /> Grad {user.graduation_year}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white text-[#0F172A] text-xs font-bold hover:bg-slate-100 transition-all disabled:opacity-50 shadow-lg cursor-pointer"
                      >
                        <Sparkles size={14} />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/u/${user.unique_id}`)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        View Public Profile
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                    <button
                      type="button"
                      onClick={() => bannerFileRef.current?.click()}
                      className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg cursor-pointer"
                      title="Edit Banner"
                    >
                      <Camera size={15} />
                    </button>
                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg"><Linkedin size={15} /></a>
                    )}
                    {socialLinks.github && (
                      <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg"><Github size={15} /></a>
                    )}
                    {socialLinks.portfolio && (
                      <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg"><Globe size={15} /></a>
                    )}
                    {socialLinks.website && !socialLinks.portfolio && (
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg"><Globe size={15} /></a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

        {/* ===== MOBILE STATS (2x3 grid) ===== */}
        <div className="lg:hidden px-4 mt-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Trophy size={14} />, value: user.rise_points || 0, label: 'RP', color: 'from-amber-500 to-orange-600' },
              { icon: <HelpCircle size={14} />, value: user.doubt_count || 0, label: 'Q', color: 'from-blue-500 to-indigo-600' },
              { icon: <Star size={14} />, value: user.answer_count || 0, label: 'A', color: 'from-emerald-500 to-teal-600' },
              { icon: <Eye size={14} />, value: viewCount, label: 'PV', color: 'from-violet-500 to-purple-600' },
              { icon: <UserPlus size={14} />, value: 0, label: 'C', color: 'from-pink-500 to-rose-600' },
              { icon: <Target size={14} />, value: user.rp_level ? `Lv.${user.rp_level}` : '--', label: 'LV', color: 'from-cyan-500 to-blue-600' },
            ].map((stat, i) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-1.5 shadow-sm`}>
                  {stat.icon}
                </div>
                <p className="text-base font-extrabold text-[#0F172A] m-0 leading-tight">{stat.value}</p>
                <p className="text-[9px] font-semibold text-slate-400 m-0">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== MOBILE STICKY TABS ===== */}
        <div className="lg:hidden sticky top-14 z-30 bg-[#F3F4F6] border-b border-slate-100 mt-4">
          <div className="flex overflow-x-auto gap-1 px-4 py-2 scrollbar-hide">
            {sectionLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  scrollToSection(item.id)
                  const el = document.getElementById(item.id)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border-none cursor-pointer transition-all ${
                  activeSection === item.id
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== DESKTOP STATS ===== */}
        <div className="hidden lg:block max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 mt-6">
          <div className="grid grid-cols-6 gap-3">
            {[
              { icon: <Trophy size={15} />, value: user.rise_points || 0, label: 'Rise Points', color: 'from-amber-500 to-orange-600' },
              { icon: <HelpCircle size={15} />, value: user.doubt_count || 0, label: 'Questions', color: 'from-blue-500 to-indigo-600' },
              { icon: <Star size={15} />, value: user.answer_count || 0, label: 'Answers', color: 'from-emerald-500 to-teal-600' },
              { icon: <Eye size={15} />, value: viewCount, label: 'Profile Views', color: 'from-violet-500 to-purple-600' },
              { icon: <UserPlus size={15} />, value: 0, label: 'Connections', color: 'from-pink-500 to-rose-600' },
              { icon: <Target size={15} />, value: user.rp_level ? `Lv.${user.rp_level}` : '--', label: 'Level', color: 'from-cyan-500 to-blue-600' },
            ].map((stat, i) => (
              <div key={stat.label} className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3 shadow-sm`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-extrabold text-[#0F172A] m-0 leading-tight">{stat.value}</p>
                <p className="text-[11px] font-semibold text-slate-400 m-0 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== MESSAGES ===== */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-10 mt-6">
          {error && (
            <div className="mb-4 p-4 rounded-3xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={14} className="text-red-500" />
              </div>
              <p className="text-xs font-bold m-0">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check size={14} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold m-0">{success}</p>
            </div>
          )}
        </section>

        {/* ===== CONTENT GRID ===== */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-10 mt-4 lg:mt-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">

            {/* ===== LEFT COLUMN (70%) ===== */}
            <div className="lg:col-span-8 space-y-4 lg:space-y-6">
              {isSenior ? (
                  <SeniorProfileEditor
                    formData={{
                      bio: formData.bio,
                      company: formData.company,
                      designation: formData.designation,
                      graduation_year: formData.graduation_year,
                    }}
                  extras={seniorExtras}
                  onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                  onExtrasChange={updateSeniorExtras}
                  collegeName={collegeName}
                />
              ) : (
                  <StudentProfileEditor
                    formData={{
                      bio: formData.bio,
                      branch: formData.branch,
                      year: formData.year,
                      passout_year: formData.passout_year,
                    }}
                  extras={studentExtras}
                  onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                  onExtrasChange={updateStudentExtras}
                  collegeName={collegeName}
                />
              )}
            </div>

            {/* ===== RIGHT SIDEBAR (30%) — hidden on mobile ===== */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">

              {/* CARD 1: Community Stats */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F19] to-[#1A103D] p-6 border border-slate-800/50">
                <div className="absolute inset-0 hero-dot-pattern opacity-20" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={14} className="text-purple-400" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Community Stats</p>
                  </div>
                  <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200 mb-2">{user.rise_points || 0}</p>
                  <p className="text-[10px] font-semibold text-white/30 -mt-1 mb-4">Rise Points Earned</p>

                  <div className="space-y-3.5">
                    {[
                      { icon: <HelpCircle size={13} />, label: 'Questions', value: user.doubt_count || 0 },
                      { icon: <Star size={13} />, label: 'Answers Received', value: user.answer_count || 0 },
                      { icon: <Trophy size={13} />, label: 'Referrals', value: user.referral_count || 0 },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs text-white/60 font-medium">
                          {stat.icon} {stat.label}
                        </span>
                        <span className="text-sm font-extrabold text-white">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-white/40">Level Progress</span>
                      <span className="text-[10px] font-bold text-purple-400">Lv.{user.rp_level || 1}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-300"
                        style={{ width: `${Math.min((user.rise_points || 0) % 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Claspire ID */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 size={14} className="text-purple-600" />
                  <h3 className="text-xs font-extrabold text-[#0F172A] m-0">Claspire ID</h3>
                </div>
                <p className="text-lg font-black text-purple-600 font-mono tracking-wider m-0">{user.unique_id}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Share your public profile link
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-xs font-mono text-slate-500 truncate">
                    /u/{user.unique_id}
                  </div>
                  <button
                    type="button"
                    onClick={copyClaspireId}
                    className="p-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* CARD 3: Recent Badges */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={14} className="text-amber-500" />
                  <h3 className="text-xs font-extrabold text-[#0F172A] m-0">Achievements</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { emoji: '🏆', label: 'Top Contributor', color: 'from-amber-50 to-amber-100/50', textColor: 'text-amber-700', earned: user.doubt_count >= 5 },
                    { emoji: '⭐', label: 'Rise Star', color: 'from-purple-50 to-purple-100/50', textColor: 'text-purple-700', earned: (user.rise_points || 0) >= 100 },
                    { emoji: '🎓', label: 'Scholar', color: 'from-blue-50 to-blue-100/50', textColor: 'text-blue-700', earned: true },
                    { emoji: '🤝', label: 'Connector', color: 'from-emerald-50 to-emerald-100/50', textColor: 'text-emerald-700', earned: false },
                    { emoji: '💡', label: 'Innovator', color: 'from-cyan-50 to-cyan-100/50', textColor: 'text-cyan-700', earned: false },
                    { emoji: '🚀', label: 'Early Adopter', color: 'from-rose-50 to-rose-100/50', textColor: 'text-rose-700', earned: true },
                  ].map((badge) => (
                    <div
                      key={badge.label}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${badge.color} border ${badge.earned ? 'border-slate-200' : 'border-slate-100 opacity-40'}`}
                    >
                      <span className="text-lg">{badge.emoji}</span>
                      <span className={`text-[9px] font-bold ${badge.textColor} text-center leading-tight`}>{badge.label}</span>
                      {badge.earned && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 4: Profile Completion */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-purple-600" />
                    <h3 className="text-xs font-extrabold text-[#0F172A] m-0">Profile Completion</h3>
                  </div>
                  <span className="text-lg font-extrabold text-[#7C3AED]">{completion}%</span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
                      <circle cx="48" cy="48" r={completionRadius} fill="none" stroke="#F1F5F9" strokeWidth="6" />
                      <circle
                        cx="48" cy="48" r={completionRadius}
                        fill="none"
                        stroke="url(#completionGrad)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={completionCircumference}
                        strokeDashoffset={completionOffset}
                        className="profile-completion-ring"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                      <defs>
                        <linearGradient id="completionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7C3AED" />
                          <stop offset="100%" stopColor="#A78BFA" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-extrabold text-[#7C3AED]">{completion}%</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {[
                      { label: 'About Me', done: !!formData.bio },
                      { label: 'Skills', done: (studentExtras.skills?.length > 0 || seniorExtras.skills?.length > 0) },
                      { label: 'Projects', done: (studentExtras.projects?.length > 0 || seniorExtras.projects?.length > 0) },
                      { label: 'Resume', done: !!(studentExtras.resume_url || seniorExtras.resume_url) },
                      { label: 'Looking For', done: Object.values(studentExtras.areas_looking_for || {}).some(v => v) || Object.values(seniorExtras.mentorship || {}).some(v => v) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        {item.done
                          ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                          : <Circle size={13} className="text-slate-300 flex-shrink-0" />
                        }
                        <span className={`text-[11px] font-semibold ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
