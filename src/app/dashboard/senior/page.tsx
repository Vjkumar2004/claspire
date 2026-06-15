'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePoints } from '@/contexts/PointsContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { HelpCircle, Briefcase, Handshake, Mic, DollarSign, BarChart3, Star, Trophy, User, CheckCircle, Settings, Zap, TrendingUp, LayoutDashboard, MessageSquare, Trash2, Users, Plus, Eye, Lock, Globe, GraduationCap, Sparkles } from 'lucide-react';
import CreateGroupModal from '@/components/CreateGroupModal'
import MyGroupsModal from '@/components/MyGroupsModal'
import MyGroupsList from '@/components/MyGroupsList'

import NotificationBell from '@/components/NotificationBell';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import GroupJoinRequestsSection from '@/components/GroupJoinRequestsSection';

import { Pencil } from 'lucide-react';

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

const getRPLevel = (points: number) => {
  if (points >= 5000) return { label: 'Legend', emoji: '👑', next: null, color: '#F59E0B' }
  if (points >= 1500) return { label: 'Champion', emoji: '🏆', next: 5000, color: '#7C3AED' }
  if (points >= 500) return { label: 'Mentor', emoji: '💎', next: 1500, color: '#06B6D4' }
  if (points >= 100) return { label: 'Contributor', emoji: '🌟', next: 500, color: '#16A34A' }
  return { label: 'Explorer', emoji: '🌱', next: 100, color: '#8B5CF6' }
}

export default function SeniorDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Move ALL useState hooks to the top - Rules of Hooks compliance
  const { showAward } = usePoints();
  const [activeNav, setActiveNav] = useState("overview");

  // Redirect legacy ?activeTab=messages URLs to full-screen messages page
  useEffect(() => {
    const tab = searchParams.get('activeTab');
    const targetUser = searchParams.get('user');

    if (tab === 'messages') {
      const url = `/dashboard/senior/messages${targetUser ? `?user=${targetUser}` : ''}`;
      router.replace(url);
      return;
    }

    if (tab && ["overview", "jobs", "referrals", "my-posts"].includes(tab)) {
      setActiveNav(tab);
    }
  }, [searchParams, router]);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [userCollegeCommunityId, setUserCollegeCommunityId] = useState<string>('')
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [showMyGroupsModal, setShowMyGroupsModal] = useState(false)
  const referralSectionRef = useRef<HTMLDivElement | null>(null)
  const groupRequestsSectionRef = useRef<HTMLDivElement | null>(null)
  const [pendingGroupRequests, setPendingGroupRequests] = useState(0)

  // My Posts states
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    fetchUserCollegeCommunity()
  }, [])

  const fetchUserCollegeCommunity = async () => {
    try {
      const res = await fetch('/api/community/my-college')
      if (res.ok) {
        const data = await res.json()
        setUserCollegeCommunityId(data.communityId || '')
      }
      // Silently ignore 404 — senior may not have a college assigned
    } catch (err) {
      // Network errors — ignore silently
    }
  }

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/me', {
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setDashData(data)
      }
    } catch (err) {
      console.error('Dashboard data error:', err)
    } finally {
      setDataLoading(false)
    }
  }



  const deleteGroup = async (groupSlug: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/groups/${groupSlug}/delete`, { method: 'DELETE' })
      if (res.ok) {
        setUserGroups(userGroups.filter(g => g.slug !== groupSlug))
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete group')
      }
    } catch { 
      alert('Something went wrong') 
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    setDeletingPostId(postId)
    try {
      const res = await fetch('/api/posts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId })
      })
      if (res.ok) {
        setDashData((prev: any) => prev ? { ...prev, myPosts: prev.myPosts.filter((p: any) => p.id !== postId) } : null)
      } else {
        alert('Failed to delete post')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting post')
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDashData((prev: any) => prev ? { ...prev, myJobs: prev.myJobs.filter((j: any) => j.id !== jobId) } : null)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to delete job')
      }
    } catch {
      alert('Error deleting job')
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
        showAward(15, "Referral Approved! 🤝")
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        // Clear localStorage
        localStorage.clear()
        // Redirect to home
        window.location.href = '/'
      } else {
        alert('Failed to delete account. Please try again.')
        setIsDeleting(false)
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleOpenReferrals = () => {
    setActiveNav('overview')
    setMobileSidebarOpen(false)
    setTimeout(() => {
      referralSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const handleOpenGroupRequests = () => {
    setActiveNav('overview')
    setMobileSidebarOpen(false)
    setTimeout(() => {
      groupRequestsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const handleOpenProfile = () => {
    setMobileSidebarOpen(false)
    router.push('/profile')
  }

  // Note: Auth checking is handled by the layout.tsx file
  // No need for duplicate auth logic here

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1D2226] flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={`w-60 flex-shrink-0 bg-white dark:bg-[#283036] border-r border-gray-200 dark:border-[#38434F] h-screen fixed lg:sticky top-0 flex flex-col z-50 transition-transform lg:transition-none ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo + Notifications (Always visible) */}
        <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="font-plus-jakarta-sans font-bold text-lg text-black dark:text-white no-underline hover:no-underline">
              cl<span style={{ color: '#7C3AED' }}>aspire</span>
            </Link>
            <NotificationBell align="left" dark />
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
          {/* User Card */}
          <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full ${dashData?.user?.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-purple-600 to-cyan-500'} text-white text-xs font-black flex items-center justify-center flex-shrink-0 overflow-hidden`}>
              {dashData?.user?.avatar_url ? (
                <img src={dashData.user.avatar_url} alt={dashData.user.full_name} className="w-full h-full object-cover" />
              ) : (
                dashData?.user?.full_name?.[0] || 'S'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-black dark:text-white leading-tight">
                {dashData?.user?.full_name || 'Senior'}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-[#B0B7BE]">
                {dashData?.user?.unique_id || '#CLS-S-2022-00234'}
              </div>
              <div className="mt-1">
                <span className="bg-green-50 border border-green-200 rounded-full px-2 py-0.5 text-[9px] font-black text-green-600 block w-fit flex items-center gap-1">
                  <CheckCircle size={10} /> Verified Senior
                </span>
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
              <div className="bg-white dark:bg-[#283036] rounded-full h-1" style={{ width: `${Math.min((dashData?.user?.rise_points || 0) / (getRPLevel(dashData?.user?.rise_points || 0).next || dashData?.user?.rise_points || 1) * 100, 100)}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-white/70">
              <span className="flex items-center gap-1">
                <Trophy size={10} />
                {getRPLevel(dashData?.user?.rise_points || 0).label}
              </span>
              <span className="text-[9px]">
                {getRPLevel(dashData?.user?.rise_points || 0).next
                  ? `${getRPLevel(dashData?.user?.rise_points || 0).next! - (dashData?.user?.rise_points || 0)} RP to Next`
                  : 'Legend Status'}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="p-2">
            {/* Main Section */}
            <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-[#B0B7BE] px-2 mb-1.5 mt-0">
              MAIN
            </div>
            <div className="space-y-0.5 mb-4">
              <div
                onClick={() => {
                  router.push('/dashboard/senior/messages')
                  setMobileSidebarOpen(false)
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white"
              >
                <MessageSquare size={16} />
                Messages
              </div>
            </div>

            <div
              onClick={() => {
                setActiveNav("overview")
                router.push('?activeTab=overview', { scroll: false })
                setMobileSidebarOpen(false)
              }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${activeNav === "overview"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white"
                }`}
            >
              <HelpCircle size={16} className="flex-shrink-0" />
              <span>Doubts to Answer</span>
              {dashData?.pendingDoubts?.length > 0 && (
                <span className="ml-auto bg-red-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                  {dashData.pendingDoubts.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setJobModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <Briefcase size={16} className="flex-shrink-0" />
              <span>Post a Job</span>
            </button>
            <div
              onClick={() => {
                setActiveNav("jobs")
                router.push('?activeTab=jobs', { scroll: false })
                setMobileSidebarOpen(false)
              }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${activeNav === "jobs"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white"
                }`}
            >
              <Briefcase size={16} className="flex-shrink-0" />
              <span>My Jobs</span>
              {dashData?.myJobs?.length > 0 && (
                <span className="ml-auto bg-purple-600 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                  {dashData.myJobs.length}
                </span>
              )}
            </div>
            <div
              onClick={handleOpenReferrals}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <Handshake size={16} className="flex-shrink-0" />
              <span>Referral Requests</span>
              {dashData?.pendingReferrals?.length > 0 && (
                <span className="ml-auto w-4 h-4 rounded-full bg-purple-600 text-white text-[8px] flex items-center justify-center">
                  {dashData.pendingReferrals.length}
                </span>
              )}
            </div>
            
            <div
              onClick={() => {
                setActiveNav("my-posts")
                router.push('?activeTab=my-posts', { scroll: false })
                setMobileSidebarOpen(false)
              }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${activeNav === "my-posts"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white"
                }`}
            >
              <LayoutDashboard size={16} className="flex-shrink-0" />
              <span>My Posts</span>
            </div>
          </div>

          {/* My Groups Section */}
          <div className="p-2 mt-4 border-t border-gray-100 dark:border-[#38434F]">
            <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-[#B0B7BE] px-2 mb-1.5">
              MY GROUPS
            </div>
            <div className="space-y-0.5">
              <div
                onClick={handleOpenGroupRequests}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <Lock size={16} className="flex-shrink-0" />
                <span>Group Requests</span>
                {pendingGroupRequests > 0 && (
                  <span className="ml-auto bg-amber-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                    {pendingGroupRequests}
                  </span>
                )}
              </div>
              <div
                onClick={() => setShowMyGroupsModal(true)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <Users size={16} className="flex-shrink-0" />
                <span>My Created Groups</span>
                {userGroups.length > 0 && (
                  <span className="ml-auto bg-amber-500 text-white rounded-full px-1.5 py-0 text-[10px] font-black">
                    {userGroups.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="p-2 mt-4 border-t border-gray-100 dark:border-[#38434F]">
            <div className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-[#B0B7BE] px-2 mb-1.5">
              ACCOUNT
            </div>
            <div className="space-y-0.5">
              <div
                onClick={handleOpenProfile}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <User size={16} className="flex-shrink-0" />
                <span>My Profile</span>
              </div>
              <div
                onClick={handleOpenProfile}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-50 dark:hover:bg-[#1D2226] hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <Settings size={16} className="flex-shrink-0" />
                <span>Preferences</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#38434F]">
              <div className="text-[10px] font-black tracking-wider uppercase text-red-400 px-2 mb-1.5">
                DANGER ZONE
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
              >
                <Trash2 size={16} className="flex-shrink-0" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-7 lg:p-8">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-xl p-2"
            >
              ☰
            </button>
            <NotificationBell align="left" dark />
          </div>
          <div className="bg-gray-100 dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-1.5 text-xs font-black text-gray-600 dark:text-[#B0B7BE] font-mono">
            {dashData?.user?.unique_id || '#CLS-S-2022-00234'}
          </div>
        </div>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="font-instrument-serif font-normal text-2xl text-black dark:text-white">
              Welcome back, {dashData?.user?.full_name || 'Senior'} 👋
            </h1>
            <p className="text-xs text-gray-400 dark:text-[#B0B7BE] mt-0.5">
              Wednesday, Mar 5 · {dashData?.user?.designation || 'SDE-2'} @ {dashData?.user?.company || 'Company'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-black hover:shadow-lg transition-all"
            >
              Create Group
            </button>
            <div className="hidden lg:block bg-gray-100 dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-1.5 text-xs font-black text-gray-600 dark:text-[#B0B7BE] font-mono" title="Your unique Claspire ID">
              {dashData?.user?.unique_id || '#CLS-S-2022-00234'}
            </div>
          </div>
        </div>

        {/* Mobile Create Group Button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-4 py-3 rounded-xl text-xs font-black hover:shadow-lg transition-all"
          >
            Create Student Group
          </button>
        </div>

        {activeNav === "my-posts" ? (
          <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-instrument-serif">My Posts</h2>
                <p className="text-xs text-gray-400 dark:text-[#B0B7BE] mt-1">Manage all the doubts, resources and posts you've shared.</p>
              </div>
              <button
                onClick={() => router.push('/community?create=true')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl text-xs font-black hover:shadow-lg transition-all"
              >
                <Plus size={14} /> Create Post
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dashData?.myPosts?.length > 0 ? (
                dashData.myPosts.map((post: any) => (
                  <div key={post.id} className="bg-white dark:bg-[#283036] p-5 rounded-2xl border border-gray-200 dark:border-[#38434F] hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 dark:bg-[#283036] text-gray-600 dark:text-[#B0B7BE] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{post.type.replace('_', ' ')}</span>
                          <span className="text-[10px] text-gray-400 dark:text-[#B0B7BE]">{timeAgo(post.created_at)}</span>
                          {post.type === 'doubt' && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${post.is_answered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {post.is_answered ? 'Answered' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-2">{post.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-[#B0B7BE] line-clamp-2">{post.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => router.push(`/dashboard/senior/edit-post/${post.id}`)}
                          className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Edit Post"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-[#B0B7BE] border-t border-gray-100 dark:border-[#38434F] pt-3">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5"><TrendingUp size={14} /> {post.upvote_count || 0} Upvotes</span>
                        <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {post.answer_count || 0} Answers</span>
                      </div>
                      {post.communities && (
                         <span className="text-purple-600">in {post.communities.display_name}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-[#283036] border border-dashed border-gray-200 dark:border-[#38434F] rounded-2xl">
                  <LayoutDashboard size={40} className="mx-auto text-gray-300 dark:text-[#B0B7BE] mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Posts Yet</h3>
                  <p className="text-sm text-gray-500 dark:text-[#B0B7BE] mb-6">You haven't created any posts or doubts.</p>
                  <button
                    onClick={() => router.push('/community?create=true')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
                  >
                    <Plus size={16} /> Create Your First Post
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeNav === "jobs" ? (
          <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-instrument-serif">My Jobs</h2>
                <p className="text-xs text-gray-400 dark:text-[#B0B7BE] mt-1">Manage your job openings and referral opportunities.</p>
              </div>
              <button
                type="button"
                onClick={() => setJobModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl text-xs font-black hover:shadow-lg transition-all"
              >
                <Plus size={14} /> Post a Job
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {dashData?.myJobs?.length > 0 ? (
                dashData.myJobs.map((job: any) => (
                  <div key={job.id} className="bg-white dark:bg-[#283036] p-5 rounded-2xl border border-gray-200 dark:border-[#38434F] hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{job.job_type?.replace('_', ' ')}</span>
                          <span className="text-[10px] text-gray-400 dark:text-[#B0B7BE]">{timeAgo(job.created_at)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {job.is_active ? 'Active' : 'Closed'}
                          </span>
                          {job.referral_available && (
                            <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded text-[10px] font-bold">Referral Open</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">{job.role}</h3>
                        <p className="text-sm font-semibold text-gray-600 dark:text-[#B0B7BE] mb-2">@{job.company_name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#B0B7BE]">
                          <span>{job.location || 'Location not specified'}</span>
                          {job.salary_range && <span className="text-emerald-600 font-bold">{job.salary_range}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => router.push(`/dashboard/senior/edit-job/${job.id}`)}
                          className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Edit Job"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-[#283036] border border-dashed border-gray-200 dark:border-[#38434F] rounded-2xl">
                  <Briefcase size={40} className="mx-auto text-gray-300 dark:text-[#B0B7BE] mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Jobs Posted Yet</h3>
                  <p className="text-sm text-gray-500 dark:text-[#B0B7BE] mb-6">Post your first job opening to help students get referred.</p>
                  <button
                    type="button"
                    onClick={() => setJobModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
                  >
                    <Plus size={16} /> Post Your First Job
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl">

        {/* Action Needed Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-[11px] font-black tracking-wider text-gray-400 dark:text-[#B0B7BE] uppercase">
              Action Needed
            </div>
            <span className="bg-red-50 text-red-500 rounded-full px-2 py-0.5 text-[10px] font-black">
              {(dashData?.pendingDoubts?.length || 0) + (dashData?.pendingReferrals?.length || 0)} total
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Unanswered Doubts Card */}
            <div className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-purple-600" />
                  <div className="text-sm font-black text-black dark:text-white">Unanswered Doubts</div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-[#B0B7BE]">SYNCED</div>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                {dataLoading ? (
                  <div className="p-10 text-center text-gray-400 dark:text-[#B0B7BE] text-xs">Loading...</div>
                ) : dashData?.pendingDoubts?.length > 0 ? (
                  dashData.pendingDoubts.map((post: any) => (
                    <div key={post.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors">
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
                            <p className="text-xs font-black text-black dark:text-white leading-relaxed">
                              {post.title || post.content.slice(0, 80) + '...'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                              className="text-[10px] text-gray-400 dark:text-[#B0B7BE] cursor-pointer hover:text-purple-600 transition-colors"
                            >
                              by {post.users?.full_name || 'Student'}
                            </span>
                            <span className="text-[10px] text-gray-300 dark:text-[#B0B7BE]">•</span>
                            <span className="text-[10px] text-gray-400 dark:text-[#B0B7BE]">{timeAgo(post.created_at)}</span>
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
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-[#B0B7BE]">
                    <Sparkles size={24} className="mb-2 text-purple-300" />
                    <p className="text-sm font-medium">No pending doubts right now!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Requests Card */}
            <div ref={referralSectionRef} className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Handshake size={16} className="text-cyan-600" />
                  <div className="text-sm font-black text-black dark:text-white">Referral Requests</div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-[#B0B7BE]">PENDING</div>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                {dashData?.pendingReferrals?.length > 0 ? (
                  dashData.pendingReferrals.map((req: any) => (
                    <div key={req.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors">
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
                              className="text-xs font-black text-black dark:text-white cursor-pointer hover:text-purple-600 transition-colors"
                            >
                              {req.requester?.full_name}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-[#B0B7BE] font-semibold">{req.job?.role} @ {req.job?.company_name}</p>
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
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-[#B0B7BE]">
                    <Briefcase size={24} className="mb-2 text-cyan-300" />
                    <p className="text-sm font-medium">No pending referrals.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Main Content Grid - Adjusted to full width */}
        <div className="w-full">
          {/* Activity Column */}
          <div className="max-w-5xl space-y-5">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl overflow-hidden shadow-sm dark:shadow-[#1D2226]/50">
              <div className="p-5 border-b border-gray-100 dark:border-[#38434F] flex justify-between items-center">
                <h2 className="text-sm font-black text-black dark:text-white">Recent Activity</h2>
                <div className="text-[10px] font-bold text-gray-400 dark:text-[#B0B7BE] uppercase tracking-widest">REAL-TIME</div>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                {dashData?.rpLog?.length > 0 ? (
                  dashData.rpLog.map((log: any, i: number) => (
                    <div key={log.id || i} className="flex gap-4 p-5 items-start hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#1D2226] flex items-center justify-center border border-gray-100 dark:border-[#38434F]">
                          {log.reason?.includes('Posted') ? <Briefcase size={18} className="text-purple-600" /> : log.reason?.includes('Answering') || log.reason?.includes('Answered') ? <CheckCircle size={18} className="text-green-600" /> : log.reason?.includes('Approved') || log.reason?.includes('referral') ? <Handshake size={18} className="text-cyan-600" /> : <Star size={18} className="text-yellow-500" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-black dark:text-white truncate">{log.reason}</div>
                        <div className="text-[10px] text-gray-400 dark:text-[#B0B7BE] mt-0.5">Community Interaction</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-gray-400 dark:text-[#B0B7BE]">{timeAgo(log.created_at)}</div>
                        <div className="bg-purple-100/50 text-purple-700 rounded-full px-2 py-0.5 text-[9px] font-black mt-1 inline-block">
                          +{log.points} RP
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <BarChart3 size={32} className="mx-auto text-gray-300 dark:text-[#B0B7BE] mb-4 opacity-50" />
                    <p className="text-gray-400 dark:text-[#B0B7BE] font-bold">No recent activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div ref={groupRequestsSectionRef} className="mb-8 scroll-mt-8">
          <GroupJoinRequestsSection onCountChange={setPendingGroupRequests} />
        </div>

        {/* My Groups Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-black tracking-wider text-gray-400 dark:text-[#B0B7BE] uppercase">
                MY GROUPS
              </div>
              <span className="bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 text-[10px] font-black">
                {userGroups.length} created
              </span>
            </div>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-black hover:bg-purple-700 transition-colors"
            >
              <Plus size={12} />
              Create New Group
            </button>
          </div>

          <div className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl overflow-hidden">
            {groupsLoading ? (
              <div className="p-10 text-center text-gray-400 dark:text-[#B0B7BE] text-xs">Loading groups...</div>
            ) : userGroups.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                {userGroups.map((group) => (
                  <div key={group.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{group.name}</h3>
                          {group.is_private || group.scope === 'private' ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Lock size={10} />
                              <span className="text-xs">Private</span>
                            </span>
                          ) : group.scope === 'college' ? (
                            <span className="flex items-center gap-1 text-indigo-600">
                              <GraduationCap size={10} />
                              <span className="text-xs">College</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600">
                              <Globe size={10} />
                              <span className="text-xs">Public</span>
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-[#B0B7BE] text-xs mb-2 line-clamp-2">{group.description || 'No description'}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#B0B7BE]">
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            {group.member_count || 0} members
                          </span>
                          <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => window.open(`/community/c/${group.college?.name?.toLowerCase().replace(/\s+/g, '-') || 'college'}/group/${group.slug}`, '_blank')}
                          className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="View Group"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => deleteGroup(group.slug)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users size={32} className="mx-auto text-gray-300 dark:text-[#B0B7BE] mb-4 opacity-50" />
                <p className="text-gray-400 dark:text-[#B0B7BE] text-sm">No groups created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* My Student Groups */}
        <MyGroupsList />
        
      </div>
    )}
    
        {/* Job Posting Modal */}
        {jobModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !jobFormLoading && setJobModalOpen(false)} />

            <div className="bg-white dark:bg-[#283036] rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 dark:border-[#38434F] flex justify-between items-center bg-gray-50/50 dark:bg-[#1D2226]/50">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase size={20} className="text-black dark:text-white" />
                    <h2 className="text-lg font-black text-black dark:text-white">Post a Job Opening</h2>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-[#B0B7BE] mt-1">Share opportunities and earn 20 Rise Points</p>
                </div>
                <button
                  onClick={() => setJobModalOpen(false)}
                  className="text-gray-400 dark:text-[#B0B7BE] hover:text-black dark:hover:text-white transition-colors"
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
                      <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Company Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Swiggy"
                        className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.company_name}
                        onChange={e => setJobFormData({ ...jobFormData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Job Role</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. SDE-1"
                        className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.role}
                        onChange={e => setJobFormData({ ...jobFormData, role: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Location & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Remote / Bangalore"
                        className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.location}
                        onChange={e => setJobFormData({ ...jobFormData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Job Type</label>
                      <select
                        className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
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
                    <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Job Link / Description</label>
                    <input
                      required
                      type="url"
                      placeholder="https://company.com/careers/job123"
                      className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      value={jobFormData.description}
                      onChange={e => setJobFormData({ ...jobFormData, description: e.target.value })}
                    />
                  </div>

                  {/* Expiry & Salary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={jobFormData.deadline}
                        onChange={e => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">Salary (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 12-15 LPA"
                        className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-200 dark:border-[#38434F] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
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
                      <span className="text-xs font-semibold text-gray-700 dark:text-[#B0B7BE]">Referral Available?</span>
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
                      <span className="text-xs font-semibold text-gray-700 dark:text-[#B0B7BE]">Set as Open/Active</span>
                    </label>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 dark:border-[#38434F] bg-gray-50/50 dark:bg-[#1D2226]/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="flex-1 bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl py-2.5 text-xs font-black text-gray-500 dark:text-[#B0B7BE] hover:bg-gray-100 dark:hover:bg-[#1D2226] transition-colors"
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

            <div className="bg-white dark:bg-[#283036] rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-fade">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#38434F]">
                <div className="flex items-center gap-2">
                  <Handshake size={20} className="text-black dark:text-white" />
                  <h2 className="text-lg font-black text-black dark:text-white">Review Referral</h2>
                </div>
                <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 dark:text-[#B0B7BE] hover:text-black dark:hover:text-white">✕</button>
              </div>

              <div className="p-8 text-center border-b border-gray-50 dark:border-[#38434F]">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-cyan-50 text-purple-600 text-2xl font-black flex items-center justify-center border-2 border-white dark:border-[#38434F] shadow-xl mx-auto mb-4">
                  {selectedReferral.requester?.full_name?.[0]}
                </div>
                <h3 className="text-xl font-black text-black dark:text-white">{selectedReferral.requester?.full_name}</h3>
                <p className="text-sm text-gray-400 dark:text-[#B0B7BE] font-semibold">{selectedReferral.requester?.unique_id}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#B0B7BE] font-bold uppercase tracking-widest mt-1">
                  {selectedReferral.requester?.colleges?.[0]?.name || selectedReferral.requester?.colleges?.name}
                </p>

                <div className="mt-6 inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-xs font-black">
                  <Briefcase size={14} />
                  Seeking: {selectedReferral.job?.role} @ {selectedReferral.job?.company_name}
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 dark:bg-[#1D2226]/50">
                <p className="text-xs text-center text-gray-400 dark:text-[#B0B7BE] leading-relaxed mb-6">
                  By confirming, you agree to refer this student for the opening. Their profile details will be shared with you for the formal process.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="flex-1 bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl py-3 text-sm font-black text-gray-400 dark:text-[#B0B7BE] hover:bg-gray-100 dark:hover:bg-[#1D2226] transition-colors"
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
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={() => {
          setShowCreateGroupModal(false)
          // Refresh or navigate as needed
        }}
        currentUser={{
          id: dashData?.user?.id || '',
          is_premium: dashData?.user?.is_premium || false,
          role: 'senior',
          college_id: dashData?.user?.college_id || ''
        }}
        communityId={userCollegeCommunityId || undefined}  // Pass as optional prop
      />

      <MyGroupsModal
        isOpen={showMyGroupsModal}
        onClose={() => setShowMyGroupsModal(false)}
        currentUser={{
          id: dashData?.user?.id || '',
          is_premium: dashData?.user?.is_premium || false,
          role: 'senior',
          college_id: dashData?.user?.college_id || ''
        }}
      />
      
    </div>
  );
}
