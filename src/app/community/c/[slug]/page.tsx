'use client'
import React, { useState, useEffect, useMemo, cloneElement, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRight, Users, Star, MapPin, MessageSquare, 
  Briefcase, Video, Lock, Plus, Shield, 
  Clock, TrendingUp, Calendar,
  Building, Globe, Award, Activity, Target, Zap,
  Info, X, GraduationCap, MessageCircle, Crown,
  CheckCircle, Search, TrendingDown, MoreHorizontal,
  Share2, ArrowUp, MessageSquarePlus, Heart, LayoutGrid
} from 'lucide-react'
import PostModal from '@/components/PostModal'

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('feed')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)

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
    }
  }, [slug])

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`/api/community/${slug}`)
      if (!res.ok) {
        router.push('/community')
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      router.push('/community')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const json = await res.json()
        setCurrentUser(json.user)
      }
    } catch {
      // User not logged in
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

  const getTypeStyle = (type: string) => {
    switch(type) {
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
      if(!map[id]) map[id] = { name: p.users?.full_name || 'User', count: 0, role: p.users?.role || 'student' }
      map[id].count++
    })
    return Object.entries(map).sort((a:any, b:any) => b[1].count - a[1].count).slice(0, 5)
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
    isAlreadyMember 
  } = data || {}

  const tabs = [
    { id: 'feed', label: 'Community Feed', icon: <LayoutGrid size={15} />, locked: false },
    { id: 'jobs', label: 'Internal Referrals', icon: <Briefcase size={15} />, locked: !canViewJobs },
    { id: 'webinars', label: 'Academy Events', icon: <Video size={15} />, locked: !canViewWebinars }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FE', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03); }
        .tab-active { color: #7C3AED !important; font-weight: 800 !important; }
        .tab-active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 32px; height: 3px; background: #7C3AED; border-radius: 10px 10px 0 0; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .post-card-hover:hover { transform: translateY(-4px); border-color: rgba(124, 58, 237, 0.3) !important; box-shadow: 0 20px 40px rgba(124, 58, 237, 0.05) !important; }
        .stat-card-hover:hover { background: #FFFFFF !important; transform: scale(1.02); box-shadow: 0 10px 30px rgba(0,0,0,0.03); }

        @media (max-width: 768px) {
          .main-layout { grid-template-columns: 1fr !important; gap: 24px !important; margin: 24px auto !important; }
          .right-sidebar { display: none !important; }
          .hero-content { flex-direction: column !important; gap: 32px !important; text-align: center !important; }
          .hero-stats { justify-content: center !important; }
          .hero-actions { justify-content: center !important; flex-wrap: wrap !important; }
          .mobile-fab { display: block !important; }
          .hero-logo-box { width: 100px !important; height: 100px !important; }
          .tab-container { overflow-x: auto !important; padding: 0 !important; }
          .tab-btn { padding: 16px 20px !important; white-space: nowrap !important; }
          .post-card { padding: 16px !important; border-radius: 20px !important; }
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
              <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: 24, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/logo.jpg" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 320 }}>
              <div className="hero-stats" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA', padding: '6px 16px', borderRadius: 100, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(124, 58, 237, 0.3)' }}>Official Hub</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 13, fontWeight: 600 }}>
                   <div style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} />
                   {verifiedJuniors + verifiedSeniors} Members
                </div>
              </div>
              
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontFamily: 'Instrument Serif, serif', color: 'white', margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {community.colleges?.name}
              </h1>

              <div className="hero-actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setShowDetailsModal(true)} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 20px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <Info size={14} /> Community Insight
                </button>
                {!isAlreadyMember && userRole !== 'guest' ? (
                  <button style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: 'white', border: 'none', padding: '11px 24px', borderRadius: 14, fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    Join Network
                  </button>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={18} color="#10B981" /> Verified Member
                  </div>
                )}
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
          {canPost && activeTab === 'feed' && (
            <button onClick={() => setShowPostModal(true)} style={{ background: '#7C3AED', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>
              <Plus size={15} /> Start Discussion
            </button>
          )}
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
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: post.users?.role === 'senior' ? 'linear-gradient(135deg, #10B981, #34D399)' : 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                            {post.users?.full_name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  <div style={{ textAlign: 'center', padding: '100px 32px', background: 'white', borderRadius: 32, border: '1px solid #F1F5F9' }}>
                    <div style={{ width: 80, height: 80, background: '#ECFDF5', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10B981' }}>
                      <Briefcase size={40} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Seeking Opportunities</h3>
                    <p style={{ color: '#64748B', maxWidth: 300, margin: '0 auto', fontSize: 15, lineHeight: 1.5 }}>Internal referrals from seniors and alumni will appear here once posted.</p>
                  </div>
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
                { label: 'Students', val: verifiedJuniors, icon: <GraduationCap size={16} color="#06B6D4" />, bg: '#ECFEFF' },
                { label: 'Debates', val: posts?.length || 0, icon: <MessageCircle size={16} color="#F59E0B" />, bg: '#FFFBEB' },
                { label: 'Referrals', val: jobs?.length || 0, icon: <Target size={16} color="#10B981" />, bg: '#F0FDF4' }
              ].map((s, i) => (
                <div key={i} className="stat-card-hover" style={{ padding: 12, borderRadius: 14, background: '#F8FAFC', border: '1px solid #F1F5F9', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                   <div style={{ width: 28, height: 28, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{cloneElement(s.icon as ReactElement, { size: 12 })}</div>
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
                      <div style={{ width: 40, height: 40, borderRadius: 14, background: c.role === 'senior' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }}>
                        {c.name[0]}
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
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED', opacity: 0.3 }}>{i+1}</div>
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
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{verifiedJuniors + verifiedSeniors}+ Peers</div>
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

      {/* Floating Action Mobile */}
      <div className="mobile-fab" style={{ position: 'fixed', bottom: 32, right: 24, zIndex: 900, display: 'none' }}>
        <button onClick={() => setShowPostModal(true)} style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(124, 58, 237, 0.4)', cursor: 'pointer' }}>
          <Plus size={24} />
        </button>
      </div>

      <PostModal 
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        communityId={community.id}
        onPostCreated={fetchCommunity}
        userCollegeId={currentUser?.college_id}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .main-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .sidebar-desktop { display: none !important; }
          .mobile-fab { display: flex !important; }
        }
      `}} />
    </div>
  )
}
