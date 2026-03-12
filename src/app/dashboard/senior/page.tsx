'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePoints } from '@/contexts/PointsContext';
import { HelpCircle, Briefcase, Handshake, Mic, DollarSign, BarChart3, Star, Trophy, User, CheckCircle, Settings, Zap, TrendingUp } from 'lucide-react';

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
  // Move ALL useState hooks to the top - Rules of Hooks compliance
  const { showAward } = usePoints();
  const [activeNav, setActiveNav] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)

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
      <div className={`w-60 flex-shrink-0 bg-white border-r border-gray-200 h-screen fixed lg:sticky top-0 flex flex-col overflow-y-auto z-50 lg:z-auto transition-transform lg:transition-none ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
              RS
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
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                activeNav === "overview" 
                  ? "bg-purple-50 text-purple-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span className="text-sm w-5 text-center">🏠</span>
              Overview
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <span className="text-sm w-5 text-center">🔔</span>
              Notifications
              <span className="ml-auto bg-red-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                5
              </span>
            </div>
          </div>

          {/* Community Section */}
          <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-2 mb-1.5">
            COMMUNITY
          </div>
          <div className="space-y-0.5 mb-4">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <HelpCircle size={16} className="flex-shrink-0" />
              <span>Doubts to Answer</span>
              <span className="ml-auto bg-red-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                3
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Briefcase size={16} className="flex-shrink-0" />
              <span>Post a Job</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Handshake size={16} className="flex-shrink-0" />
              <span>Referral Requests</span>
              <span className="ml-auto bg-red-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                2
              </span>
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
                  12 students placed
                </div>
                <div className="text-sm text-white/60">
                  because of your answers & referrals
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
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[11px] font-black tracking-wider text-gray-400">
              ACTION NEEDED
            </div>
            <span className="bg-red-50 text-red-500 rounded-full px-2 py-0.5 text-[10px] font-black">
              5 pending
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Unanswered Doubts Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-3.5 border-b border-gray-100 flex justify-between items-center">
                <div className="text-sm font-black text-black">❓ Unanswered Doubts</div>
                <span className="bg-red-50 text-red-500 rounded-full px-2 py-0.5 text-[11px] font-black">
                  {dashData?.pendingDoubts?.length || 0} waiting
                </span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {dataLoading ? (
                  <p style={{
                    textAlign: 'center',
                    color: '#9CA3AF',
                    fontSize: 14,
                    padding: '20px'
                  }}>
                    Loading doubts...
                  </p>
                ) : dashData?.pendingDoubts?.length > 0 ? (
                  dashData.pendingDoubts.map((post: any) => (
                    <div key={post.id} style={{
                      padding: '14px',
                      background: '#F9FAFB',
                      borderRadius: 10,
                      border: '1px solid #F3F4F6',
                      marginBottom: 10
                    }}>
                      <p style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#374151',
                        margin: '0 0 6px'
                      }}>
                        {post.title || post.content.slice(0, 100)}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: 11,
                          color: '#9CA3AF'
                        }}>
                          by {post.users?.full_name || 'Student'} · 
                          {post.users?.branch || ''} 
                          Year {post.users?.year || ''} · 
                          {timeAgo(post.created_at)}
                        </span>
                        <button style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#7C3AED',
                          background: '#F3F0FF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          cursor: 'pointer'
                        }}>
                          Answer →
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    color: '#9CA3AF'
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                    <p style={{ fontSize: 14, margin: 0 }}>
                      No pending doubts right now!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Requests Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-3.5 border-b border-gray-100 flex justify-between items-center">
                <div className="text-sm font-black text-black">🤝 Referral Requests</div>
                <span className="bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 text-[11px] font-black">
                  2 pending
                </span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {/* Referral 1 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">AK</div>
                    <span className="text-xs font-black text-black">Arun Kumar</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">SRM</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    For: Swiggy SDE-1 · ₹18 LPA
                  </div>
                  <div className="bg-purple-50 text-purple-600 rounded px-2 py-0.5 text-[10px] font-black mb-2">
                    🤖 AI drafted email ready
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 text-white rounded px-3 py-1 text-xs font-semibold hover:bg-purple-700 transition-colors">
                      Review & Approve →
                    </button>
                    <button className="bg-white border border-gray-200 text-gray-400 rounded px-2.5 py-1 text-xs hover:border-gray-300 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
                
                {/* Referral 2 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center">PR</div>
                    <span className="text-xs font-black text-black">Priya R</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">SRM</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    For: Swiggy Data Analyst · ₹12 LPA
                  </div>
                  <div className="bg-purple-50 text-purple-600 rounded px-2 py-0.5 text-[10px] font-black mb-2">
                    🤖 AI drafted email ready
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 text-white rounded px-3 py-1 text-xs font-semibold hover:bg-purple-700 transition-colors">
                      Review & Approve →
                    </button>
                    <button className="bg-white border border-gray-200 text-gray-400 rounded px-2.5 py-1 text-xs hover:border-gray-300 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
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

              {/* Upcoming Webinar */}
              <div className="p-5 border-b border-gray-100">
                <div className="text-[10px] font-black tracking-wider text-green-600 uppercase mb-2.5">
                  UPCOMING
                </div>
                <div className="flex gap-3.5 items-center">
                  {/* Date Box */}
                  <div className="bg-purple-50 rounded-lg p-3 text-center flex-shrink-0">
                    <div className="text-[10px] font-black text-purple-600 uppercase">MAR</div>
                    <div className="font-instrument-serif text-2xl text-purple-600 leading-none">09</div>
                    <div className="text-xs text-gray-400">SUN</div>
                  </div>
                  
                  {/* Webinar Info */}
                  <div className="flex-1">
                    <div className="text-sm font-black text-black">How I cracked Amazon SDE</div>
                    <div className="text-xs text-gray-400 mt-1">
                      10:00 AM · 2 hours · ₹99/seat
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mt-2">
                      <span>👥 18 registered</span>
                      <span>💰 ₹1,782 projected earnings</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-1.5">
                    <button className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 hover:border-gray-300 transition-colors">
                      Edit
                    </button>
                    <button className="bg-purple-600 text-white rounded px-2 py-1 text-xs font-semibold hover:bg-purple-700 transition-colors">
                      View →
                    </button>
                  </div>
                </div>
              </div>

              {/* Past Webinars */}
              <div className="p-5">
                <div className="text-[10px] font-black tracking-wider text-gray-400 uppercase mb-2.5">
                  PAST
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                    <div>
                      <div className="text-sm font-black text-black">DSA for Placements</div>
                      <div className="text-xs text-gray-400 mt-0.5">Jan 5 · 34 attended</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-500">⭐ 4.8</div>
                      <div className="text-sm font-bold text-green-600">₹3,366</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-black">Resume Writing Workshop</div>
                      <div className="text-xs text-gray-400 mt-0.5">Dec 22 · 28 attended</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-500">⭐ 4.9</div>
                      <div className="text-sm font-bold text-green-600">₹2,772</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-sm font-black text-black">Recent Activity</h2>
              </div>

              <div className="divide-y divide-gray-50">
                {/* Activity 1 */}
                <div className="flex gap-3 p-5 items-start">
                  <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                    ✅
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-black">Answered Arun's doubt</div>
                    <div className="text-xs text-gray-400 mt-0.5">Got 23 upvotes · Marked helpful</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">2h ago</div>
                    <div className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black mt-1">
                      +10 RP
                    </div>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="flex gap-3 p-5 items-start">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                    🤝
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-black">Approved referral for Priya</div>
                    <div className="text-xs text-gray-400 mt-0.5">Swiggy Data Analyst application sent</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">5h ago</div>
                    <div className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black mt-1">
                      +30 RP
                    </div>
                  </div>
                </div>

                {/* Activity 3 */}
                <div className="flex gap-3 p-5 items-start">
                  <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                    💼
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-black">Posted Swiggy SDE-1 opening</div>
                    <div className="text-xs text-gray-400 mt-0.5">12 students viewed · 3 applied</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">1d ago</div>
                    <div className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black mt-1">
                      +20 RP
                    </div>
                  </div>
                </div>

                {/* Activity 4 */}
                <div className="flex gap-3 p-5 items-start">
                  <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                    🎤
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-black">Webinar completed</div>
                    <div className="text-xs text-gray-400 mt-0.5">34 attended · ₹3,366 earned</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">3d ago</div>
                    <div className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black mt-1">
                      +50 RP
                    </div>
                  </div>
                </div>

                {/* Activity 5 */}
                <div className="flex gap-3 p-5 items-start">
                  <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                    🌟
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-black">Student placed! 🎉</div>
                    <div className="text-xs text-gray-400 mt-0.5">Arun Kumar → Swiggy SDE-1</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">5d ago</div>
                    <div className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black mt-1">
                      +100 RP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Earnings Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-black text-black mb-4">💰 Earnings</h3>
              
              <div className="font-instrument-serif text-[36px] text-black my-2">
                ₹4,320
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <span>↑</span>
                <span>28% vs last month</span>
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
                      <span className="text-sm">❓</span>
                      <span className="text-xs font-semibold text-gray-700">Answering doubts</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">+230 RP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🤝</span>
                      <span className="text-xs font-semibold text-gray-700">Referrals approved</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">+240 RP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎤</span>
                      <span className="text-xs font-semibold text-gray-700">Webinars hosted</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">+200 RP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🌟</span>
                      <span className="text-xs font-semibold text-gray-700">Students placed</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">+1,200 RP</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👤</span>
                      <span className="text-xs font-semibold text-gray-700">Profile complete</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">+90 RP</span>
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
      </div>
    </div>
  );
}
