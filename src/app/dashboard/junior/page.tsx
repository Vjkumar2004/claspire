'use client'
import {
  LayoutDashboard, HelpCircle, BookOpen,
  Calendar, Users, Settings, Bell,
  Flame, TrendingUp, Zap, Award,
  ChevronRight, Plus, Clock,
  CheckCircle, Video, Briefcase,
  GraduationCap, Star, Target,
  BarChart3, Menu, X, Trash2,
  Handshake, Search
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePoints } from '@/contexts/PointsContext'

interface DashData {
  user: {
    id: string
    full_name: string
    email: string
    unique_id: string
    rise_points: number
    rp_level: number
    doubt_count: number
    referral_count: number
    webinar_count: number
    is_verified: boolean
    colleges: {
      name: string
      short_name: string
      slug: string
    } | null
  }
  rpLog: Array<{
    id: string
    points: number
    reason: string
    created_at: string
  }>
  myPosts: Array<{
    id: string
    title: string
    content: string
    upvote_count: number
    answer_count: number
    is_answered: boolean
    created_at: string
    communities: {
      display_name: string
      slug: string
    } | null
  }>
  unreadCount: number
  dailyRPEarned: boolean
  myReferrals: Array<{
    id: string
    status: string
    created_at: string
    job: {
      company_name: string
      role: string
    }
    senior: {
      full_name: string
    }
  }>
  joinedCommunities: Array<{
    id: string
    communities: {
      id: string
      slug: string
      display_name: string
    }
  }>
  webinars: Array<{
    id: string
    title: string
    description: string
    scheduled_at: string
    duration: string
    communities: {
      display_name: string
    }
    users: {
      full_name: string
    }
  }>
}

export default function JuniorDashboard() {
  const router = useRouter()
  const { showAward } = usePoints()
  const [authChecked, setAuthChecked] = useState(false)
  const [dashData, setDashData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDailyRP, setShowDailyRP] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [doubtSearch, setDoubtSearch] = useState('')
  const [doubtFilter, setDoubtFilter] = useState<'all' | 'answered' | 'pending'>('all')
  const [eventSearch, setEventSearch] = useState('')
  const [eventFilter, setEventFilter] = useState<'all' | 'attended' | 'upcoming'>('all')

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    const handleClick = () => setShowDeleteConfirm(null)
    
    if (showDeleteConfirm) {
      setTimeout(() => document.addEventListener('click', handleClick), 100)
    }
    
    return () => document.removeEventListener('click', handleClick)
  }, [showDeleteConfirm])

  const init = async () => {
      try {
        const res = await fetch('/api/dashboard/me')
        if (!res.ok) {
          router.replace('/login')
          return
        }
        const data = await res.json()

        if (data.user?.role === 'senior') {
          router.replace('/dashboard/senior')
          return
        }

        setDashData(data)
        setAuthChecked(true)

        // Show daily RP toast
        if (data.dailyRPEarned) {
          showAward(1, "Daily visit bonus 🌅");
        }
      } catch {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

  // Helper functions
  const getRPLevel = (points: number) => {
    if (points >= 1000) return {
      label: 'Pathfinder', 
      emoji: '🏆',
      next: null,
      color: '#F59E0B'
    }
    if (points >= 500) return {
      label: 'Rising Star',
      emoji: '⭐',
      next: 1000,
      color: '#7C3AED'
    }
    if (points >= 200) return {
      label: 'Explorer',
      emoji: '🔭',
      next: 500,
      color: '#06B6D4'
    }
    return {
      label: 'Newcomer',
      emoji: '🌱',
      next: 200,
      color: '#16A34A'
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

  const handleDeletePost = async (postId: string) => {
    setDeletingId(postId)
    try {
      const res = await fetch('/api/posts/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: postId
        })
      })

      const data = await res.json()

      if (data.success) {
        // Remove from local state instantly
        setDashData(prev => prev ? {
          ...prev,
          myPosts: prev.myPosts.filter(p => p.id !== postId)
        } : null)
        setShowDeleteConfirm(null)
      } else {
        alert(data.error || 'Delete failed')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Loading ──
  if (loading || !authChecked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#F9FAFB',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #E5E7EB',
          borderTop: '3px solid #7C3AED',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{
          color: '#9CA3AF',
          fontSize: 13,
          margin: 0
        }}>
          Loading your dashboard...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
        `}</style>
      </div>
    )
  }

  const u = dashData!.user
  const rp = getRPLevel(u.rise_points)
  const rpProgress = rp.next
    ? Math.min(
        (u.rise_points / rp.next) * 100, 100
      )
    : 100

  // ── Dashboard UI ──
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#F8F9FA',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      {/* ══════════════════
          SIDEBAR
      ══════════════════ */}
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: 260,
        background: 'white',
        borderRight: '1px solid #F3F4F6',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0,
        height: '100vh',
        zIndex: 100,
        transition: 'transform 0.3s ease'
      }}>

        {/* Logo */}
        <div style={{
          padding: '24px 20px 16px',
          borderBottom: '1px solid #F9FAFB'
        }}>
          <Link 
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none'
            }}
          >
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0A0A0A'
            }}>
              Clas<span style={{ color: '#7C3AED' }}>pire</span>
            </span>
          </Link>
        </div>

        {/* User Profile */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F9FAFB'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {/* Avatar */}
            <div style={{
              width: 42, height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 15,
              fontWeight: 800,
              flexShrink: 0
            }}>
              {u.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0A0A0A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {u.full_name}
              </div>
              <div style={{
                fontSize: 11,
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2
              }}>
                <GraduationCap size={10} />
                {u.colleges?.short_name || 'College'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{
          flex: 1,
          padding: '12px 12px',
          overflowY: 'auto'
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#D1D5DB',
            padding: '4px 8px 8px',
            margin: 0
          }}>
            Menu
          </p>

          {[
            {
              label: 'Overview',
              icon: <LayoutDashboard size={16} />,
              active: activeTab === 'overview',
              onClick: () => setActiveTab('overview'),
              href: '#'
            },
            {
              label: 'Doubts',
              icon: <HelpCircle size={16} />,
              active: activeTab === 'doubts',
              onClick: () => setActiveTab('doubts'),
              href: '#'
            },
            {
              label: 'Events',
              icon: <Calendar size={16} />,
              active: activeTab === 'events',
              onClick: () => setActiveTab('events'),
              href: '#'
            },
            {
              label: 'Community',
              icon: <Users size={16} />,
              active: activeTab === 'community',
              onClick: () => setActiveTab('community'),
              href: '#'
            },
            {
              label: 'Referrals',
              icon: <Handshake size={16} />,
              active: activeTab === 'referrals',
              onClick: () => setActiveTab('referrals'),
              href: '#'
            },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                if (item.onClick) {
                  item.onClick();
                  setMobileMenuOpen(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 10px',
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: 'none',
                background: item.active
                  ? '#F3F0FF' : 'transparent',
                color: item.active
                  ? '#7C3AED' : '#6B7280',
                fontWeight: item.active ? 700 : 500,
                fontSize: 14,
                transition: 'all 0.15s'
              }}
            >
              <span style={{
                display: 'flex',
                opacity: item.active ? 1 : 0.7
              }}>
                {item.icon}
              </span>
              {item.label}
              {item.active && (
                <div style={{
                  marginLeft: 'auto',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: '#7C3AED'
                }} />
              )}
            </a>
          ))}
        </nav>

        {/* Rise Points Card */}
        <div className="mobile-rp-card" style={{
          margin: '0 12px 16px',
          background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
          borderRadius: 14,
          padding: '16px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8
          }}>
            <div>
              <p style={{
                fontSize: 11,
                fontWeight: 600,
                opacity: 0.8,
                margin: '0 0 2px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Rise Points
              </p>
              <div style={{
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1,
                fontFamily: 'Instrument Serif, serif'
              }}>
                {u.rise_points}
              </div>
            </div>
            <div style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Flame size={18} color="white" />
            </div>
          </div>

          {/* Level */}
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            opacity: 0.85,
            marginBottom: 6
          }}>
            {rp.emoji} {rp.label}
            {rp.next && (
              <span style={{ opacity: 0.6 }}>
                {' '}· {rp.next - u.rise_points} to next
              </span>
            )}
          </div>

          {/* Progress */}
          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 100,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${rpProgress}%`,
              background: 'white',
              borderRadius: 100
            }} />
          </div>
        </div>
      </div>

      {/* ══════════════════
          MAIN CONTENT
      ══════════════════ */}
      <div className="mobile-main" style={{
        marginLeft: 260,
        flex: 1,
        padding: '0 0 40px'
      }}>

        {/* Top Bar */}
        <div className="mobile-top-bar" style={{
          background: 'white',
          borderBottom: '1px solid #F3F4F6',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                width: 32, height: 32,
                borderRadius: 8,
                border: '1px solid #F3F4F6',
                background: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6B7280'
              }}
              className="mobile-hamburger"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            
            <div>
              <h1 style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#0A0A0A',
                margin: 0,
                fontFamily: 'Instrument Serif, serif'
              }}>
                Junior Dashboard
              </h1>
              <p style={{
                fontSize: 13,
                color: '#9CA3AF',
                margin: '2px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                Welcome back, {u.full_name.split(' ')[0]}!
                {showDailyRP && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#16A34A',
                    background: '#F0FDF4',
                    padding: '2px 8px',
                    borderRadius: 100,
                    marginLeft: 4
                  }}>
                    +1 RP Daily bonus! ⚡
                  </span>
                )}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {/* Notifications */}
            <button className="mobile-notification" style={{
              position: 'relative',
              width: 38, height: 38,
              borderRadius: 10,
              border: '1px solid #F3F4F6',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280'
            }}>
              <Bell size={17} />
              {(dashData!.unreadCount || 0) > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 6, right: 6,
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#EF4444',
                  border: '1.5px solid white'
                }} />
              )}
            </button>

            {/* Settings */}
            <button className="mobile-settings" style={{
              width: 38, height: 38,
              borderRadius: 10,
              border: '1px solid #F3F4F6',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280'
            }}>
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mobile-content" style={{ padding: '28px 32px' }}>

          {/* ── Stats Row ── */}
          <div className="mobile-stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 24
          }}>
            {[
              {
                label: 'Doubts Asked',
                value: u.doubt_count,
                sub: u.doubt_count > 0
                  ? 'Keep asking!' : 'Ask your first doubt',
                icon: <HelpCircle size={20} />,
                color: '#7C3AED',
                bg: '#F3F0FF',
                border: '#EDE9FE'
              },
              {
                label: 'Referrals',
                value: u.referral_count,
                sub: u.referral_count > 0
                  ? 'Great network!' : 'Request a referral',
                icon: <Briefcase size={20} />,
                color: '#0891B2',
                bg: '#ECFEFF',
                border: '#A5F3FC'
              },
              {
                label: 'Events Joined',
                value: u.webinar_count,
                sub: u.webinar_count > 0
                  ? 'Active learner!' : 'Join a webinar',
                icon: <Video size={20} />,
                color: '#D97706',
                bg: '#FFFBEB',
                border: '#FDE68A'
              }
            ].map(stat => (
              <div key={stat.label} className="mobile-stats-card" style={{
                background: 'white',
                borderRadius: 16,
                padding: '22px 20px',
                border: `1px solid ${stat.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <p style={{
                    fontSize: 13,
                    color: '#9CA3AF',
                    fontWeight: 500,
                    margin: '0 0 8px'
                  }}>
                    {stat.label}
                  </p>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#0A0A0A',
                    lineHeight: 1,
                    fontFamily: 'Instrument Serif, serif',
                    marginBottom: 6
                  }}>
                    {stat.value}
                  </div>
                  <p style={{
                    fontSize: 11,
                    color: stat.value > 0
                      ? '#16A34A' : '#9CA3AF',
                    margin: 0,
                    fontWeight: 600
                  }}>
                    {stat.sub}
                  </p>
                </div>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: 12,
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  flexShrink: 0
                }}>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* ── Main View Switcher ── */}
          {activeTab === 'overview' ? (
            <>
              {/* ── Recent Activity + My Doubts ── */}
          <div className="mobile-two-column" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 24
          }}>

            {/* Recent Activity */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              border: '1px solid #F3F4F6',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid #F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{
                    width: 30, height: 30,
                    borderRadius: 8,
                    background: '#F3F0FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp size={14} color="#7C3AED" />
                  </div>
                  <span className="mobile-card-header" style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0A0A0A'
                  }}>
                    Recent Activity
                  </span>
                </div>
                <span style={{
                  fontSize: 11,
                  color: '#D1D5DB'
                }}>
                  Last 6
                </span>
              </div>

              <div className="mobile-card-content" style={{ padding: '6px 20px 16px' }}>
                {dashData!.rpLog.length > 0 ? (
                  dashData!.rpLog.map((log, i) => (
                    <div key={log.id} className="mobile-activity-item" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: i < dashData!.rpLog.length - 1
                        ? '1px solid #F9FAFB' : 'none'
                    }}>
                      <div style={{
                        width: 34, height: 34,
                        borderRadius: 10,
                        background: '#F9FAFB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Zap size={14} color="#7C3AED" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#374151',
                          margin: 0
                        }}>
                          {log.reason}
                        </p>
                        <p style={{
                          fontSize: 10,
                          color: '#D1D5DB',
                          margin: '2px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <Clock size={9} />
                          {timeAgo(log.created_at)}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: log.points > 0
                          ? '#16A34A' : '#EF4444',
                        background: log.points > 0
                          ? '#F0FDF4' : '#FEF2F2',
                        padding: '4px 10px',
                        borderRadius: 100,
                        flexShrink: 0
                      }}>
                        {log.points > 0 ? '+' : ''}
                        {log.points}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: '#D1D5DB'
                  }}>
                    <BarChart3 size={28}
                      style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, margin: 0 }}>
                      No activity yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* My Doubts */}
            <div style={{
              background: 'white',
              borderRadius: 16,
              border: '1px solid #F3F4F6',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid #F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{
                    width: 30, height: 30,
                    borderRadius: 8,
                    background: '#ECFEFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HelpCircle size={14} color="#0891B2" />
                  </div>
                  <span className="mobile-card-header" style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0A0A0A'
                  }}>
                    My Doubts
                  </span>
                </div>
                <button
                  onClick={() => router.push('/community')}
                  className="mobile-button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    color: '#7C3AED',
                    fontWeight: 700,
                    background: '#F3F0FF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans'
                  }}
                >
                  <Plus size={12} /> New
                </button>
              </div>

              <div className="mobile-card-content" style={{ padding: '6px 20px 16px' }}>
                {dashData!.myPosts.length > 0 ? (
                  dashData!.myPosts.map((post, i) => (
                    <div key={post.id} className="mobile-doubt-item" style={{
                      position: 'relative',
                      padding: '12px 0',
                      borderBottom: i < dashData!.myPosts.length - 1
                        ? '1px solid #F9FAFB' : 'none',
                      cursor: 'pointer'
                    }}>
                      {/* Delete Button */}
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 0
                      }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() =>
                              setShowDeleteConfirm(
                                showDeleteConfirm === post.id
                                  ? null : post.id
                              )
                            }
                            style={{
                              width: 28, height: 28,
                              borderRadius: 8,
                              border: '1px solid #FEE2E2',
                              background: '#FFF5F5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#FCA5A5',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement)
                                .style.background = '#FEE2E2'
                              ;(e.currentTarget as HTMLElement)
                                .style.color = '#EF4444'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement)
                                .style.background = '#FFF5F5'
                              ;(e.currentTarget as HTMLElement)
                                .style.color = '#FCA5A5'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>

                          {/* Confirm Dropdown */}
                          {showDeleteConfirm === post.id && (
                            <div style={{
                              position: 'absolute',
                              top: 34,
                              right: 0,
                              background: 'white',
                              border: '1px solid #FEE2E2',
                              borderRadius: 12,
                              padding: '14px',
                              width: 200,
                              maxWidth: '90vw',
                              boxShadow:
                                '0 8px 24px rgba(0,0,0,0.12)',
                              zIndex: 100
                            }}>
                              <p style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#111827',
                                margin: '0 0 4px'
                              }}>
                                Delete this post?
                              </p>
                              <p style={{
                                fontSize: 11,
                                color: '#9CA3AF',
                                margin: '0 0 12px',
                                lineHeight: 1.5,
                                fontWeight: 500
                              }}>
                                This cannot be undone.
                                Votes and answers will also
                                be deleted.
                              </p>
                              <div style={{
                                display: 'flex',
                                gap: 8
                              }}>
                                <button
                                  onClick={() =>
                                    setShowDeleteConfirm(null)}
                                  style={{
                                    flex: 1,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#6B7280',
                                    background: '#F9FAFB',
                                    border: '1px solid #F3F4F6',
                                    borderRadius: 8,
                                    padding: '8px',
                                    cursor: 'pointer',
                                    fontFamily: 'Plus Jakarta Sans'
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeletePost(post.id)}
                                  disabled={
                                    deletingId === post.id}
                                  style={{
                                    flex: 1,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'white',
                                    background:
                                      deletingId === post.id
                                      ? '#FCA5A5' : '#EF4444',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px',
                                    cursor: deletingId === post.id
                                      ? 'not-allowed' : 'pointer',
                                    fontFamily: 'Plus Jakarta Sans',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4
                                  }}
                                >
                                  {deletingId === post.id ? (
                                    <>
                                      <div style={{
                                        width: 10, height: 10,
                                        border:
                                          '2px solid white',
                                        borderTop:
                                          '2px solid transparent',
                                        borderRadius: '50%',
                                        animation:
                                          'spin 0.8s linear infinite'
                                      }} />
                                      ...
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginBottom: 6,
                        paddingRight: 40
                      }}>
                        <p style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#374151',
                          margin: 0,
                          flex: 1,
                          lineHeight: 1.4
                        }}>
                          {post.title ||
                            post.content.slice(0, 60) + '...'}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 100,
                          background: post.is_answered
                            ? '#F0FDF4' : '#FEF3C7',
                          color: post.is_answered
                            ? '#16A34A' : '#D97706',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          height: 'fit-content'
                        }}>
                          {post.is_answered
                            ? <CheckCircle size={9} />
                            : <Clock size={9} />}
                          &nbsp;
                          <span>{post.is_answered
                            ? 'Answered' : 'Pending'}</span>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 12
                      }}>
                        <span style={{
                          fontSize: 11,
                          color: '#D1D5DB',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <TrendingUp size={10} />
                          {post.upvote_count}
                        </span>
                        <span style={{
                          fontSize: 11,
                          color: '#D1D5DB',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <HelpCircle size={10} />
                          {post.answer_count}
                        </span>
                        <span style={{
                          fontSize: 11,
                          color: '#D1D5DB',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <Clock size={10} />
                          {timeAgo(post.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px 0',
                    color: '#D1D5DB'
                  }}>
                    <HelpCircle size={28}
                      style={{ margin: '0 auto 8px' }} />
                    <p style={{
                      fontSize: 12,
                      margin: '0 0 12px'
                    }}>
                      No doubts yet!
                    </p>
                    <button
                      onClick={() => router.push('/community')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'white',
                        background:
                          'linear-gradient(135deg,#7C3AED,#06B6D4)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontFamily: 'Plus Jakarta Sans'
                      }}
                    >
                      Ask First Doubt →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── How to Earn RP ── */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #F3F4F6',
            padding: '20px 24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}>
              <div style={{
                width: 30, height: 30,
                borderRadius: 8,
                background: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={14} color="#D97706" />
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0A0A0A'
              }}>
                How to earn Rise Points
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 10
            }} className="mobile-tasks-grid">
              {[
                {
                  action: 'Joined Claspire',
                  rp: '+1 RP',
                  done: true,
                  icon: <Star size={13} />
                },
                {
                  action: 'Daily Visit',
                  rp: '+1 RP/day',
                  done: true,
                  icon: <Calendar size={13} />
                },
                {
                  action: 'Post a Doubt',
                  rp: '+5 RP',
                  done: u.doubt_count > 0,
                  icon: <HelpCircle size={13} />
                },
                {
                  action: 'Get Answer',
                  rp: '+3 RP',
                  done: false,
                  icon: <CheckCircle size={13} />
                },
                {
                  action: 'Attend Webinar',
                  rp: '+10 RP',
                  done: u.webinar_count > 0,
                  icon: <Video size={13} />
                },
                {
                  action: 'Get Referral',
                  rp: '+20 RP',
                  done: u.referral_count > 0,
                  icon: <Briefcase size={13} />
                }
              ].map(item => (
                <div key={item.action} className="mobile-task-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  background: item.done
                    ? '#F0FDF4' : '#F9FAFB',
                  borderRadius: 12,
                  border: `1px solid ${
                    item.done ? '#BBF7D0' : '#F3F4F6'
                  }`
                }}>
                  <div style={{
                    color: item.done
                      ? '#16A34A' : '#9CA3AF',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: item.done
                      ? '#16A34A' : '#6B7280',
                    flex: 1
                  }}>
                    {item.action}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: item.done
                      ? '#16A34A' : '#7C3AED'
                  }}>
                    {item.rp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : activeTab === 'doubts' ? (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid #F9FAFB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', margin: 0 }}>My Doubts History</h2>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>Track all your questions and senior answers</p>
              </div>
              <button 
                onClick={() => {
                  const slug = dashData?.user?.colleges?.slug;
                  router.push(slug ? `/community/c/${slug}` : '/community');
                }}
                style={{
                  padding: '8px 16px', borderRadius: 10, background: '#7C3AED', color: 'white', 
                  border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                }}
              >
               + Ask New Doubt
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input 
                  type="text" 
                  placeholder="Search doubts..." 
                  value={doubtSearch} 
                  onChange={e => setDoubtSearch(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #F3F4F6', fontSize: 13, outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: 4, background: '#F9FAFB', padding: 3, borderRadius: 10 }}>
                {['all', 'answered', 'pending'].map(opt => (
                  <button 
                    key={opt} 
                    onClick={() => setDoubtFilter(opt as any)} 
                    style={{ 
                      padding: '6px 14px', borderRadius: 8, border: 'none', 
                      background: doubtFilter === opt ? 'white' : 'transparent', 
                      color: doubtFilter === opt ? '#7C3AED' : '#6B7280', 
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      boxShadow: doubtFilter === opt ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: '30px' }}>
            {dashData?.myPosts && dashData.myPosts.filter(p => {
              const mS = p.title.toLowerCase().includes(doubtSearch.toLowerCase()) || p.content.toLowerCase().includes(doubtSearch.toLowerCase());
              const mF = doubtFilter === 'all' || (doubtFilter === 'answered' && p.is_answered) || (doubtFilter === 'pending' && !p.is_answered);
              return mS && mF;
            }).length > 0 ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {dashData.myPosts.filter(p => {
                  const mS = p.title.toLowerCase().includes(doubtSearch.toLowerCase()) || p.content.toLowerCase().includes(doubtSearch.toLowerCase());
                  const mF = doubtFilter === 'all' || (doubtFilter === 'answered' && p.is_answered) || (doubtFilter === 'pending' && !p.is_answered);
                  return mS && mF;
                }).map(post => (
                  <div key={post.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #F9FAFB', padding: 20, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', margin: 0, flex: 1 }}>{post.title}</h3>
                      <span style={{ 
                        fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 100, 
                        background: post.is_answered ? '#F0FDF4' : '#FFFBEB', 
                        color: post.is_answered ? '#16A34A' : '#D97706', 
                        border: `1px solid ${post.is_answered ? '#DCFCE7' : '#FEF3C7'}`, 
                        whiteSpace: 'nowrap', marginLeft: 12 
                      }}>
                        {post.is_answered ? '✓ Answered' : '⌛ Pending'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>{post.content.slice(0, 180)}...</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#9CA3AF' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12} /> {post.upvote_count} upvotes</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HelpCircle size={12} /> {post.answer_count} answers</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>No doubts found</h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 300, margin: '0 auto 24px' }}>Ask questions in the community to get help from verified seniors.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'events' ? (
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '24px 30px', borderBottom: '1px solid #F9FAFB' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', margin: 0 }}>Webinar History</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 16px' }}>Watch recordings or join upcoming expert sessions</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input 
                  type="text" placeholder="Search webinars..." 
                  value={eventSearch} onChange={e => setEventSearch(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #F3F4F6', fontSize: 13, outline: 'none' }} 
                />
              </div>
            </div>
          </div>
          <div style={{ padding: '30px' }}>
            {(dashData?.webinars || []).filter((w: any) => w.title.toLowerCase().includes(eventSearch.toLowerCase())).length > 0 ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {dashData?.webinars.filter((w: any) => w.title.toLowerCase().includes(eventSearch.toLowerCase())).map(webinar => (
                  <div key={webinar.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #F3F4F6', padding: 24, transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', margin: '0 0 6px', fontFamily: 'Instrument Serif, serif' }}>{webinar.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#6B7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {webinar.users?.full_name || 'Expert'}</span>
                          <span style={{ color: '#E5E7EB' }}>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {webinar.duration}</span>
                          <span style={{ color: '#E5E7EB' }}>•</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>{webinar.communities?.display_name}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 100, background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7' }}>
                        Upcoming
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 20px', lineHeight: 1.5 }}>{webinar.description}</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                       <button style={{ padding: '8px 16px', borderRadius: 10, background: '#7C3AED', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Join Webinar</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>No webinars found</h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 300, margin: '0 auto 24px' }}>Stay tuned for upcoming expert sessions and career guidance events.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'community' ? (
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #F3F4F6', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ height: 160, background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', padding: 40, display: 'flex', alignItems: 'flex-end' }}>
             <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: 0, fontFamily: 'Instrument Serif, serif' }}>
               {dashData?.user?.colleges?.short_name || 'College'} Community
             </h2>
          </div>
          <div style={{ padding: 40, borderBottom: '1px solid #F9FAFB' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', textAlign: 'center', margin: '0 0 24px' }}>My Communities</h3>
            {dashData?.joinedCommunities && dashData.joinedCommunities.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {dashData.joinedCommunities.map(item => (
                  <div key={item.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #F3F4F6', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', fontWeight: 800 }}>
                        {item.communities.display_name[0]}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: 0 }}>{item.communities.display_name}</h4>
                        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Joined</p>
                      </div>
                    </div>
                    <Link href={`/community/c/${item.communities.slug}`} style={{ padding: '6px 14px', borderRadius: 8, background: '#F3F4F6', color: '#6B7280', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                      Enter hub
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>Not Joined Any Communities</h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 350, margin: '0 auto 24px' }}>
                  Join your college community or other interest groups to connect with peers and seniors.
                </p>
                <Link href="/community" style={{ padding: '10px 24px', background: '#7C3AED', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}>
                  Explore Communities
                </Link>
              </div>
            )}
          </div>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', margin: '0 0 12px' }}>Your College Network is Here</h3>
            <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Connect with your campus mates, ask doubts to verified seniors, and stay updated with exclusive college events.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Link 
                href={dashData?.user?.colleges?.slug ? `/community/c/${dashData.user.colleges.slug}` : '/community'} 
                style={{ 
                  padding: '14px 32px', background: '#7C3AED', color: 'white', 
                  borderRadius: 16, textDecoration: 'none', fontSize: 15, 
                  fontWeight: 700, boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)' 
                }}
              >
                Go to Community Hub →
              </Link>
            </div>
          </div>
        </div>
      ) : activeTab === 'referrals' ? (
            <div style={{
              background: 'white',
              borderRadius: 20,
              border: '1px solid #F3F4F6',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                padding: '24px 30px',
                borderBottom: '1px solid #F9FAFB',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 12,
                  background: '#F3F0FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED'
                }}>
                  <Handshake size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', margin: 0 }}>My Referral Requests</h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0' }}>Track the status of your referral applications</p>
                </div>
              </div>

              <div style={{ padding: '10px 30px 30px' }}>
                {dashData?.myReferrals && dashData.myReferrals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {dashData.myReferrals.map((req: any, i: number) => (
                      <div key={req.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 0',
                        borderBottom: i < dashData.myReferrals.length - 1 ? '1px solid #F9FAFB' : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{
                            width: 48, height: 48,
                            borderRadius: 14,
                            background: '#F9FAFB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                          }}>
                            💼
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0A0A' }}>
                              {req.job?.role} @ {req.job?.company_name}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                              Request to <span style={{ fontWeight: 600, color: '#6B7280' }}>{req.senior?.full_name}</span> • {timeAgo(req.created_at)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: req.status === 'approved' ? '#F0FDF4' : req.status === 'rejected' ? '#FEF2F2' : '#F9FAFB',
                            color: req.status === 'approved' ? '#16A34A' : req.status === 'rejected' ? '#EF4444' : '#6B7280',
                            border: `1px solid ${req.status === 'approved' ? '#DCFCE7' : req.status === 'rejected' ? '#FEE2E2' : '#F3F4F6'}`
                          }}>
                            {req.status === 'approved' ? '✓ Approved' : req.status === 'pending' ? '⌛ Pending' : req.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', margin: '0 0 8px' }}>No Referral Requests Yet</h3>
                    <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 300, margin: '0 auto 24px' }}>
                      Get referrals from seniors at top companies to boost your career.
                    </p>
                    <Link 
                      href={dashData?.user?.colleges?.slug ? `/community/c/${dashData.user.colleges.slug}` : '/community'}
                      style={{
                        display: 'inline-flex',
                        padding: '10px 20px',
                        background: '#7C3AED',
                        color: 'white',
                        borderRadius: 12,
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                      }}
                    >
                      Find Job Openings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px) }
          to { opacity: 1; transform: translateX(0) }
        }
        
        /* Desktop Styles - Default */
        .mobile-sidebar {
          transform: translateX(0) !important;
        }
        
        .mobile-hamburger {
          display: none !important;
        }
        
        .mobile-overlay {
          display: none !important;
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          /* Show hamburger menu on mobile */
          .mobile-hamburger {
            display: flex !important;
          }
          
          /* Show mobile overlay when sidebar is open */
          .mobile-overlay {
            display: block !important;
          }
          
          /* Adjust sidebar for mobile - slide in/out */
          .mobile-sidebar {
            transform: translateX(-100%) !important;
          }
          
          .mobile-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          
          /* Adjust main content for mobile */
          .mobile-main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          
          /* Mobile top bar */
          .mobile-top-bar {
            padding: 12px 16px !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 50 !important;
          }
          
          .mobile-top-bar h1 {
            font-size: 18px !important;
          }
          
          .mobile-top-bar p {
            font-size: 12px !important;
          }
          
          /* Mobile content padding */
          .mobile-content {
            padding: 16px !important;
          }
          
          /* Mobile stats grid */
          .mobile-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .mobile-stats-card {
            padding: 16px !important;
          }
          
          .mobile-stats-card p:first-child {
            font-size: 12px !important;
          }
          
          .mobile-stats-card div {
            font-size: 24px !important;
          }
          
          .mobile-stats-card p:last-child {
            font-size: 10px !important;
          }
          
          /* Mobile two column layout */
          .mobile-two-column {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          /* Mobile card headers */
          .mobile-card-header {
            padding: 14px 16px !important;
          }
          
          .mobile-card-header span {
            font-size: 13px !important;
          }
          
          /* Mobile card content */
          .mobile-card-content {
            padding: 4px 16px 16px !important;
          }
          
          /* Delete confirm dropdown mobile */
          .mobile-doubt-item .delete-confirm-dropdown {
            width: 85vw !important;
            max-width: 280px !important;
            right: -10px !important;
            top: 38px !important;
          }
          
          /* Mobile activity items */
          .mobile-activity-item {
            padding: 10px 0 !important;
          }
          
          .mobile-activity-item p {
            font-size: 12px !important;
          }
          
          .mobile-activity-item p:last-child {
            font-size: 9px !important;
          }
          
          /* Mobile doubts items */
          .mobile-doubt-item {
            padding: 10px 0 !important;
          }
          
          .mobile-doubt-item p {
            font-size: 12px !important;
          }
          
          .mobile-doubt-item span {
            font-size: 9px !important;
          }
          
          /* Mobile button */
          .mobile-button {
            padding: 5px 10px !important;
            font-size: 11px !important;
          }
          
          /* Mobile tasks grid */
          .mobile-tasks-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          
          .mobile-task-item {
            padding: 10px 12px !important;
          }
          
          .mobile-task-item span {
            font-size: 11px !important;
          }
          
          .mobile-task-item span:last-child {
            font-size: 10px !important;
          }
          
          /* Mobile RP card */
          .mobile-rp-card {
            margin: 0 8px 12px !important;
            padding: 12px !important;
          }
          
          .mobile-rp-card p {
            font-size: 10px !important;
          }
          
          .mobile-rp-card div {
            font-size: 24px !important;
          }
          
          .mobile-rp-card div:last-child {
            font-size: 10px !important;
          }
          
          /* Mobile notification badge */
          .mobile-notification {
            width: 32px !important;
            height: 32px !important;
          }
          
          .mobile-notification svg {
            width: 14px !important;
            height: 14px !important;
          }
          
          /* Mobile settings button */
          .mobile-settings {
            width: 32px !important;
            height: 32px !important;
          }
          
          .mobile-settings svg {
            width: 14px !important;
            height: 14px !important;
          }
        }
        
        /* Small mobile styles */
        @media (max-width: 480px) {
          .mobile-content {
            padding: 12px !important;
          }
          
          .mobile-stats-card {
            padding: 12px !important;
          }
          
          .mobile-stats-card div {
            font-size: 20px !important;
          }
          
          .mobile-card-header {
            padding: 12px !important;
          }
          
          .mobile-card-content {
            padding: 4px 12px 12px !important;
          }
          
          /* Delete confirm dropdown small mobile */
          .mobile-doubt-item .delete-confirm-dropdown {
            width: 90vw !important;
            max-width: 250px !important;
            right: -15px !important;
            top: 40px !important;
            padding: '12px' !important;
          }
        }
      `}</style>
        </div>
      </div>
    </div>
  )
}
