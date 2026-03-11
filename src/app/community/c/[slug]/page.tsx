'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRight, Users, Star, MapPin, MessageSquare, 
  Briefcase, Video, Lock, Plus, UserCheck, Shield, 
  CheckCircle, Pin, Clock, TrendingUp, Calendar,
  Building, Globe, Award, Activity, Target, Zap,
  Info, X, GraduationCap, MessageCircle, Crown, LayoutGrid
} from 'lucide-react'

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('feed')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

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
      console.log('Community API response:', json)
      console.log('Community data received:', json.community)
      console.log('College name:', json.community.colleges?.name)
      console.log('Display name:', json.community.display_name)
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
    if (type === 'doubt') return {
      bg: '#FEF3C7', color: '#D97706',
      label: 'Doubt'
    }
    if (type === 'announcement') return {
      bg: '#EDE9FE', color: '#7C3AED',
      label: 'Announcement'
    }
    return {
      bg: '#ECFEFF', color: '#0891B2',
      label: 'Discussion'
    }
  }

  // ── Lock Screen Component ──
  const LockScreen = ({ 
    title, 
    description, 
    userRole, 
    ctaText,
    ctaAction 
  }: {
    title: string
    description: string
    userRole: string
    ctaText: string
    ctaAction: () => void
  }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: '1px solid #F3F4F6',
      padding: '48px 24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#F59E0B,#F97316)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        color: 'white',
        fontSize: 32
      }}>
        <Lock size={40} />
      </div>
      <h3 style={{
        fontSize: 20,
        fontWeight: 700,
        color: '#0A0A0A',
        margin: '0 0 12px'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        color: '#6B7280',
        margin: '0 0 32px',
        lineHeight: 1.6
      }}>
        {description}
      </p>
      {userRole === 'guest' ? (
        <button
          onClick={() => router.push('/signup')}
          style={{
            background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Sign Up Free →
        </button>
      ) : (
        <button
          onClick={ctaAction}
          style={{
            background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {ctaText}
        </button>
      )}
    </div>
  )

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8F7FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #E5E7EB',
            borderTop: '3px solid #7C3AED',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{
            fontSize: 14,
            color: '#6B7280',
            margin: 0
          }}>
            Loading community...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
        `}</style>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8F7FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#0A0A0A',
            margin: '0 0 8px'
          }}>
            Community Not Found
          </h1>
          <p style={{
            fontSize: 14,
            color: '#6B7280',
            margin: '0 0 24px'
          }}>
            This community doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/community')}
            style={{
              background: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Communities
          </button>
        </div>
      </div>
    )
  }

  const { community, verifiedJuniors, verifiedSeniors, posts, jobs, webinars, userRole, canPost, canViewJobs, canViewWebinars, isAlreadyMember } = data

  const tabs = [
    { id: 'feed', label: 'Feed', icon: <MessageSquare size={14} />, locked: false },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase size={14} />, locked: !canViewJobs },
    { id: 'webinars', label: 'Webinars', icon: <Video size={14} />, locked: !canViewWebinars }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFBFC',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>

      {/* ── HERO BANNER ── */}
      <div className="hero-banner" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Breadcrumb */}
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          opacity: 0.8,
          position: 'relative',
          zIndex: 1
        }}>
          <a href="/community" style={{
            color: 'white',
            textDecoration: 'none',
            fontWeight: 500
          }}>
            Community
          </a>
          <ChevronRight size={14} />
          <span>{community.display_name}</span>
        </div>

        {/* College Info */}
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 24px 48px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="hero-info" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
            flexWrap: 'wrap'
          }}>
            {/* College Avatar */}
            <div className="college-avatar" style={{
              width: 80,
              height: 80,
              background: 'transparent',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <img 
                src="/logo.jpg" 
                alt="AAA College Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <h1 className="hero-title" style={{
                fontSize: 36,
                fontWeight: 900,
                margin: '0 0 24px',
                letterSpacing: '-0.8px',
                lineHeight: 1.1,
                color: '#FFFFFF',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {community.colleges?.name || community.display_name || community.college_name || community.name || 'College Community'}
              </h1>

              {/* Details Button */}
              <button
                onClick={() => setShowDetailsModal(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Info size={14} />
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="tab-bar tab-container" style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.locked}
              style={{
                padding: '18px 24px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id
                  ? '3px solid #7C3AED'
                  : '3px solid transparent',
                color: activeTab === tab.id
                  ? '#7C3AED'
                  : tab.locked ? '#D1D5DB' : '#6B7280',
                fontSize: 14,
                fontWeight: 600,
                cursor: tab.locked ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.locked && (
                <Lock size={12} color="#D1D5DB" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="content-grid content-container" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 32,
        alignItems: 'start'
      }}>

        {/* ── LEFT FEED ── */}
        <div>

          {/* ── FEED TAB ── */}
          {activeTab === 'feed' && (
            <div>
              {/* Post Button */}
              {canPost ? (
                <button style={{
                  width: '100%',
                  background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 16,
                  padding: '18px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                }}>
                  <Plus size={20} />
                  Start a Discussion
                </button>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                  marginBottom: 24,
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <Lock size={24} color="#D1D5DB" style={{ marginBottom: 12 }} />
                  <p style={{
                    fontSize: 14,
                    color: '#6B7280',
                    margin: 0,
                    fontWeight: 500
                  }}>
                    Join & verify your college community to participate in discussions
                  </p>
                </div>
              )}

              {/* Posts */}
              {posts.length > 0 ? (
                posts.map((post: any) => {
                  const ts = getTypeStyle(post.type)
                  return (
                    <div key={post.id} className="post-card md:shadow-md md:hover:shadow-lg md:transition-shadow md:duration-200 md:ease-in-out" style={{
                      background: 'white',
                      borderRadius: 16,
                      border: post.is_pinned
                        ? '2px solid #EDE9FE'
                        : '1px solid #E5E7EB',
                      padding: '20px',
                      marginBottom: 16,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => {
                      if (post.type === 'job') {
                        router.push(`/jobs/${post.id}`)
                      } else if (post.type === 'webinar') {
                        router.push(`/webinars/${post.id}`)
                      } else {
                        router.push(`/community/c/${community.slug}/p/${post.id}`)
                      }
                    }}
                    >
                      {/* Author */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 14
                      }}>
                        <div style={{
                          width: 36, height: 36,
                          borderRadius: 10,
                          background: post.users?.role === 'senior'
                            ? 'linear-gradient(135deg,#10B981,#34D399)'
                            : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {post.users?.full_name?.[0] || 'U'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#1F2937',
                            marginBottom: 2
                          }}>
                            {post.users?.full_name}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap'
                          }}>
                            {post.users?.role === 'senior' && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: '#F0FDF4',
                                color: '#166534',
                                padding: '3px 8px',
                                borderRadius: 12,
                                border: '1px solid #BBF7D0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <Shield size={10} />
                                Senior
                              </span>
                            )}
                            {post.users?.is_verified && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: '#EDE9FE',
                                color: '#7C3AED',
                                padding: '3px 8px',
                                borderRadius: 12
                              }}>
                                ✓ Verified
                              </span>
                            )}
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: ts.bg,
                              color: ts.color,
                              padding: '3px 10px',
                              borderRadius: 12
                            }}>
                              {ts.label}
                            </span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11,
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 500
                        }}>
                          <Clock size={11} />
                          {timeAgo(post.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      {post.title && (
                        <h3 style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#111827',
                          margin: '0 0 8px',
                          lineHeight: 1.4
                        }}>
                          {post.title}
                        </h3>
                      )}

                      {/* Content */}
                      <p style={{
                        fontSize: 14,
                        color: '#6B7280',
                        margin: '0 0 16px',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {post.content}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 16
                        }}>
                          {post.tags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} style={{
                              fontSize: 11,
                              fontWeight: 600,
                              background: '#F3F4F6',
                              color: '#6B7280',
                              padding: '4px 10px',
                              borderRadius: 8
                            }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        fontSize: 13,
                        color: '#6B7280',
                        paddingTop: 16,
                        borderTop: '1px solid #F3F4F6'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <TrendingUp size={14} />
                          {post.upvote_count} upvotes
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={14} />
                          {post.answer_count} answers
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} />
                          {post.view_count} views
                        </span>
                        {post.is_answered && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#D1FAE5',
                            color: '#065F46',
                            padding: '4px 8px',
                            borderRadius: 6,
                            marginLeft: 'auto'
                          }}>
                            ✓ Answered
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  padding: '48px 32px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <MessageSquare size={48} color="#D1D5DB" style={{ margin: '0 auto 20px' }} />
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#111827',
                    margin: '0 0 8px'
                  }}>
                    No discussions yet
                  </h3>
                  <p style={{
                    fontSize: 15,
                    color: '#6B7280',
                    margin: 0
                  }}>
                    Be the first to start a conversation! 🚀
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── JOBS TAB ── */}
          {activeTab === 'jobs' && (
            <div>
              {canViewJobs ? (
                jobs.length > 0 ? (
                  jobs.map((job: any) => (
                    <div key={job.id} className="job-card mobile:px-4 mobile:py-6 mobile:flex mobile:flex-col mobile:items-center mobile:justify-center" style={{
                      background: 'white',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      marginBottom: 20,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 16
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#111827',
                            margin: '0 0 6px'
                          }}>
                            {job.role}
                          </h3>
                          <p style={{
                            fontSize: 15,
                            color: '#6B7280',
                            margin: 0,
                            fontWeight: 600
                          }}>
                            {job.company_name}
                          </p>
                        </div>
                        {job.referral_available && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#D1FAE5',
                            color: '#065F46',
                            padding: '6px 12px',
                            borderRadius: 8
                          }}>
                            Referral Available
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 20,
                        fontSize: 14,
                        color: '#6B7280',
                        marginBottom: 20
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Target size={14} />
                          {job.salary_range}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} />
                          {job.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Briefcase size={14} />
                          {job.job_type.replace('_', ' ')}
                        </span>
                      </div>
                      <button style={{
                        background: '#7C3AED',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '12px 20px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s'
                      }}>
                        Apply Now →
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    border: '1px solid #E5E7EB',
                    padding: '48px 32px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <Briefcase size={48} color="#D1D5DB" style={{ margin: '0 auto 20px' }} />
                    <h3 style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#111827',
                      margin: '0 0 8px'
                    }}>
                      No opportunities yet
                    </h3>
                    <p style={{
                      fontSize: 15,
                      color: '#6B7280',
                      margin: 0
                    }}>
                      Check back soon for job openings!
                    </p>
                  </div>
                )
              ) : (
                <LockScreen
                  title="Jobs & Internships Locked"
                  description="Get verified access to exclusive job postings and referral opportunities from seniors in your college."
                  userRole={userRole}
                  ctaText="Upgrade to Premium"
                  ctaAction={() => router.push('/pricing')}
                />
              )}
            </div>
          )}

          {/* ── WEBINARS TAB ── */}
          {activeTab === 'webinars' && (
            <div>
              {canViewWebinars ? (
                webinars.length > 0 ? (
                  webinars.map((webinar: any) => (
                    <div key={webinar.id} className="webinar-card mobile:px-4 mobile:py-6 mobile:flex mobile:flex-col mobile:items-center mobile:justify-center" style={{
                      background: 'white',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      marginBottom: 20,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 16
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#111827',
                            margin: '0 0 12px'
                          }}>
                            {webinar.title}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 14,
                            color: '#6B7280'
                          }}>
                            <div style={{
                              width: 32, height: 32,
                              borderRadius: '50%',
                              background: '#F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700
                            }}>
                              {webinar.users?.full_name?.[0] || 'H'}
                            </div>
                            <span>
                              {webinar.users?.full_name} • {webinar.users?.designation}
                            </span>
                            {webinar.users?.company && (
                              <span>• {webinar.users.company}</span>
                            )}
                          </div>
                        </div>
                        {webinar.price === 0 ? (
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            background: '#D1FAE5',
                            color: '#065F46',
                            padding: '6px 12px',
                            borderRadius: 8
                          }}>
                            Free
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            background: '#FEF3C7',
                            color: '#D97706',
                            padding: '6px 12px',
                            borderRadius: 8
                          }}>
                            ₹{webinar.price}
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 20,
                        fontSize: 14,
                        color: '#6B7280',
                        marginBottom: 20
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} />
                          {new Date(webinar.scheduled_at).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} />
                          {webinar.registered_count}/{webinar.max_seats} seats
                        </span>
                      </div>
                      <button style={{
                        background: '#7C3AED',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        padding: '12px 20px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s'
                      }}>
                        Register Now →
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    border: '1px solid #E5E7EB',
                    padding: '48px 32px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <Video size={48} color="#D1D5DB" style={{ margin: '0 auto 20px' }} />
                    <h3 style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#111827',
                      margin: '0 0 8px'
                    }}>
                      No upcoming webinars
                    </h3>
                    <p style={{
                      fontSize: 15,
                      color: '#6B7280',
                      margin: 0
                    }}>
                      Stay tuned for expert sessions!
                    </p>
                  </div>
                )
              ) : (
                <LockScreen
                  title="Webinars Locked"
                  description="Access exclusive career guidance sessions and workshops hosted by industry professionals and verified seniors."
                  userRole={userRole}
                  ctaText="Upgrade to Premium"
                  ctaAction={() => router.push('/pricing')}
                />
              )}
            </div>
          )}

        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <div style={{
          position: 'sticky',
          top: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>

          {/* ── Community Card ── */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            {/* Header */}
            <div style={{
              background:
                'linear-gradient(135deg,#1E0A4E,#4C1D95)',
              padding: '20px 16px 16px',
              color: 'white'
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                opacity: 0.6,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 4
              }}>
                Community
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                fontFamily: 'Instrument Serif'
              }}>
                c/{slug}
              </div>
              <div style={{
                fontSize: 11,
                opacity: 0.6,
                marginTop: 4
              }}>
                {community.colleges?.name}
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderBottom: '1px solid #F3F4F6'
            }}>
              {[
                {
                  value: verifiedJuniors,
                  label: 'Juniors',
                  icon: <GraduationCap size={14} />
                },
                {
                  value: verifiedSeniors,
                  label: 'Seniors',
                  icon: <Star size={14} />
                },
                {
                  value: posts.length,
                  label: 'Posts',
                  icon: <MessageCircle size={14} />
                },
                {
                  value: jobs?.length || 0,
                  label: 'Jobs',
                  icon: <Briefcase size={14} />
                }
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  padding: '14px 16px',
                  borderRight: i % 2 === 0
                    ? '1px solid #F3F4F6' : 'none',
                  borderBottom: i < 2
                    ? '1px solid #F3F4F6' : 'none'
                }}>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#111827',
                    fontFamily: 'Instrument Serif',
                    lineHeight: 1
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: '#9CA3AF',
                    fontWeight: 500,
                    marginTop: 4
                  }}>
                    <span style={{ color: '#C4B5FD' }}>
                      {stat.icon}
                    </span>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Create Post Button */}
            {canPost && (
              <div style={{ padding: '14px 16px' }}>
                <button style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  background:
                    'linear-gradient(135deg,#7C3AED,#06B6D4)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans',
                  boxShadow:
                    '0 2px 8px rgba(124,58,237,0.25)'
                }}>
                  <Plus size={14} />
                  Create Post
                </button>
              </div>
            )}
          </div>

          {/* ── Top Contributors ── */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F9FAFB',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={13} color="#D97706" />
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#111827'
              }}>
                Top Contributors
              </span>
            </div>

            <div style={{ padding: '8px 16px 14px' }}>
              {/* If posts exist, show top posters */}
              {posts.length > 0 ? (() => {
                // Calculate top contributors from posts
                const contributorMap: Record<string, {
                  name: string
                  count: number
                  role: string
                }> = {}

                posts.forEach((post: any) => {
                  const id = post.users?.unique_id || 'u'
                  if (!contributorMap[id]) {
                    contributorMap[id] = {
                      name: post.users?.full_name || 'User',
                      count: 0,
                      role: post.users?.role || 'student'
                    }
                  }
                  contributorMap[id].count++
                })

                const top = Object.entries(contributorMap)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)

                return top.map(([id, c], i) => (
                  <div key={id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: i < top.length - 1
                      ? '1px solid #F9FAFB' : 'none'
                  }}>
                    {/* Rank */}
                    <div style={{
                      width: 20,
                      fontSize: 12,
                      fontWeight: 800,
                      color: i === 0 ? '#D97706'
                        : i === 1 ? '#9CA3AF'
                        : i === 2 ? '#B45309'
                        : '#D1D5DB',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      {i === 0 ? '🥇'
                        : i === 1 ? '🥈'
                        : i === 2 ? '🥉'
                        : `${i + 1}`}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 30, height: 30,
                      borderRadius: 9,
                      background: c.role === 'senior'
                        ? 'linear-gradient(135deg,#059669,#34D399)'
                        : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {c.name[0].toUpperCase()}
                    </div>

                    {/* Name + role */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#1F2937',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {c.name}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: c.role === 'senior'
                          ? '#059669' : '#9CA3AF',
                        fontWeight: 600,
                        marginTop: 1
                      }}>
                        {c.role === 'senior'
                          ? 'Senior' : 'Student'}
                      </div>
                    </div>

                    {/* Post count */}
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#7C3AED',
                      background: '#F5F3FF',
                      padding: '3px 8px',
                      borderRadius: 100,
                      flexShrink: 0
                    }}>
                      {c.count}p
                    </div>
                  </div>
                ))
              })() : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: '#D1D5DB'
                }}>
                  <TrendingUp
                    size={24}
                    style={{ margin: '0 auto 8px' }} />
                  <p style={{
                    fontSize: 11,
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    Post doubts to appear on
                    the leaderboard!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Community Rules ── */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F9FAFB',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={13} color="#EF4444" />
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#111827'
              }}>
                Community Rules
              </span>
            </div>

            <div style={{ padding: '8px 16px 14px' }}>
              {[
                'Be respectful and professional',
                'Share relevant, helpful content only',
                'No spam or self-promotion',
                'Protect privacy — no personal info',
                'Follow your college code of conduct',
                'Seniors: Only verified answers'
              ].map((rule, i) => (
                <div key={rule} style={{
                  display: 'flex',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: i < 5
                    ? '1px solid #F9FAFB' : 'none',
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#A78BFA',
                    marginTop: 1,
                    flexShrink: 0,
                    width: 16,
                    textAlign: 'center'
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: '#4B5563',
                    fontWeight: 500,
                    lineHeight: 1.5
                  }}>
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Your Access (if not own college) ── */}
          {!canPost && userRole !== 'guest' && (
            <div style={{
              background: 'white',
              borderRadius: 16,
              border: '1px solid #EEEBFF',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#9CA3AF',
                margin: '0 0 12px'
              }}>
                Your Access
              </p>
              {[
                { label: 'Read Feed', ok: true },
                { label: 'Post & Doubt', ok: canPost },
                { label: 'View Jobs', ok: canViewJobs },
                { label: 'View Webinars',
                  ok: canViewWebinars }
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < arr.length - 1
                    ? '1px solid #F9FAFB' : 'none',
                  fontSize: 12,
                  color: '#374151',
                  fontWeight: 500
                }}>
                  <span>{item.label}</span>
                  {item.ok
                    ? <CheckCircle
                        size={14} color="#059669" />
                    : <Lock
                        size={13} color="#D1D5DB" />
                  }
                </div>
              ))}

              {!canViewJobs && (
                <button
                  onClick={() => router.push('/pricing')}
                  style={{
                    width: '100%',
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'white',
                    background:
                      'linear-gradient(135deg,#7C3AED,#06B6D4)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans'
                  }}
                >
                  <Crown size={13} />
                  Upgrade to Premium →
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Community Details Modal */}
      {showDetailsModal && community && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            maxWidth: 480,
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Building size={20} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: 0,
                    color: '#111827',
                    lineHeight: 1.2
                  }}>
                    {community.colleges?.name || community.display_name}
                  </h2>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: '#6B7280',
                    marginTop: 2
                  }}>
                    <Globe size={12} />
                    c/{community.slug}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 6,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px' }}>
              {/* About Section */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: '0 0 8px',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Info size={14} />
                  About Community
                </h3>
                <p style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#6B7280',
                  margin: 0
                }}>
                  {community.description || 'A vibrant community for students and alumni to connect, share knowledge, and grow together.'}
                </p>
              </div>

              {/* College Details */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: '0 0 8px',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Building size={14} />
                  College Details
                </h3>
                <div style={{
                  display: 'grid',
                  gap: 8
                }}>
                  {community.colleges?.location && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: '#6B7280'
                    }}>
                      <MapPin size={12} />
                      {community.colleges.location}, {community.colleges.state}
                    </div>
                  )}
                  {community.colleges?.type && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: '#6B7280'
                    }}>
                      <Award size={12} />
                      {community.colleges.type} College
                    </div>
                  )}
                </div>
              </div>

              {/* Community Stats */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: '0 0 12px',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Activity size={14} />
                  Community Statistics
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: 12,
                    background: '#F9FAFB',
                    borderRadius: 8
                  }}>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#10B981',
                      marginBottom: 2
                    }}>
                      {verifiedJuniors}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#6B7280',
                      fontWeight: 500
                    }}>
                      Juniors
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: 12,
                    background: '#F9FAFB',
                    borderRadius: 8
                  }}>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#3B82F6',
                      marginBottom: 2
                    }}>
                      {verifiedSeniors}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#6B7280',
                      fontWeight: 500
                    }}>
                      Seniors
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: 12,
                    background: '#F9FAFB',
                    borderRadius: 8
                  }}>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#8B5CF6',
                      marginBottom: 2
                    }}>
                      {posts?.length || 0}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#6B7280',
                      fontWeight: 500
                    }}>
                      Posts
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Rules */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: '0 0 8px',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Shield size={14} />
                  Community Guidelines
                </h3>
                <div style={{
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: 8,
                  padding: 12
                }}>
                  <ul style={{
                    margin: 0,
                    paddingLeft: 16,
                    color: '#92400E',
                    fontSize: 12,
                    lineHeight: 1.4
                  }}>
                    <li style={{ marginBottom: 4 }}>Be respectful and professional</li>
                    <li style={{ marginBottom: 4 }}>Share relevant and helpful content</li>
                    <li style={{ marginBottom: 4 }}>No spam or promotional content</li>
                    <li style={{ marginBottom: 4 }}>Protect privacy and personal info</li>
                    <li style={{ marginBottom: 4 }}>Help others positively</li>
                    <li>Follow code of conduct</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                paddingTop: 16,
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    background: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    color: '#374151',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E5E7EB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                  }}
                >
                  Close
                </button>
                {currentUser && !isAlreadyMember && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      // Handle join community logic
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontWeight: 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Join Community
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE ONLY ELEMENTS ══ */}

      {/* Backdrop */}
      {(showDrawer || showLeaderboard) && (
        <div
          onClick={() => {
            setShowDrawer(false)
            setShowLeaderboard(false)
          }}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            backdropFilter: 'blur(2px)'
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Community Info Drawer */}
      <div
        className="mobile-drawer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          zIndex: 999,
          transform: showDrawer
            ? 'translateY(0)'
            : 'translateY(100%)',
          transition:
            'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          maxHeight: '80vh',
          overflowY: 'auto',
          display: 'none',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)'
        }}
      >
        {/* Handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 0'
        }}>
          <div style={{
            width: 36, height: 4,
            borderRadius: 100,
            background: '#E5E7EB'
          }} />
        </div>

        {/* Header */}
        <div style={{
          background:
            'linear-gradient(135deg,#1E0A4E,#4C1D95)',
          margin: '12px 16px',
          borderRadius: 14,
          padding: '16px'
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            margin: '0 0 4px'
          }}>
            Community
          </p>
          <p style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'white',
            margin: '0 0 4px',
            fontFamily: 'Instrument Serif'
          }}>
            c/{slug}
          </p>
          <p style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
            margin: 0
          }}>
            {community.colleges?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '0 16px 16px'
        }}>
          {[
            {
              value: verifiedJuniors,
              label: 'Juniors',
              icon: <GraduationCap size={16} />,
              color: '#7C3AED',
              bg: '#F5F3FF'
            },
            {
              value: verifiedSeniors,
              label: 'Seniors',
              icon: <Star size={16} />,
              color: '#D97706',
              bg: '#FFFBEB'
            },
            {
              value: posts.length,
              label: 'Posts',
              icon: <MessageCircle size={16} />,
              color: '#0891B2',
              bg: '#ECFEFF'
            },
            {
              value: jobs?.length || 0,
              label: 'Jobs',
              icon: <Briefcase size={16} />,
              color: '#059669',
              bg: '#ECFDF5'
            }
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg,
              borderRadius: 12,
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                flexShrink: 0
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#111827',
                  lineHeight: 1,
                  fontFamily: 'Instrument Serif'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#6B7280',
                  marginTop: 2,
                  fontWeight: 600
                }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Rules */}
        <div style={{
          padding: '0 16px 24px'
        }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#374151',
            margin: '0 0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Shield size={13} color="#EF4444" />
            Community Rules
          </p>
          {[
            'Be respectful and professional',
            'Share relevant, helpful content only',
            'No spam or self-promotion',
            'Protect privacy — no personal info',
            'Follow your college code of conduct',
            'Seniors: Only verified answers'
          ].map((rule, i) => (
            <div key={rule} style={{
              display: 'flex',
              gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid #F9FAFB',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#A78BFA',
                flexShrink: 0,
                width: 16,
                textAlign: 'center'
              }}>
                {i + 1}
              </span>
              <span style={{
                fontSize: 12,
                color: '#4B5563',
                fontWeight: 500,
                lineHeight: 1.5
              }}>
                {rule}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Popup */}
      <div
        className="mobile-drawer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          zIndex: 999,
          transform: showLeaderboard
            ? 'translateY(0)'
            : 'translateY(100%)',
          transition:
            'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          maxHeight: '70vh',
          overflowY: 'auto',
          display: 'none',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)'
        }}
      >
        {/* Handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 4px'
        }}>
          <div style={{
            width: 36, height: 4,
            borderRadius: 100,
            background: '#E5E7EB'
          }} />
        </div>

        {/* Title */}
        <div style={{
          padding: '12px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F3F4F6'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 9,
              background: '#FFFBEB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={15} color="#D97706" />
            </div>
            <span style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#111827'
            }}>
              Top Contributors
            </span>
          </div>
          <button
            onClick={() => setShowLeaderboard(false)}
            style={{
              width: 30, height: 30,
              borderRadius: '50%',
              border: '1px solid #F3F4F6',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
              color: '#9CA3AF'
            }}
          >
            ✕
          </button>
        </div>

        {/* Contributors List */}
        <div style={{ padding: '8px 20px 32px' }}>
          {posts.length > 0 ? (() => {
            const map: Record<string, {
              name: string
              count: number
              role: string
            }> = {}

            posts.forEach((post: any) => {
              const id = post.users?.unique_id || 'u'
              if (!map[id]) {
                map[id] = {
                  name: post.users?.full_name || 'User',
                  count: 0,
                  role: post.users?.role || 'student'
                }
              }
              map[id].count++
            })

            const top = Object.entries(map)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 10)

            return top.map(([id, c], i) => (
              <div key={id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                borderBottom: '1px solid #F9FAFB'
              }}>
                {/* Rank */}
                <div style={{
                  width: 28,
                  textAlign: 'center',
                  fontSize: i < 3 ? 18 : 13,
                  fontWeight: 800,
                  color: '#9CA3AF',
                  flexShrink: 0
                }}>
                  {i === 0 ? '🥇'
                    : i === 1 ? '🥈'
                    : i === 2 ? '🥉'
                    : i + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 38, height: 38,
                  borderRadius: 11,
                  background: c.role === 'senior'
                    ? 'linear-gradient(135deg,#059669,#34D399)'
                    : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {c.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#111827'
                  }}>
                    {c.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: c.role === 'senior'
                      ? '#059669' : '#9CA3AF',
                    fontWeight: 600,
                    marginTop: 2
                  }}>
                    {c.role === 'senior'
                      ? 'Verified Senior'
                      : 'Student'}
                  </div>
                </div>

                {/* Posts count */}
                <div style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#7C3AED',
                  background: '#F5F3FF',
                  padding: '5px 12px',
                  borderRadius: 100,
                  flexShrink: 0
                }}>
                  {c.count} posts
                </div>
              </div>
            ))
          })() : (
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#D1D5DB'
            }}>
              <TrendingUp
                size={36}
                style={{ margin: '0 auto 12px' }} />
              <p style={{
                fontSize: 13,
                margin: 0,
                fontWeight: 500
              }}>
                No contributors yet!
                Post first to appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ FLOATING ACTION BUTTONS (Mobile) ══ */}
      <div
        className="mobile-fab"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          display: 'none',
          flexDirection: 'column',
          gap: 10,
          zIndex: 997,
          alignItems: 'flex-end'
        }}
      >
        {/* Trophy / Leaderboard button */}
        <button
          onClick={() => {
            setShowLeaderboard(true)
            setShowDrawer(false)
          }}
          style={{
            width: 46, height: 46,
            borderRadius: '50%',
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            color: '#D97706'
          }}
        >
          <TrendingUp size={20} />
        </button>

        {/* Hamburger / Community Info button */}
        <button
          onClick={() => {
            setShowDrawer(true)
            setShowLeaderboard(false)
          }}
          style={{
            width: 52, height: 52,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg,#7C3AED,#06B6D4)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow:
              '0 4px 20px rgba(124,58,237,0.4)',
            color: 'white'
          }}
        >
          <LayoutGrid size={22} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .hero-banner, .content-container, .tab-container {
            padding: 16px !important;
          }
          
          .hero-info {
            flex-direction: column !important;
            gap: 16px !important;
            align-items: center !important;
          }
          
          .college-avatar {
            width: 60px !important;
            height: 60px !important;
            font-size: 24px !important;
          }
          
          .hero-title {
            font-size: 28px !important;
            font-weight: 900 !important;
            line-height: 1.1 !important;
            letter-spacing: '-0.6px' !important;
          }
          
          .content-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          
          .sidebar {
            position: static !important;
            order: -1;
          }
          
          .post-card, .job-card, .webinar-card, .sidebar-card {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
          
          .post-avatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 10px !important;
          }
          
          .post-title {
            font-size: 14px !important;
          }
          
          .post-content {
            font-size: 12px !important;
          }
          
          .join-button {
            padding: 10px 16px !important;
            font-size: 12px !important;
          }
          
          .stats-container {
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
          
          .tab-bar {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .mobile-scroll {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        @media (max-width: 480px) {
          .hero-title {
            font-size: 24px !important;
            font-weight: 900 !important;
            line-height: 1.1 !important;
            letter-spacing: '-0.5px' !important;
          }
          
          .post-card, .job-card, .webinar-card {
            padding: 12px !important;
          }
          
          .post-title {
            font-size: 13px !important;
          }
          
          .post-content {
            font-size: 11px !important;
          }
          
          .hero-banner, .content-container {
            padding: 12px !important;
          }
          
          .stats-container {
            gap: 12px !important;
          }
          
          .content-grid {
            gap: 16px !important;
          }
          
          /* New Mobile Styles */
          .community-grid {
            grid-template-columns: 1fr !important;
          }
          /* Hide right sidebar completely on mobile */
          .content-grid > div:last-child {
            display: none !important;
          }
          /* Show mobile elements */
          .mobile-fab {
            display: flex !important;
          }
          .mobile-drawer {
            display: block !important;
          }
          .mobile-backdrop {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
                          
