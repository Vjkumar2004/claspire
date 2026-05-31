'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Settings, LogOut, ShieldCheck,
  Building2, Briefcase, Sparkles, Zap, HelpCircle, Star, Handshake,
} from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'
import StudentProfileEditor from '@/components/profile/StudentProfileEditor'
import SeniorProfileEditor from '@/components/profile/SeniorProfileEditor'
import {
  parseProfileData,
  getStudentExtras,
  getSeniorExtras,
  mergeStudentExtras,
  mergeSeniorExtras,
  type UserProfileData,
  type StudentProfileExtras,
  type SeniorProfileExtras,
} from '@/lib/profile-data'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileData, setProfileData] = useState<UserProfileData>({})

  const [formData, setFormData] = useState({
    bio: '',
    branch: '',
    year: '1',
    passout_year: '2025',
    linkedin_url: '',
    company: '',
    designation: '',
    graduation_year: '2024',
  })

  const isSenior = user?.role === 'senior'
  const studentExtras = getStudentExtras(profileData)
  const seniorExtras = getSeniorExtras(profileData)
  const collegeName = user?.colleges?.name || user?.colleges?.short_name

  useEffect(() => {
    fetchUserData()
  }, [])

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
        linkedin_url: data.user.linkedin_url || '',
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

  const updateStudentExtras = (patch: Partial<StudentProfileExtras>) => {
    setProfileData((prev) => mergeStudentExtras(prev, patch))
  }

  const updateSeniorExtras = (patch: Partial<SeniorProfileExtras>) => {
    setProfileData((prev) => mergeSeniorExtras(prev, patch))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-plus-jakarta-sans text-xs">
      <aside className="fixed left-6 top-24 bottom-6 w-64 bg-white rounded-2xl border border-slate-200/80 shadow-sm hidden lg:flex flex-col p-5 z-40">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className={`w-9 h-9 rounded-lg ${avatarUrl ? 'bg-transparent' : 'bg-[#7C3AED]'} flex items-center justify-center text-white font-extrabold text-sm overflow-hidden`}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#0F172A] truncate m-0">{user.full_name}</p>
            <p className="text-[9px] font-bold text-[#7C3AED] uppercase mt-0.5">{isSenior ? 'Senior' : 'Student'}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5">
          {[
            { label: 'Dashboard', icon: LayoutDashboard, href: isSenior ? '/dashboard/senior' : '/dashboard/junior' },
            { label: 'Community', icon: Users, href: '/community' },
            { label: 'Profile', icon: Settings, href: '/profile', active: true },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer ${
                item.active ? 'bg-purple-50 text-[#7C3AED]' : 'bg-transparent text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/signout', { method: 'POST' })
            router.push('/login')
          }}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border-none bg-transparent cursor-pointer"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      <main className="lg:ml-72 pt-24 px-4 lg:px-8 max-w-5xl mx-auto pb-20">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-r from-slate-100 via-indigo-50 to-purple-50 relative border-b border-slate-200/60">
            <div className="absolute -bottom-14 left-6 md:left-10">
              <AvatarUpload
                currentUrl={avatarUrl}
                userName={user.full_name}
                size={112}
                onUploadSuccess={(url) => {
                  setAvatarUrl(url)
                  setUser({ ...user, avatar_url: url })
                }}
              />
            </div>
          </div>
          <div className="pt-16 pb-6 px-6 md:px-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-extrabold text-[#0F172A] m-0">{user.full_name}</h1>
                  {user.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 m-0">
                  {isSenior ? '💼 Professional Profile' : '🎓 Student Profile'} · {collegeName}
                </p>
                {isSenior && user.company && (
                  <p className="text-xs text-slate-500 mt-1 m-0 flex items-center gap-1">
                    <Briefcase size={13} className="text-blue-500" /> {user.designation} @ {user.company}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/u/${user.unique_id}`)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  View Public Profile
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 text-xs font-bold border border-green-100">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {isSenior ? (
              <SeniorProfileEditor
                formData={{
                  bio: formData.bio,
                  company: formData.company,
                  designation: formData.designation,
                  graduation_year: formData.graduation_year,
                  linkedin_url: formData.linkedin_url,
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
                  linkedin_url: formData.linkedin_url,
                }}
                extras={studentExtras}
                onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                onExtrasChange={updateStudentExtras}
                collegeName={collegeName}
              />
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B0F19] p-6 rounded-2xl border border-slate-800 text-white">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Community Stats</p>
              <p className="text-2xl font-extrabold text-purple-400 mb-4">{user.rise_points || 0} RP</p>
              {isSenior ? (
                <div className="space-y-3">
                  <StatRow icon={<Users size={14} />} label="Juniors Mentored" value={user.webinar_count || 0} />
                  <StatRow icon={<Star size={14} />} label="Answers Shared" value={user.answer_count || 0} />
                  <StatRow icon={<Handshake size={14} />} label="Referrals Given" value={user.referral_count || 0} />
                </div>
              ) : (
                <div className="space-y-3">
                  <StatRow icon={<HelpCircle size={14} />} label="Questions Asked" value={user.doubt_count || 0} />
                  <StatRow icon={<Star size={14} />} label="Answers Received" value={user.answer_count || 0} />
                  <StatRow icon={<Zap size={14} />} label="Rise Points" value={user.rise_points || 0} />
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs font-extrabold text-[#0F172A] mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-600" /> Claspire ID
              </h3>
              <p className="text-sm font-black text-purple-600 font-mono">{user.unique_id}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                Share your public profile: /u/{user.unique_id}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-white/70 font-semibold">{icon} {label}</span>
      <span className="font-extrabold text-white">{value}</span>
    </div>
  )
}
