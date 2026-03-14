'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePoints } from '@/contexts/PointsContext';
import { useRouter } from 'next/navigation';
import { HelpCircle, Briefcase, Handshake, Mic, DollarSign, BarChart3, Star, Trophy, User, CheckCircle, Settings, Zap, TrendingUp } from 'lucide-react';
import NotificationPrompt from '@/components/NotificationPrompt';

// Helper functions
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

export default function SeniorDashboardPage() {
  const router = useRouter();
  // Move ALL useState hooks to the top - Rules of Hooks compliance
  const { showAward } = usePoints();
  const [activeNav, setActiveNav] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [jobFormLoading, setJobFormLoading] = useState(false)
  const [jobFormData, setJobFormData] = useState({
    company_name: '',
    role: '',
    location: '',
    job_type: 'full_time',
    salary_range: '',
    description: '', // Job Link
    deadline: '',
    referral_available: false,
    is_active: true
  })
  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [referralActionLoading, setReferralActionLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      if (res.ok) {
        const data = await res.json()
        setDashData(data)

        // Show daily RP award
        if (data.dailyRPEarned) {
          showAward(1, "Daily visit bonus 🌅");
        }
      }
    } catch (err) {
      console.error('Dashboard data error:', err)
    } finally {
      setDataLoading(false)
    }
  }

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setJobFormLoading(true)
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobFormData)
      })
      if (res.ok) {
        showAward(20, "Job posted successfully! 💼")
        setJobModalOpen(false)
        setJobFormData({
          company_name: '',
          role: '',
          location: '',
          job_type: 'full_time',
          salary_range: '',
          description: '',
          deadline: '',
          referral_available: false,
          is_active: true
        })
        fetchDashboardData() // Refresh activity
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to post job')
      }
    } catch (err) {
      console.error('Job post error:', err)
      alert('Something went wrong')
    } finally {
      setJobFormLoading(false)
    }
  }

  const handleApproveReferral = async () => {
    if (!selectedReferral) return
    setReferralActionLoading(true)
    try {
      const res = await fetch('/api/referrals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId: selectedReferral.id })
      })
      if (res.ok) {
        showAward(10, "Referral Approved! 🤝")
        setReviewModalOpen(false)
        fetchDashboardData() // Refresh counts
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to approve')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setReferralActionLoading(false)
    }
  }

  // Note: Auth checking is handled by the layout.tsx file
  // No need for duplicate auth logic here

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`w-60 flex-shrink-0 bg-white border-r border-gray-200 h-screen fixed lg:sticky top-0 flex flex-col overflow-y-auto z-50 lg:z-auto transition-transform lg:transition-none ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Logo + User */}
        <div className="p-4 border-b border-gray-100">
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none'
            }}
            className="mb-5"
          >
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0A0A0A'
            }}>
              Clas<span style={{ color: '#7C3AED' }}>pire</span>
            </span>
          </Link>

          {/* User Card */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full ${dashData?.user?.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-purple-600 to-cyan-500'} text-white text-xs font-black flex items-center justify-center flex-shrink-0 overflow-hidden`}>
              {dashData?.user?.avatar_url ? (
                <img src={dashData.user.avatar_url} alt={dashData.user.full_name} className="w-full h-full object-cover" />
              ) : (
                dashData?.user?.full_name?.[0] || 'S'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-black">
                {dashData?.user?.full_name || 'Senior'}
              </div>
              <div className="text-xs text-gray-400">
                {dashData?.user?.unique_id || '#CLS-S-2022-00234'}
              </div>
              <div className="mt-1">
                <span className="bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5 text-[10px] font-black text-green-600">
                  ✅ Verified Senior · {dashData?.user?.company || 'Company'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rise Points Card */}
        <div className="m-3 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl p-3">
          <div className="text-[10px] font-black text-white/75 tracking-wider uppercase mb-1 flex items-center gap-1">
            <Zap size={10} />
            Rise Points
          </div>
          <div className="font-instrument-serif text-2xl text-white leading-none my-1">
            {dashData?.user?.rise_points || 0} RP
          </div>
          <div className="bg-white/20 rounded-full h-1 my-2">
            <div className="bg-white rounded-full h-1 w-[46.8%]"></div>
          </div>
          <div className="flex justify-between text-[10px] text-white/70">
            <span className="flex items-center gap-1">
              <Trophy size={10} />
              Champion
            </span>
            <span>2,660 RP to Legend</span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="p-2 flex-1 overflow-y-auto">
          {/* Main Section */}
          <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-2 mb-1.5 mt-0">
            MAIN
          </div>
          <div className="space-y-0.5 mb-4">
            <div
              onClick={() => setActiveNav("overview")}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${activeNav === "overview"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
            >
              <span className="text-sm w-5 text-center">🏠</span>
              Overview
            </div>
          </div>

          {/* Community Section */}
          <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-2 mb-1.5">
            COMMUNITY
          </div>
          <div className="space-y-0.5 mb-4">
            <div
              onClick={() => setActiveNav("overview")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <HelpCircle size={16} className="flex-shrink-0" />
              <span>Doubts to Answer</span>
              {dashData?.pendingDoubts?.length > 0 && (
                <span className="ml-auto bg-red-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                  {dashData.pendingDoubts.length}
                </span>
              )}
            </div>
            <div
              onClick={() => setJobModalOpen(true)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <Briefcase size={16} className="flex-shrink-0" />
              <span>Post a Job</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Handshake size={16} className="flex-shrink-0" />
              <span>Referral Requests</span>
              {dashData?.pendingReferrals?.length > 0 && (
                <span className="ml-auto w-4 h-4 rounded-full bg-purple-600 text-white text-[8px] flex items-center justify-center">
                  {dashData.pendingReferrals.length}
                </span>
              )}
            </div>
          </div>

          {/* Earnings Section */}
          <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-2 mb-1.5">
            EARNINGS
          </div>
          <div className="space-y-0.5 mb-4">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Mic size={16} className="flex-shrink-0" />
              <span>My Webinars</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <DollarSign size={16} className="flex-shrink-0" />
              <span>Earnings & Payouts</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <BarChart3 size={16} className="flex-shrink-0" />
              <span>Analytics</span>
            </div>
          </div>

          {/* Impact Section */}
          <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-2 mb-1.5">
            IMPACT
          </div>
          <div className="space-y-0.5 mb-4">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <TrendingUp size={16} className="flex-shrink-0" />
              <span>Students Placed</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Star size={16} className="flex-shrink-0" />
              <span>My Reputation</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Trophy size={16} className="flex-shrink-0" />
              <span>Leaderboard</span>
            </div>
          </div>

          {/* Account Section */}
          <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-2 mb-1.5">
            ACCOUNT
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <User size={16} className="flex-shrink-0" />
              <span>My Profile</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>Verification</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Settings size={16} className="flex-shrink-0" />
              <span>Settings</span>
            </div>
          </div>
        </div>

        {/* Host Webinar CTA */}
        <div className="m-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="text-xs font-black text-green-800 mb-1">
            🎤 Host a Webinar
          </div>
          <div className="text-xs text-green-600 mb-2.5">
            Earn 80% of ticket price
          </div>
          <button className="w-full bg-green-600 text-white border-none rounded-lg py-1.5 text-xs font-black cursor-pointer hover:bg-green-700 transition-colors">
            + Create Webinar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-7 lg:p-8">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="text-xl p-2"
          >
            ☰
          </button>
          <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-black text-gray-600 font-mono">
            {dashData?.user?.unique_id || '#CLS-S-2022-00234'}
          </div>
        </div>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="font-instrument-serif font-normal text-2xl text-black">
              Welcome back, {dashData?.user?.full_name || 'Senior'} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Wednesday, Mar 5 · {dashData?.user?.designation || 'SDE-2'} @ {dashData?.user?.company || 'Company'}
            </p>
          </div>

          <div className="hidden lg:block bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-black text-gray-600 font-mono" title="Your unique Claspire ID">
            {dashData?.user?.unique_id || '#CLS-S-2022-00234'}
          </div>
        </div>

        {/* Impact Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 mb-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute right-[-20px] top-[-20px] w-[200px] h-[200px] bg-purple-600/20 rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] font-black tracking-wider text-purple-300 mb-2">
                  🌟 YOUR IMPACT
                </div>
                <div className="font-instrument-serif text-2xl text-white leading-tight mb-1">
                  {dashData?.user?.answer_count > 0 ? `${dashData.user.answer_count * 2} students impacted` : '0 students impacted'}
                </div>
                <div className="text-sm text-white/60">
                  from your community interactions
                </div>

                {/* Stats Row */}
                <div className="flex gap-8 mt-5">
                  <div>
                    <div className="font-instrument-serif text-2xl text-white">
                      {dashData?.user?.answer_count || 0}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">Doubts Answered</div>
                  </div>
                  <div>
                    <div className="font-instrument-serif text-2xl text-white">
                      {dashData?.user?.referral_count || 0}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">Referrals Approved</div>
                  </div>
                  <div>
                    <div className="font-instrument-serif text-2xl text-white">
                      {dashData?.user?.rise_points || 0}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">Rise Points</div>
                  </div>
                </div>
              </div>

              {/* Student Avatars */}
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-purple-600 border-2 border-indigo-900 text-white text-[11px] font-black flex items-center justify-center">AK</div>
                <div className="w-9 h-9 rounded-full bg-cyan-500 border-2 border-indigo-900 text-white text-[11px] font-black flex items-center justify-center -ml-2.5">PR</div>
                <div className="w-9 h-9 rounded-full bg-green-500 border-2 border-indigo-900 text-white text-[11px] font-black flex items-center justify-center -ml-2.5">SK</div>
                <div className="w-9 h-9 rounded-full bg-orange-500 border-2 border-indigo-900 text-white text-[11px] font-black flex items-center justify-center -ml-2.5">DK</div>
                <div className="w-9 h-9 rounded-full bg-pink-500 border-2 border-indigo-900 text-white text-[11px] font-black flex items-center justify-center -ml-2.5">RV</div>
                <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-indigo-900 text-white text-[11px] font-black flex items-center justify-center -ml-2.5">+7</div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10">
              <button className="text-sm text-purple-300 font-semibold hover:text-purple-200 transition-colors">
                View Impact Wall →
              </button>
              <button className="bg-white/10 text-white border-none rounded-lg px-3.5 py-1.5 text-xs font-semibold hover:bg-white/15 transition-colors">
                Share on LinkedIn →
              </button>
            </div>
          </div>
        </div>

        {/* Action Needed Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
              Action Needed
            </div>
            <span className="bg-red-50 text-red-500 rounded-full px-2 py-0.5 text-[10px] font-black">
              {(dashData?.pendingDoubts?.length || 0) + (dashData?.pendingReferrals?.length || 0)} total
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Unanswered Doubts Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="text-sm font-black text-black">❓ Unanswered Doubts</div>
                <div className="text-[10px] font-bold text-gray-400">SYNCED</div>
              </div>

              <div className="divide-y divide-gray-50">
                {dataLoading ? (
                  <div className="p-10 text-center text-gray-400 text-xs">Loading...</div>
                ) : dashData?.pendingDoubts?.length > 0 ? (
                  dashData.pendingDoubts.map((post: any) => (
                    <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                              className={`w-8 h-8 rounded-lg flex-shrink-0 ${post.users?.avatar_url ? 'bg-transparent' : 'bg-purple-100'} flex items-center justify-center text-purple-600 font-bold text-[10px] overflow-hidden cursor-pointer hover:scale-105 transition-transform`}
                            >
                              {post.users?.avatar_url ? (
                                <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                              ) : (
                                post.users?.full_name?.[0] || 'S'
                              )}
                            </div>
                            <p className="text-xs font-black text-black leading-relaxed">
                              {post.title || post.content.slice(0, 80) + '...'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                              className="text-[10px] text-gray-400 cursor-pointer hover:text-purple-600 transition-colors"
                            >
                              by {post.users?.full_name || 'Student'}
                            </span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</span>
                          </div>
                        </div>
                        <Link
                          href={`/community/c/${dashData?.user?.colleges?.[0]?.slug || 'hub'}/p/${post.id}`}
                          className="bg-purple-50 text-purple-600 rounded-lg px-3 py-1.5 text-[10px] font-black hover:bg-purple-100 transition-colors whitespace-nowrap"
                        >
                          Answer →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-400 text-xs">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
                    No pending doubts right now!
                  </div>
                )}
              </div>
            </div>

            {/* Referral Requests Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="text-sm font-black text-black">🤝 Referral Requests</div>
                <div className="text-[10px] font-bold text-gray-400">PENDING</div>
              </div>

              <div className="divide-y divide-gray-50">
                {dashData?.pendingReferrals?.length > 0 ? (
                  dashData.pendingReferrals.map((req: any) => (
                    <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => router.push(`/u/${req.requester?.unique_id}`)}
                            className={`w-9 h-9 rounded-full ${req.requester?.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-purple-100 to-cyan-50'} text-purple-600 text-xs font-black flex items-center justify-center border border-purple-100 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
                          >
                            {req.requester?.avatar_url ? (
                              <img src={req.requester.avatar_url} alt={req.requester.full_name} className="w-full h-full object-cover" />
                            ) : (
                              req.requester?.full_name?.[0] || 'S'
                            )}
                          </div>
                          <div>
                            <p
                              onClick={() => router.push(`/u/${req.requester?.unique_id}`)}
                              className="text-xs font-black text-black cursor-pointer hover:text-purple-600 transition-colors"
                            >
                              {req.requester?.full_name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold">{req.job?.role} @ {req.job?.company_name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedReferral(req)
                            setReviewModalOpen(true)
                          }}
                          className="bg-black text-white rounded-lg px-3 py-1.5 text-[10px] font-black hover:bg-gray-800 transition-colors"
                        >
                          Review Detail
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-400 text-xs">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>💼</div>
                    No pending referrals
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Webinar Manager */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-black text-black">🎤 My Webinars</h2>
                <button className="bg-purple-600 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold hover:bg-purple-700 transition-colors">
                  + Create New
                </button>
              </div>

              <div className="p-10 text-center text-gray-400 text-xs">
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎤</div>
                No webinars scheduled.
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-sm font-black text-black">Recent Activity</h2>
              </div>

              <div className="divide-y divide-gray-50">
                {dashData?.rpLog?.length > 0 ? (
                  dashData.rpLog.map((log: any, i: number) => (
                    <div key={log.id || i} className="flex gap-3 p-5 items-start">
                      <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                        {log.reason?.includes('Posted') ? '✍️' : log.reason?.includes('Answering') ? '✅' : '🌟'}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-black">{log.reason}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Interaction logged in community</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{timeAgo(log.created_at)}</div>
                        <div className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black mt-1">
                          +{log.points} RP
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-400 text-xs">
                    No recent activity yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Earnings Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-black text-black mb-4">💰 Earnings</h3>

              <div className="font-instrument-serif text-[36px] text-black my-2">
                ₹0
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                <span>-</span>
                <span>No earnings yet</span>
              </div>

              {/* Progress Bar */}
              <div className="my-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: '72%' }}></div>
              </div>

              {/* Breakdown */}
              <div className="mt-4">
                <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2.5">
                  BREAKDOWN
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎤</span>
                      <span className="text-xs font-semibold text-gray-700">Webinars</span>
                    </div>
                    <span className="text-xs font-black text-black">₹3,960</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💬</span>
                      <span className="text-xs font-semibold text-gray-700">DM Sessions</span>
                    </div>
                    <span className="text-xs font-black text-black">₹360</span>
                  </div>
                </div>
              </div>

              {/* Payout Section */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400">Pending payout</div>
                    <div className="text-base font-black text-black">₹2,100</div>
                  </div>
                  <button className="bg-black text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-gray-800 transition-colors">
                    Withdraw →
                  </button>
                </div>
              </div>
            </div>

            {/* Rise Points Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-black text-black mb-4">⚡ Rise Points</h3>

              <div className="flex justify-between items-center mb-3">
                <div className="text-base font-black text-purple-600">Champion 🏆</div>
                <div className="text-xs font-black text-black">2,340 RP</div>
              </div>

              <div className="text-xs text-gray-400 mb-2">2340/5000 to Legend</div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full" style={{ width: '46.8%' }}></div>
              </div>

              {/* RP Sources */}
              <div className="mb-4">
                <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2.5">
                  HOW YOU EARNED RP
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <span className="text-xs font-semibold text-gray-700">Total Points</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">+{dashData?.user?.rise_points || 0} RP</span>
                  </div>
                  <div className="p-4 text-center text-[10px] text-gray-400 italic">
                    Earn more by helping students!
                  </div>
                </div>
              </div>

              {/* Levels */}
              <div className="pt-3.5 border-t border-gray-100">
                <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase mb-2.5">
                  LEVELS
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 py-1">
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-[10px] font-black">✅</span>
                    <span className="text-xs text-gray-500">Contributor (0-500)</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 text-[10px] font-black">✅</span>
                    <span className="text-xs text-gray-500">Mentor (500-2000)</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="bg-purple-100 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black">🟡</span>
                    <span className="text-xs text-gray-500">Champion (2000-5000)</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 text-[10px] font-black">🔒</span>
                    <span className="text-xs text-gray-500">Legend (5000+)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reputation Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-black text-black mb-4">⭐ Reputation</h3>

              <div className="flex items-center gap-3 mb-3">
                <div className="font-instrument-serif text-[40px] text-black">4.9</div>
                <div>
                  <div className="text-amber-500 text-lg">★★★★★</div>
                  <div className="text-xs text-gray-400 mt-0.5">Based on 47 ratings</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-base font-black text-black">87%</div>
                  <div className="text-xs text-gray-400">Response Rate</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-base font-black text-black">1.2h</div>
                  <div className="text-xs text-gray-400">Avg Response</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-base font-black text-black">23</div>
                  <div className="text-xs text-gray-400">Answers</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-base font-black text-black">8</div>
                  <div className="text-xs text-gray-400">Referrals</div>
                </div>
              </div>

              {/* Reviews */}
              <div className="pt-3 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="pb-3 border-b border-gray-50">
                    <div className="text-amber-500 text-xs">★★★★★</div>
                    <div className="text-xs text-gray-700 italic mt-1 leading-relaxed">
                      "Got Swiggy offer after his referral!"
                    </div>
                    <div className="text-xs text-gray-400 mt-1">— Arun K, SRM CSE 2024</div>
                  </div>

                  <div className="pb-3 border-b border-gray-50">
                    <div className="text-amber-500 text-xs">★★★★★</div>
                    <div className="text-xs text-gray-700 italic mt-1 leading-relaxed">
                      "Replied within 30 mins. Very detailed!"
                    </div>
                    <div className="text-xs text-gray-400 mt-1">— Sneha R, SRM IT 2024</div>
                  </div>

                  <div>
                    <div className="text-amber-500 text-xs">★★★★★</div>
                    <div className="text-xs text-gray-700 italic mt-1 leading-relaxed">
                      "Webinar was worth every rupee ₹99"
                    </div>
                    <div className="text-xs text-gray-400 mt-1">— Priya M, SRM CSE 2024</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Wall Card */}
            <div className="bg-slate-900 rounded-xl p-5">
              <div className="text-[11px] font-black tracking-wider text-purple-300 mb-1">
                🏆 IMPACT WALL
              </div>
              <div className="text-sm text-white/60 mb-3">
                Students you helped place
              </div>

              {/* Student Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center mx-auto mb-1.5">AK</div>
                  <div className="text-xs font-black text-white mb-0.5">Arun K</div>
                  <div className="text-xs text-purple-300">Swiggy</div>
                </div>

                <div className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white text-[10px] font-black flex items-center justify-center mx-auto mb-1.5">PR</div>
                  <div className="text-xs font-black text-white mb-0.5">Priya R</div>
                  <div className="text-xs text-purple-300">Flipkart</div>
                </div>

                <div className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white text-[10px] font-black flex items-center justify-center mx-auto mb-1.5">SK</div>
                  <div className="text-xs font-black text-white mb-0.5">Sneha K</div>
                  <div className="text-xs text-purple-300">Amazon</div>
                </div>

                <div className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center mx-auto mb-1.5">DK</div>
                  <div className="text-xs font-black text-white mb-0.5">Divya K</div>
                  <div className="text-xs text-purple-300">Zoho</div>
                </div>

                <div className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center mx-auto mb-1.5">RV</div>
                  <div className="text-xs font-black text-white mb-0.5">Rohit V</div>
                  <div className="text-xs text-purple-300">TCS</div>
                </div>

                <div className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center mx-auto mb-1.5">MP</div>
                  <div className="text-xs font-black text-white mb-0.5">Meera P</div>
                  <div className="text-xs text-purple-300">Infosys</div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 mb-3">+ 6 more</div>

              <button className="w-full bg-white/10 text-white border-none rounded-lg py-2.5 text-xs font-semibold hover:bg-white/15 transition-colors">
                Share on LinkedIn 🔗
              </button>
            </div>
          </div>
        </div>
        {/* Job Posting Modal */}
        {jobModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !jobFormLoading && setJobModalOpen(false)} />

            <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-lg font-black text-black">💼 Post a Job Opening</h2>
                  <p className="text-xs text-gray-400 mt-1">Share opportunities and earn 20 Rise Points</p>
                </div>
                <button
                  onClick={() => setJobModalOpen(false)}
                  className="text-gray-400 hover:text-black transition-colors"
                  disabled={jobFormLoading}
                >
                  ✕
                </button>
              </div>

              {/* Form Scrollable Content */}
              <div className="p-6 overflow-y-auto">
                <form id="jobForm" onSubmit={handlePostJob} className="space-y-4">
                  {/* Company & Role */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Company Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Swiggy"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.company_name}
                        onChange={e => setJobFormData({ ...jobFormData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Job Role</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. SDE-1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.role}
                        onChange={e => setJobFormData({ ...jobFormData, role: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Location & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Remote / Bangalore"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.location}
                        onChange={e => setJobFormData({ ...jobFormData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Job Type</label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.job_type}
                        onChange={e => setJobFormData({ ...jobFormData, job_type: e.target.value })}
                      >
                        <option value="full_time">Full Time</option>
                        <option value="internship">Internship</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                  </div>

                  {/* Job Link */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Job Link / Description</label>
                    <input
                      required
                      type="url"
                      placeholder="https://company.com/careers/job123"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      value={jobFormData.description}
                      onChange={e => setJobFormData({ ...jobFormData, description: e.target.value })}
                    />
                  </div>

                  {/* Expiry & Salary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.deadline}
                        onChange={e => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Salary (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 12-15 LPA"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.salary_range}
                        onChange={e => setJobFormData({ ...jobFormData, salary_range: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={jobFormData.referral_available}
                          onChange={e => setJobFormData({ ...jobFormData, referral_available: e.target.checked })}
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Referral Available?</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={jobFormData.is_active}
                          onChange={e => setJobFormData({ ...jobFormData, is_active: e.target.checked })}
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Set as Open/Active</span>
                    </label>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 text-xs font-black text-gray-500 hover:bg-gray-100 transition-colors"
                  disabled={jobFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="jobForm"
                  className="flex-[2] bg-purple-600 text-white border-none rounded-xl py-2.5 text-xs font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all transform active:scale-[0.98] disabled:opacity-50"
                  disabled={jobFormLoading}
                >
                  {jobFormLoading ? 'Posting...' : 'Post Job Opening →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Referral Review Modal */}
        {reviewModalOpen && selectedReferral && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !referralActionLoading && setReviewModalOpen(false)} />

            <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-fade">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-black text-black">🤝 Review Referral</h2>
                <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
              </div>

              <div className="p-8 text-center border-b border-gray-50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-cyan-50 text-purple-600 text-2xl font-black flex items-center justify-center border-2 border-white shadow-xl mx-auto mb-4">
                  {selectedReferral.requester?.full_name?.[0]}
                </div>
                <h3 className="text-xl font-black text-black">{selectedReferral.requester?.full_name}</h3>
                <p className="text-sm text-gray-400 font-semibold">{selectedReferral.requester?.unique_id}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  {selectedReferral.requester?.colleges?.[0]?.name || selectedReferral.requester?.colleges?.name}
                </p>

                <div className="mt-6 inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-xs font-black">
                  <Briefcase size={14} />
                  Seeking: {selectedReferral.job?.role} @ {selectedReferral.job?.company_name}
                </div>
              </div>

              <div className="p-6 bg-gray-50/50">
                <p className="text-xs text-center text-gray-400 leading-relaxed mb-6">
                  By confirming, you agree to refer this student for the opening. Their profile details will be shared with you for the formal process.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl py-3 text-sm font-black text-gray-400 hover:bg-gray-100 transition-colors"
                    disabled={referralActionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveReferral}
                    className="flex-[2] bg-purple-600 text-white rounded-xl py-3 text-sm font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-50"
                    disabled={referralActionLoading}
                  >
                    {referralActionLoading ? 'Processing...' : 'Confirm & Approve →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <NotificationPrompt />
    </div>
  );
}
