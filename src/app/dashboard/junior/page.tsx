'use client'
import {
  LayoutDashboard, HelpCircle, BookOpen,
  Calendar, Users, Settings, Bell,
  Flame, TrendingUp, Zap, Award,
  ChevronRight, Plus, Clock,
  CheckCircle, Video, Briefcase,
  GraduationCap, Star, Target,
  BarChart3, Menu, X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

export default function JuniorDashboard() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [dashData, setDashData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDailyRP, setShowDailyRP] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    init()
  }, [])

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
          setShowDailyRP(true)
          setTimeout(() => setShowDailyRP(false), 3000)
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={18} color="white" />
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0A0A0A'
            }}>
              Clas<span style={{ color: '#7C3AED' }}>pire</span>
            </span>
          </div>
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
              active: true,
              href: '#'
            },
            {
              label: 'Doubts',
              icon: <HelpCircle size={16} />,
              active: false,
              href: '/dashboard/junior/doubts'
            },
            {
              label: 'Events',
              icon: <Calendar size={16} />,
              active: false,
              href: '/dashboard/junior/events'
            },
            {
              label: 'Community',
              icon: <Users size={16} />,
              active: false,
              href: '/community/c/aaacet'
            },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
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
                      padding: '12px 0',
                      borderBottom: i < dashData!.myPosts.length - 1
                        ? '1px solid #F9FAFB' : 'none',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginBottom: 6
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

        </div>
      </div>

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
        }
      `}</style>
    </div>
  )
}
