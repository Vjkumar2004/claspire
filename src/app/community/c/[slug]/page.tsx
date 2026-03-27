'use client'
import React, { useState, useEffect, useMemo, cloneElement, ReactElement, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import {
  ChevronRight, Users, Star, MapPin, MessageSquare,
  Briefcase, Video, Lock, Shield,
  Clock, TrendingUp, Calendar,
  Building, Globe, Award, Activity, Target, Zap,
  Info, X, GraduationCap, MessageCircle, Crown,
  CheckCircle, Search, MoreHorizontal,
  Share2, ArrowUp, MessageSquarePlus, LayoutGrid, DollarSign,
  Sparkles, ArrowRight
} from 'lucide-react'
import PostModal from '@/components/PostModal'
import CreateGroupModal from '@/components/CreateGroupModal'

function CommunityPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const shouldCreate = searchParams.get('create') === 'true'
  const [slug, setSlug] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('feed')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [referralConfirmOpen, setReferralConfirmOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [studentGroups, setStudentGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)

  useEffect(() => {
    const getSlug = async () => {
      const { slug: resolvedSlug } = await params
      setSlug(resolvedSlug)
    }
    getSlug()
  }, [params])

  useEffect(() => {
    if (slug) {
      fetchCommunity()
      fetchCurrentUser()
      fetchStudentGroups()
    }
  }, [slug])

  useEffect(() => {
    if (data) {
      setHasJoined(data.isJoined || data.isAlreadyMember || false)
    }
  }, [data])

  // Handle auto-open post modal
  useEffect(() => {
    if (shouldCreate && data?.canPost) {
      setShowPostModal(true)
      // Clean up URL to prevent reopening on refresh
      const newPath = window.location.pathname
      window.history.replaceState({}, '', newPath)
    }
  }, [shouldCreate, data?.canPost, pathname])

  async function fetchCommunity() {
    try {
      const res = await fetch(`/api/community/${slug}`, { cache: 'no-store' })
      if (!res.ok) {
        router.push('/community')
        return
      }
      const json = await res.json()
      setData(json)
      setHasJoined(json.isJoined || false)
    } catch {
      router.push('/community')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setCurrentUser(json.user)
      }
    } catch {
      // User not logged in
    }
  }

  async function fetchStudentGroups() {
    try {
      const res = await fetch(`/api/community/${slug}/student-groups`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setStudentGroups(json.groups || [])
      }
    } catch {
      console.error('Failed to fetch student groups')
    } finally {
      setGroupsLoading(false)
    }
  }

  async function fetchCommunityMembers() {
    if (!slug) return
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/community/${slug}/members`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setMembers(json.members || [])
      }
    } catch {
      console.error('Failed to fetch community members')
    } finally {
      setMembersLoading(false)
    }
  }

  const handleRequestReferral = async () => {
    if (!selectedJob || !currentUser) return
    setRequestLoading(true)
    try {
      const res = await fetch('/api/jobs/request-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          seniorId: selectedJob.posted_by
        })
      })
      const json = await res.json()
      if (res.ok) {
        alert('Referral request sent! Your profile has been shared with the senior. 🚀')
        setReferralConfirmOpen(false)
      } else {
        alert(json.error || 'Failed to request referral')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setRequestLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (joining) return
    setJoining(true)

    try {
      const res = await fetch(`/api/community/${slug}/join`, { method: 'POST' })
      const result = await res.json()

      if (result.success) {
        setHasJoined(true)
        // Refresh community data to update member count
        await fetchCommunity()
      } else {
        alert(result.error || 'Failed to join')
        console.error(result.error)
      }
    } catch (err) {
      console.error('Join error:', err)
    } finally {
      setJoining(false)
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

  const handlePostSuccess = () => {
    fetchCommunity()
    // Set flag to refresh profile page if user came from there
    localStorage.setItem('profile_refresh_needed', 'true')
  }

  // No auto-open effect here anymore

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'doubt': return { label: 'Doubt', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', highlight: '#3B82F6' }
      case 'discussion': return { label: 'Discussion', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', highlight: '#8B5CF6' }
      case 'experience': return { label: 'Experience', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', highlight: '#F59E0B' }
      case 'referral_hunt': return { label: 'Referral', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', highlight: '#10B981' }
      case 'resource': return { label: 'Resource', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', highlight: '#EF4444' }
      default: return { label: type, color: '#64748B', bg: '#F8FAFC', border: '#F1F5F9', highlight: '#94A3B8' }
    }
  }

  const LockScreen = ({ title, description, userRole, ctaText, ctaAction }: any) => (
    <div className="glass-card animate-fade" style={{ borderRadius: 24, padding: '80px 32px', textAlign: 'center', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', boxShadow: '0 20px 40px rgba(124, 58, 237, 0.2)' }}>
        <Lock size={40} />
      </div>
      <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>{title}</h3>
      <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 400, marginInline: 'auto' }}>{description}</p>
      <button onClick={ctaAction} style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', color: 'white', border: 'none', borderRadius: 16, padding: '16px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        {ctaText}
      </button>
    </div>
  )

  const topContributors = useMemo(() => {
    if (!data?.posts) return []
    const map: any = {}
    data.posts.forEach((p: any) => {
      const id = p.users?.id || 'u'
      if (!map[id]) map[id] = {
        name: p.users?.full_name || 'User',
        count: 0,
        role: p.users?.role || 'student',
        avatar_url: p.users?.avatar_url
      }
      map[id].count++
    })
    return Object.entries(map).sort((a: any, b: any) => b[1].count - a[1].count).slice(0, 5)
  }, [data?.posts])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FE' }}>
      <div style={{ width: 44, height: 44, border: '4px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!data) return null

  const {
    community,
    verifiedJuniors = 0,
    verifiedSeniors = 0,
    posts = [],
    jobs = [],
    webinars = [],
    userRole,
    canPost,
    canViewJobs,
    canViewWebinars,
    isAlreadyMember,
    totalMembers = 0
  } = data || {}

  // Auto-open logic moved to top

  const tabs = [
    { id: 'feed', label: 'Community Feed', icon: <LayoutGrid size={15} />, locked: false },
    { id: 'jobs', label: 'Internal Referrals', icon: <Briefcase size={15} />, locked: !canViewJobs },
    { id: 'webinars', label: 'Academy Events', icon: <Video size={15} />, locked: !canViewWebinars }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FE', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03); }
        .tab-active { color: #7C3AED !important; font-weight: 800 !important; }
        .tab-active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 32px; height: 3px; background: #7C3AED; border-radius: 10px 10px 0 0; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .post-card-hover:hover { transform: translateY(-4px); border-color: rgba(124, 58, 237, 0.3) !important; box-shadow: 0 20px 40px rgba(124, 58, 237, 0.05) !important; }
        .stat-card-hover:hover { background: #FFFFFF !important; transform: scale(1.02); box-shadow: 0 10px 30px rgba(0,0,0,0.03); }

        @media (max-width: 768px) {
          html, body { 
            overflow-x: hidden !important; 
            max-width: 100vw !important;
            width: 100vw !important;
          }
          * {
            box-sizing: border-box !important;
          }
          .main-layout { 
            grid-template-columns: 1fr !important; 
            gap: 0 !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            max-width: 100vw !important; 
            width: 100vw !important;
            overflow-x: hidden !important;
          }
          .right-sidebar { display: none !important; }
          .hero-content { flex-direction: column !important; gap: 32px !important; text-align: center !important; }
          .hero-stats { justify-content: center !important; }
          .hero-actions { justify-content: center !important; flex-wrap: wrap !important; }
          .mobile-fab { display: block !important; }
          .hero-logo-box { width: 100px !important; height: 100px !important; }
          .tab-container { overflow-x: auto !important; padding: 0 !important; }
          .tab-btn { padding: 16px 20px !important; white-space: nowrap !important; }
          .post-card { padding: 16px !important; border-radius: 20px !important; margin: 0 16px 16px !important; }
          .desktop-only-btn { display: none !important; }
          .animate-fade { 
            width: 100vw !important; 
            padding: 0 !important;
            margin: 0 !important;
            overflow-x: hidden !important;
          }
        }
      `}} />

      {/* ── HIGH-FIDELITY HERO ── */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0A0A0A 0%, #171717 100%)', padding: '60px 20px 48px', overflow: 'hidden' }}>
        {/* Animated Background Mesh */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
            <span onClick={() => router.push('/community')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'}>Communities</span>
            <ChevronRight size={14} className="opacity-40" />
            <span style={{ color: 'white' }}>{community.slug} hub</span>
          </div>

          <div className="hero-content" style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
            {/* College Logo/Identity */}
            <div className="hero-logo-box" style={{ width: 120, height: 120, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', borderRadius: 32, padding: 8, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', flexShrink: 0 }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: (community.slug === 'aaacet' || community.slug === 'vvvclg' || community.slug === 'vvv' || community.slug === 'anjac' || community.slug === 'sfr' || community.slug === 'skc' || community.slug === 'kamaraj' || community.slug === 'agpc') ? 'white' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                borderRadius: 24,
                padding: (community.slug === 'aaacet' || community.slug === 'vvvclg' || community.slug === 'vvv' || community.slug === 'anjac' || community.slug === 'sfr' || community.slug === 'skc' || community.slug === 'kamaraj' || community.slug === 'agpc') ? 10 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: 'white',
                fontSize: 48,
                fontWeight: 800
              }}>
                {community.slug === 'aaacet' ? (
                  <img src="/aaaclg_logo.jpg" alt="AAACET" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (community.slug === 'vvvclg' || community.slug === 'vvv') ? (
                  <img src="/vvvclogo.png" alt="VVV" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : community.slug === 'anjac' ? (
                  <img src="/anjac.jpg" alt="ANJAC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : community.slug === 'sfr' ? (
                  <img src="/sfr.jpg" alt="SFR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : community.slug === 'skc' ? (
                  <img src="/skc.jpg" alt="SKC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : community.slug === 'kamaraj' ? (
                  <img src="/kamaraj.jpg" alt="Kamaraj" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : community.slug === 'agpc' ? (
                  <img src="/agpc.jpg" alt="AGPC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  community.colleges?.short_name?.[0] || community.slug?.[0]?.toUpperCase() || 'C'
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 320 }}>
              <div className="hero-stats" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA', padding: '6px 16px', borderRadius: 100, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(124, 58, 237, 0.3)' }}>Official Hub</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} />
                  {(totalMembers || community.member_count || (verifiedJuniors + verifiedSeniors))} Members
                </div>
              </div>

              <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontFamily: 'Instrument Serif, serif', color: 'white', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {community.colleges?.name}
              </h1>

              <div className="hero-actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setShowDetailsModal(true)} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 20px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <Info size={14} /> Community Insight
                </button>
                <button onClick={() => { fetchCommunityMembers(); setShowMembersModal(true) }} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 20px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <Users size={14} /> View Members
                </button>
                {userRole === 'guest' ? (
                  <button
                    onClick={() => router.push('/signup')}
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 14,
                      padding: '11px 24px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Join Free →
                  </button>
                ) : (userRole === 'own_junior' || userRole === 'own_senior') ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 20px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6EE7B7'
                  }}>
                    <CheckCircle size={16} />
                    {userRole === 'own_senior' ? 'Verified Senior ✓' : 'Verified Member ✓'}
                  </div>
                ) : userRole === 'other_college' ? (
                  hasJoined ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(124, 58, 237, 0.15)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      padding: '10px 20px',
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#C4B5FD'
                    }}>
                      <CheckCircle size={16} /> Joined Network ✓
                    </div>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: joining ? 'rgba(255,255,255,0.1)' : 'white',
                        color: '#4C1D95',
                        border: 'none',
                        padding: '11px 24px',
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: joining ? 'wait' : 'pointer',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s',
                        opacity: joining ? 0.7 : 1
                      }}
                      onMouseEnter={e => !joining && (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => !joining && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {joining ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid #4C1D95', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Joining...
                        </>
                      ) : (
                        'Join Network →'
                      )}
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY NAVIGATION ── */}
      <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.12)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="tab-container" style={{ display: 'flex' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} disabled={tab.locked} className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`} style={{ padding: '16px 20px', background: 'none', border: 'none', color: tab.locked ? '#CBD5E1' : '#64748B', fontSize: 13, fontWeight: 700, cursor: tab.locked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', transition: 'all 0.2s' }}>
                {tab.icon} {tab.label} {tab.locked && <Lock size={12} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PREMIUM CONTENT GRID ── */}
      <div className="main-layout" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32 }}>

        {/* Left Section (Dynamic Content) */}
        <div className="animate-fade">
          {activeTab === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {posts.length > 0 ? (
                posts.map((post: any) => {
                  const s = getTypeStyle(post.type)
                  return (
                    <div key={post.id} onClick={() => router.push(`/community/c/${community.slug}/p/${post.id}`)} className="glass-card post-card post-card-hover" style={{ padding: 20, borderRadius: 24, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #F1F5F9' }}>
                      {/* Interaction Bar Top */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/u/${post.users?.unique_id}`);
                            }}
                            style={{
                              width: 36, height: 36,
                              borderRadius: 10,
                              background: post.users?.avatar_url
                                ? 'transparent'
                                : (post.users?.role === 'senior' ? 'linear-gradient(135deg, #10B981, #34D399)' : 'linear-gradient(135deg, #7C3AED, #06B6D4)'),
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                              overflow: 'hidden',
                              cursor: 'pointer'
                            }}
                          >
                            {post.users?.avatar_url ? (
                              <img src={post.users.avatar_url} alt={post.users.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              post.users?.full_name?.[0]
                            )}
                          </div>
                          <div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/u/${post.users?.unique_id}`);
                              }}
                              style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                              className="hover:text-purple-600 transition-colors"
                            >
                              {post.users?.full_name}
                              {post.users?.role === 'senior' && <Crown size={12} color="#F59E0B" />}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 100, border: `1px solid ${s.border}`, textTransform: 'uppercase' }}>{s.label}</span>
                              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} /> {timeAgo(post.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}><MoreHorizontal size={18} /></button>
                      </div>

                      {/* Content Section */}
                      <div>
                        {post.title && (
                          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 10, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{post.title}</h2>
                        )}
                        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                        {post.image_url && (
                          <div style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            marginBottom: 20,
                            border: '1px solid #F1F5F9'
                          }}>
                            <img
                              src={post.image_url}
                              alt="Post"
                              style={{
                                width: '100%',
                                maxHeight: 320,
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onClick={e => {
                                e.stopPropagation()
                                window.open(post.image_url, '_blank')
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Engagement Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 11, fontWeight: 700 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={13} color="#7C3AED" /></div>
                          {post.upvote_count} <span style={{ fontWeight: 600, opacity: 0.6, fontSize: 10 }}>upvotes</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 11, fontWeight: 700 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquarePlus size={13} color="#0D9488" /></div>
                          {post.answer_count} <span style={{ fontWeight: 600, opacity: 0.6, fontSize: 10 }}>responses</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 11, fontWeight: 700 }}>
                          <Activity size={12} className="opacity-40" />
                          {post.view_count || 0} <span style={{ fontWeight: 600, opacity: 0.6, fontSize: 10 }}>reads</span>
                        </div>
                        <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Share2 size={15} /></button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '100px 32px', background: 'white', borderRadius: 32, border: '1px solid #F1F5F9' }}>
                  <div style={{ width: 80, height: 80, background: '#F5F3FF', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#7C3AED' }}>
                    <MessageSquare size={40} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Silent Campus</h3>
                  <p style={{ color: '#64748B', maxWidth: 300, margin: '0 auto', fontSize: 15, lineHeight: 1.5 }}>Be the visionary to spark the first conversation in your university community.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {canViewJobs ? (
                <>
                  {jobs && jobs.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                      {jobs.map((job: any) => (
                        <div key={job.id} className="glass-card post-card-hover" style={{ padding: 24, borderRadius: 28, background: 'white', border: '1px solid #F1F5F9', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div style={{ width: 48, height: 48, background: '#F8FAFC', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px solid #F1F5F9' }}>
                              🏢
                            </div>
                            {job.referral_available && (
                              <div style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: 100, fontSize: 10, fontWeight: 800, border: '1px solid #A7F3D0', textTransform: 'uppercase' }}>
                                Referral Active
                              </div>
                            )}
                          </div>

                          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{job.role}</h3>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#64748B', marginBottom: 16 }}>{job.company_name}</p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F8FAFC', padding: '4px 10px', borderRadius: 8 }}>
                              <MapPin size={12} /> {job.location || 'Remote'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F8FAFC', padding: '4px 10px', borderRadius: 8 }}>
                              <Clock size={12} /> {job.job_type?.replace('_', ' ')}
                            </div>
                            {job.salary_range && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F8FAFC', padding: '4px 10px', borderRadius: 8 }}>
                                <DollarSign size={12} /> {job.salary_range}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <a
                              href={job.description}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ flex: 1, textAlign: 'center', background: '#F5F3FF', color: '#7C3AED', textDecoration: 'none', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 800, transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
                              onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                            >
                              View Details
                            </a>
                            <button
                              onClick={() => {
                                if (userRole === 'other_college') {
                                  setShowPremiumModal(true)
                                } else {
                                  setSelectedJob(job)
                                  setReferralConfirmOpen(true)
                                }
                              }}
                              style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: 14,
                                fontSize: 13,
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 8px 16px rgba(124, 58, 237, 0.15)',
                                transition: 'transform 0.2s',
                                display: currentUser?.id === job.posted_by ? 'none' : 'block'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                              Get Referral
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '100px 32px', background: 'white', borderRadius: 32, border: '1px solid #F1F5F9' }}>
                      <div style={{ width: 80, height: 80, background: '#ECFDF5', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10B981' }}>
                        <Briefcase size={40} />
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Seeking Opportunities</h3>
                      <p style={{ color: '#64748B', maxWidth: 300, margin: '0 auto', fontSize: 15, lineHeight: 1.5 }}>Internal referrals from seniors and alumni will appear here once posted.</p>
                    </div>
                  )}
                </>
              ) : (
                <LockScreen title="Career Network Locked" description="Gain access to unlisted jobs and internships through internal referrals from your university seniors." userRole={userRole} ctaText="Verify my ID" ctaAction={() => router.push('/onboarding')} />
              )}
            </div>
          )}

          {activeTab === 'webinars' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {canViewWebinars ? (
                <div style={{ textAlign: 'center', padding: '100px 32px', background: 'white', borderRadius: 32, border: '1px solid #F1F5F9' }}>
                  <div style={{ width: 80, height: 80, background: '#FEF2F2', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                    <Video size={40} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Academy Live</h3>
                  <p style={{ color: '#64748B', maxWidth: 300, margin: '0 auto', fontSize: 15, lineHeight: 1.5 }}>Live expert sessions and alumni workshops are currently being curated for your campus.</p>
                </div>
              ) : (
                <LockScreen title="Claspire Academy Locked" description="Unlock live career masterclasses, alumni webinars, and doubt-clearing sessions." userRole={userRole} ctaText="Enter Academy" ctaAction={() => router.push('/onboarding')} />
              )}
            </div>
          )}

          {/* ── STUDENT GROUPS SECTION ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'Instrument Serif, serif' }}>Student Groups</h2>
                <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0' }}>Join student-created groups for focused discussions</p>
              </div>
              {currentUser && (
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Users size={16} />
                  Create Group
                </button>
              )}
            </div>

            {groupsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 24, border: '1px solid #F1F5F9', padding: 20 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: 12, animation: 'pulse 2s infinite' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: '60%', height: 16, background: '#F1F5F9', borderRadius: 8, marginBottom: 8, animation: 'pulse 2s infinite' }} />
                        <div style={{ width: '40%', height: 12, background: '#F1F5F9', borderRadius: 6, animation: 'pulse 2s infinite' }} />
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 12, background: '#F1F5F9', borderRadius: 6, marginBottom: 12, animation: 'pulse 2s infinite' }} />
                    <div style={{ width: '80%', height: 12, background: '#F1F5F9', borderRadius: 6, animation: 'pulse 2s infinite' }} />
                  </div>
                ))}
              </div>
            ) : studentGroups.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '16px'
              }}>
                {studentGroups.map((group: any) => (
                  <div key={group.id} className="glass-card post-card-hover" style={{ 
                    padding: '16px', 
                    borderRadius: '20px', 
                    background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)', 
                    border: '1px solid #F1F5F9', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    cursor: 'pointer'
                  }} onClick={() => router.push(`/community/c/${slug}/${group.slug}`)}>
                    {/* Creator Profile Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 800,
                          overflow: 'hidden'
                        }}>
                          {group.creator?.avatar_url ? (
                            <img 
                              src={group.creator.avatar_url} 
                              alt={group.creator.full_name || 'Creator'} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            group.creator?.full_name?.[0] || 'C'
                          )}
                        </div>
                        {group.creator?.role === 'senior' && (
                          <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '14px',
                            height: '14px',
                            background: '#F59E0B',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Crown size={8} color="white" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <p style={{ 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            color: '#0F172A', 
                            margin: 0, 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis'
                          }}>
                            {group.creator?.full_name || 'Group Creator'}
                          </p>
                          <span style={{ 
                            fontSize: '9px', 
                            background: group.creator?.role === 'senior' ? '#FEF3C7' : '#F5F3FF', 
                            color: group.creator?.role === 'senior' ? '#D97706' : '#7C3AED',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
                            {group.creator?.role || 'student'}
                          </span>
                        </div>
                        <p style={{ 
                          fontSize: '10px', 
                          color: '#64748B', 
                          margin: 0
                        }}>
                          Created {new Date(group.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Group Content */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: 800, 
                          color: '#0F172A', 
                          margin: 0, 
                          lineHeight: 1.2,
                          flex: 1
                        }}>
                          {group.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {group.is_private ? (
                            <Lock size={14} style={{ color: '#D97706' }} />
                          ) : (
                            <Globe size={14} style={{ color: '#10B981' }} />
                          )}
                        </div>
                      </div>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#475569', 
                        lineHeight: 1.4, 
                        margin: 0, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden'
                      }}>
                        {group.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Stats and Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={12} />
                          <span style={{ fontWeight: 500 }}>{group.member_count} members</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {group.is_private && (
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '3px', 
                            fontSize: '9px', 
                            color: '#D97706', 
                            background: '#FEF3C7', 
                            padding: '3px 6px', 
                            borderRadius: '6px', 
                            fontWeight: 600
                          }}>
                            <Lock size={8} /> Private
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Join Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/community/c/${slug}/${group.slug}`)
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                        color: 'white',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.3)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.2)'
                      }}
                    >
                      Join Group
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 32px', background: 'white', borderRadius: 32, border: '1px solid #F1F5F9' }}>
                <div style={{ width: 80, height: 80, background: '#F5F3FF', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#7C3AED' }}>
                  <Users size={40} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>No Groups Yet</h3>
                <p style={{ color: '#64748B', maxWidth: 300, margin: '0 auto 24px', fontSize: 15, lineHeight: 1.5 }}>
                  Be the first to create a student group in your community!
                </p>
                {currentUser ? (
                  <button
                    onClick={() => router.push('/dashboard?activeTab=community')}
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 16,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)',
                      transition: 'transform 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Users size={16} />
                    Create First Group
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/signup')}
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 16,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Sign Up to Create Groups
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PREMIUM SIDEBAR ── */}
        <div className="right-sidebar" style={{ position: 'sticky', top: 90, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stats Insight Card */}
          <div className="glass-card" style={{ padding: 16, borderRadius: 20, border: '1px solid rgba(124, 58, 237, 0.12)' }}>
            <h4 style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={11} /> Analytics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Seniors', val: verifiedSeniors, icon: <Crown size={16} color="#7C3AED" />, bg: '#F5F3FF' },
                { label: 'Network', val: totalMembers, icon: <Users size={16} color="#06B6D4" />, bg: '#ECFEFF' },
                { label: 'Debates', val: posts?.length || 0, icon: <MessageCircle size={16} color="#F59E0B" />, bg: '#FFFBEB' },
                { label: 'Referrals', val: jobs?.length || 0, icon: <Target size={16} color="#10B981" />, bg: '#F0FDF4' }
              ].map((s, i) => (
                <div key={i} className="stat-card-hover" style={{ padding: 12, borderRadius: 14, background: '#F8FAFC', border: '1px solid #F1F5F9', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{cloneElement(s.icon as ReactElement<any>, { size: 12 })}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Instrument Serif, serif' }}>{s.val}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#64748B', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="glass-card" style={{ padding: 28, borderRadius: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top Contributors</h4>
              <div style={{ background: '#FFFBEB', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} fill="#D97706" /> Weekly
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topContributors.length > 0 ? topContributors.map(([id, c]: any, i) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px', borderRadius: 16, background: i === 0 ? 'linear-gradient(to right, #F5F3FF, transparent)' : 'transparent' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 14,
                      background: c.avatar_url
                        ? 'transparent'
                        : (c.role === 'senior' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #7C3AED, #4C1D95)'),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      overflow: 'hidden'
                    }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        c.name[0]
                      )}
                    </div>
                    {i < 3 && <div style={{ position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, border: '1px solid #F1F5F9' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{c.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{c.count} platform points</div>
                  </div>
                  {i === 0 && <Award size={18} color="#F59E0B" />}
                </div>
              )) : <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Competition just started!</p>}
            </div>
          </div>

          {/* Guidelines Card */}
          <div className="glass-card" style={{ padding: 28, borderRadius: 32, background: 'linear-gradient(to bottom, #FFFFFF, #F8FAFC)' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} color="#EF4444" /> Community Guidelines
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { t: 'Professional Constructiveness', d: 'Ask doubts that help everyone learn.' },
                { t: 'Networking Privacy', d: 'Connect via platform; no personal metadata.' },
                { t: 'Verified Guidance', d: 'Follow advice from verified seniors only.' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED', opacity: 0.3 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{r.t}</div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginTop: 4 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showDetailsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade" style={{ background: 'white', width: '100%', maxWidth: 440, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', padding: '24px 24px 32px', position: 'relative', color: 'white' }}>
              <button onClick={() => setShowDetailsModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
              <div style={{ width: 48, height: 48, background: 'white', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
                <img src="/logo.jpg" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontSize: 24, fontFamily: 'Instrument Serif, serif', fontWeight: 400, margin: 0 }}>{community.colleges?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, opacity: 0.7, fontSize: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> {community.colleges?.city}, {community.colleges?.state}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={16} /> Official Campus c/{slug}</span>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>STATUS</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}><Award size={14} color="#10B981" /> Verified</div>
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>MEMBERS</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{(totalMembers > 0 ? totalMembers : (verifiedJuniors + verifiedSeniors))} Peers</div>
                </div>
              </div>
              <div style={{ background: '#F5F3FF', borderRadius: 16, padding: 16, border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Building size={14} color="#7C3AED" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Objectives</span>
                </div>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  The exclusive digital forum for {community.colleges?.name}. Designed for high-impact professional networking and real-time guidance.
                </p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} style={{ width: '100%', marginTop: 24, background: '#0F172A', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowPremiumModal(false)}
          />
          <div style={{ position: 'relative', background: 'white', width: '100%', maxWidth: 480, borderRadius: 32, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', padding: '40px 32px', textAlign: 'center', position: 'relative', color: 'white' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, color: 'rgba(255,255,255,0.1)' }}>
                <Globe size={120} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 100, marginBottom: 24 }}>
                  <Sparkles size={14} className="text-cyan-400" />
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Network</span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 8 }}>Unlock Global Access</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
                  Get referrals from seniors across all colleges in the Claspire network.
                </p>
              </div>
            </div>

            <div style={{ padding: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {[
                  'Unlimited referrals from 10,000+ seniors',
                  'Direct messaging with verified experts',
                  'Access to exclusive premium job pool',
                  'Advanced profile boost for recruiters'
                ].map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 22, height: 22, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={14} color="#10B981" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => router.push('/pricing')}
                  style={{ width: '100%', background: '#0F172A', color: 'white', border: 'none', padding: '16px', borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Upgrade to Premium <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  style={{ width: '100%', background: 'none', border: 'none', color: '#94A3B8', padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        communityId={community.id}
        communitySlug={community.slug}
        onSuccess={handlePostSuccess}
        userRole={userRole}
      />

      {/* Referral Confirmation Modal */}
      {referralConfirmOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade" style={{ background: 'white', width: '100%', maxWidth: 400, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7C3AED' }}>
              <Target size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Confirm Referral Request</h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
              Requesting a referral for <b>{selectedJob?.role}</b> at <b>{selectedJob?.company_name}</b>.
              Your profile will be shared with the senior for review.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setReferralConfirmOpen(false)}
                disabled={requestLoading}
                style={{ flex: 1, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReferral}
                disabled={requestLoading}
                style={{ flex: 2, background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: 'white', border: 'none', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: requestLoading ? 0.7 : 1 }}
              >
                {requestLoading ? 'Sending...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade" style={{ background: 'white', width: '100%', maxWidth: 600, maxHeight: '80vh', borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 4 }}>Community Members</h3>
                  <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{members.length} total members</p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>
              {membersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#F8FAFC', borderRadius: 12 }}>
                      <div style={{ width: 40, height: 40, background: '#E2E8F0', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: '60%', height: 12, background: '#E2E8F0', borderRadius: 6, marginBottom: 6, animation: 'pulse 2s infinite' }} />
                        <div style={{ width: '40%', height: 10, background: '#E2E8F0', borderRadius: 6, animation: 'pulse 2s infinite' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Seniors Section */}
                  {members.filter(m => m.role === 'senior').length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Crown size={16} style={{ color: '#F59E0B' }} />
                        Seniors ({members.filter(m => m.role === 'senior').length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {members.filter(m => m.role === 'senior').map((member: any) => (
                          <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: member.avatar_url ? 'transparent' : 'linear-gradient(135deg, #10B981, #34D399)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: 14,
                              fontWeight: 800,
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                member.full_name?.[0] || 'S'
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {member.full_name}
                                </p>
                                {member.is_verified && (
                                  <div style={{ width: 16, height: 16, background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>✓</span>
                                  </div>
                                )}
                              </div>
                              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                                {member.department || 'Computer Science'} • {member.passout_year || '2024'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Juniors Section */}
                  {members.filter(m => m.role === 'student').length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GraduationCap size={16} style={{ color: '#7C3AED' }} />
                        Juniors ({members.filter(m => m.role === 'student').length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {members.filter(m => m.role === 'student').map((member: any) => (
                          <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: member.avatar_url ? 'transparent' : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: 14,
                              fontWeight: 800,
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                member.full_name?.[0] || 'J'
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {member.full_name}
                                </p>
                                {member.is_verified && (
                                  <div style={{ width: 16, height: 16, background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>✓</span>
                                  </div>
                                )}
                              </div>
                              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                                {member.department || 'Computer Science'} • {member.passout_year || '2025'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {members.length === 0 && !membersLoading && (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Users size={48} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
                      <p style={{ fontSize: 16, color: '#64748B', margin: 0 }}>No members found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && currentUser && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            setShowCreateGroupModal(false)
            fetchStudentGroups() // Refresh the groups list
          }}
          currentUser={{
            id: currentUser.id,
            is_premium: currentUser.is_premium || false,
            role: currentUser.role || 'student',
            college_id: currentUser.college_id
          }}
          communityId={data?.community?.college_id}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1024px) {
          .main-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .sidebar-desktop { display: none !important; }
          .mobile-fab { display: flex !important; }
        }
      `}} />
    </div>
  )
}

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F9FE'
      }}>
        <div style={{
          width: 44,
          height: 44,
          border: '4px solid #E2E8F0',
          borderTopColor: '#7C3AED',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <CommunityPageContent params={params} />
    </Suspense>
  )
}
