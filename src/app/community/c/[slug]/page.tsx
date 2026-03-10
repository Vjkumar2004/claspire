'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRight, Users, Star, MapPin, MessageSquare, 
  Briefcase, Video, Lock, Plus, UserCheck, Shield, 
  CheckCircle, Pin, Clock, TrendingUp, Calendar,
  Building, Globe, Award
} from 'lucide-react'

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('feed')

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
        fontFamily: 'Plus Jakarta Sans, sans-serif'
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
        fontFamily: 'Plus Jakarta Sans, sans-serif'
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
      background: '#F8F7FF',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg,#5B21B6,#7C3AED 50%,#0891B2)',
        color: 'white'
      }}>
        {/* Breadcrumb */}
        <div className="hero-content" style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          opacity: 0.75
        }}>
          <a href="/community" style={{
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Community
          </a>
          <ChevronRight size={12} />
          <span>c/{slug}</span>
        </div>

        {/* College Info */}
        <div className="hero-content" style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '8px 20px 32px'
        }}>
          <div className="hero-info" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 20,
            flexWrap: 'wrap'
          }}>

            {/* College Avatar */}
            <div className="college-avatar" style={{
              width: 72, height: 72,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0
            }}>
              🎓
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.7,
                marginBottom: 4
              }}>
                c/{slug}
              </div>
              <h1 className="hero-title" style={{
                fontSize: 26,
                fontWeight: 800,
                margin: '0 0 8px',
                fontFamily: 'Instrument Serif, serif',
                letterSpacing: '-0.3px',
                lineHeight: 1.2
              }}>
                {community.display_name}
              </h1>

              {/* Tags row */}
              <div className="hero-tags" style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 16
              }}>
                {[
                  {
                    icon: <MapPin size={10} />,
                    text: `${community.colleges.location}, ${community.colleges.state}` 
                  },
                  {
                    icon: <Building size={10} />,
                    text: community.colleges.type
                  },
                  {
                    icon: <Globe size={10} />,
                    text: 'Private'
                  }
                ].map((b, i) => (
                  <span key={i} style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.2)',
                    padding: '4px 10px',
                    borderRadius: 100,
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {b.icon} {b.text}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="hero-stats" style={{
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap'
              }}>
                {[
                  {
                    icon: <UserCheck size={13} />,
                    value: verifiedJuniors,
                    label: 'Verified Juniors'
                  },
                  {
                    icon: <Star size={13} />,
                    value: verifiedSeniors,
                    label: 'Verified Seniors'
                  },
                  {
                    icon: <MessageSquare size={13} />,
                    value: community.doubt_count,
                    label: 'Doubts Posted'
                  }
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ opacity: 0.8 }}>{s.icon}</span>
                    <div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1
                      }}>
                        {s.value.toLocaleString()}
                      </div>
                      <span style={{
                        fontSize: 11,
                        opacity: 0.65
                      }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join Button */}
            <div style={{ flexShrink: 0 }}>
              {(() => {
                console.log('Button render check:', { 
                  currentUser: !!currentUser, 
                  isAlreadyMember, 
                  userRole,
                  data: !!data 
                })
                return null
              })()}
              {currentUser ? (
                isAlreadyMember ? (
                  <div className="join-button" style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: 10,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: 'Plus Jakarta Sans',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <CheckCircle size={15} />
                    Member
                  </div>
                ) : (
                  <button className="join-button" style={{
                    background: 'white',
                    color: '#7C3AED',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Plus size={15} />
                    Join Community
                  </button>
                )
              ) : (
                <button
                  onClick={() => router.push('/signup')}
                  className="join-button"
                  style={{
                    background: 'white',
                    color: '#7C3AED',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans'
                  }}
                >
                  Join Free →
                </button>
              )}
            </div>

            {/* Verification Badge */}
            {currentUser && userRole !== 'guest' && (
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.2)',
                padding: '10px 16px',
                borderRadius: 10,
                backdropFilter: 'blur(10px)'
              }}>
                <CheckCircle size={14} />
                {userRole === 'own_senior'
                  ? 'Verified Senior ✓'
                  : 'Verified Member ✓'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="tab-bar mobile-scroll" style={{
        background: 'white',
        borderBottom: '1px solid #F3F4F6',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.locked}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id
                  ? '2px solid #7C3AED'
                  : '2px solid transparent',
                color: activeTab === tab.id
                  ? '#7C3AED'
                  : tab.locked ? '#D1D5DB' : '#6B7280',
                fontSize: 14,
                fontWeight: 600,
                cursor: tab.locked ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.locked && (
                <Lock size={10} color="#D1D5DB" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="content-grid" style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 20,
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
                  borderRadius: 12,
                  padding: '16px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  <Plus size={18} />
                  Post a Doubt
                </button>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #F3F4F6',
                  padding: '16px',
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  <Lock size={20} color="#D1D5DB" style={{ marginBottom: 8 }} />
                  <p style={{
                    fontSize: 13,
                    color: '#6B7280',
                    margin: 0
                  }}>
                    Join & verify your own college
                    community to post!
                  </p>
                </div>
              )}

              {/* Posts */}
              {posts.length > 0 ? (
                posts.map((post: any) => {
                  const ts = getTypeStyle(post.type)
                  return (
                    <div key={post.id} className="post-item" style={{
                      background: 'white',
                      borderRadius: 14,
                      border: post.is_pinned
                        ? '1.5px solid #EDE9FE'
                        : '1px solid #F3F4F6',
                      padding: '16px 18px',
                      marginBottom: 12,
                      cursor: 'pointer'
                    }}>
                      {post.is_pinned && (
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#7C3AED',
                          marginBottom: 8
                        }}>
                          <Pin size={10} />
                          Pinned Post
                        </div>
                      )}

                      {/* Author */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 10
                      }}>
                        <div className="post-avatar" style={{
                          width: 28, height: 28,
                          borderRadius: 8,
                          background: post.users?.role === 'senior'
                            ? 'linear-gradient(135deg,#16A34A,#4ADE80)'
                            : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {post.users?.full_name?.[0] || 'U'}
                        </div>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#374151'
                        }}>
                          {post.users?.full_name}
                        </span>
                        {post.users?.role === 'senior' && (
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            background: '#F0FDF4',
                            color: '#16A34A',
                            padding: '2px 7px',
                            borderRadius: 100,
                            border: '1px solid #BBF7D0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}>
                            <Shield size={8} />
                            Senior
                          </span>
                        )}
                        {post.users?.is_verified && (
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            background: '#EDE9FE',
                            color: '#7C3AED',
                            padding: '2px 7px',
                            borderRadius: 100
                          }}>
                            ✓ Verified
                          </span>
                        )}
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: ts.bg,
                          color: ts.color,
                          padding: '2px 8px',
                          borderRadius: 100
                        }}>
                          {ts.label}
                        </span>
                        <span style={{
                          fontSize: 11,
                          color: '#D1D5DB',
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <Clock size={10} />
                          {timeAgo(post.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      {post.title && (
                        <h3 className="post-title" style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#0A0A0A',
                          margin: '0 0 6px',
                          lineHeight: 1.4
                        }}>
                          {post.title}
                        </h3>
                      )}

                      {/* Content */}
                      <p className="post-content" style={{
                        fontSize: 13,
                        color: '#6B7280',
                        margin: '0 0 12px',
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
                          gap: 6,
                          flexWrap: 'wrap',
                          marginBottom: 12
                        }}>
                          {post.tags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} style={{
                              fontSize: 10,
                              fontWeight: 600,
                              background: '#F3F4F6',
                              color: '#6B7280',
                              padding: '3px 8px',
                              borderRadius: 6
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
                        gap: 16,
                        fontSize: 12,
                        color: '#9CA3AF'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <TrendingUp size={12} />
                          {post.upvote_count} upvotes
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MessageSquare size={12} />
                          {post.answer_count} answers
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={12} />
                          {post.view_count} views
                        </span>
                        {post.is_answered && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#D1FAE5',
                            color: '#065F46',
                            padding: '2px 6px',
                            borderRadius: 4,
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
                  borderRadius: 14,
                  border: '1px solid #F3F4F6',
                  padding: '48px 24px',
                  textAlign: 'center'
                }}>
                  <MessageSquare size={40} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0A0A0A',
                    margin: '0 0 8px'
                  }}>
                    No posts yet
                  </h3>
                  <p style={{
                    fontSize: 14,
                    color: '#6B7280',
                    margin: 0
                  }}>
                    Post & answer to appear here! 🏆
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
                    <div key={job.id} style={{
                      background: 'white',
                      borderRadius: 14,
                      border: '1px solid #F3F4F6',
                      padding: '20px',
                      marginBottom: 16
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0A0A0A',
                            margin: '0 0 4px'
                          }}>
                            {job.role}
                          </h3>
                          <p style={{
                            fontSize: 14,
                            color: '#6B7280',
                            margin: 0,
                            fontWeight: 600
                          }}>
                            {job.company_name}
                          </p>
                        </div>
                        {job.referral_available && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#D1FAE5',
                            color: '#065F46',
                            padding: '4px 8px',
                            borderRadius: 6
                          }}>
                            Referral Available
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 13,
                        color: '#6B7280',
                        marginBottom: 16
                      }}>
                        <span>💰 {job.salary_range}</span>
                        <span>📍 {job.location}</span>
                        <span>🏢 {job.job_type.replace('_', ' ')}</span>
                      </div>
                      <button style={{
                        background: '#7C3AED',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        Apply Now →
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    background: 'white',
                    borderRadius: 14,
                    border: '1px solid #F3F4F6',
                    padding: '48px 24px',
                    textAlign: 'center'
                  }}>
                    <Briefcase size={40} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#0A0A0A',
                      margin: '0 0 8px'
                    }}>
                      No jobs posted yet
                    </h3>
                    <p style={{
                      fontSize: 14,
                      color: '#6B7280',
                      margin: 0
                    }}>
                      Check back soon for opportunities!
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
                    <div key={webinar.id} style={{
                      background: 'white',
                      borderRadius: 14,
                      border: '1px solid #F3F4F6',
                      padding: '20px',
                      marginBottom: 16
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0A0A0A',
                            margin: '0 0 8px'
                          }}>
                            {webinar.title}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            color: '#6B7280',
                            marginBottom: 8
                          }}>
                            <div style={{
                              width: 24, height: 24,
                              borderRadius: '50%',
                              background: '#F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
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
                            fontSize: 12,
                            fontWeight: 700,
                            background: '#D1FAE5',
                            color: '#065F46',
                            padding: '4px 8px',
                            borderRadius: 6
                          }}>
                            Free
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            background: '#FEF3C7',
                            color: '#D97706',
                            padding: '4px 8px',
                            borderRadius: 6
                          }}>
                            ₹{webinar.price}
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 13,
                        color: '#6B7280',
                        marginBottom: 16
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {new Date(webinar.scheduled_at).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={12} />
                          {webinar.registered_count}/{webinar.max_seats} seats
                        </span>
                      </div>
                      <button style={{
                        background: '#7C3AED',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%'
                      }}>
                        Register Now →
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    background: 'white',
                    borderRadius: 14,
                    border: '1px solid #F3F4F6',
                    padding: '48px 24px',
                    textAlign: 'center'
                  }}>
                    <Video size={40} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#0A0A0A',
                      margin: '0 0 8px'
                    }}>
                      No upcoming webinars
                    </h3>
                    <p style={{
                      fontSize: 14,
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

        {/* ── RIGHT SIDEBAR ── */}
        <div className="sidebar" style={{ position: 'sticky', top: 70 }}>

          {/* About */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #F3F4F6',
            overflow: 'hidden',
            marginBottom: 16
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0A0A0A',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Building size={14} />
                About
              </h3>
            </div>
            <div style={{
              padding: '16px'
            }}>
              <p style={{
                fontSize: 13,
                color: '#6B7280',
                lineHeight: 1.6,
                margin: 0
              }}>
                {community.description}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #F3F4F6',
            overflow: 'hidden',
            marginBottom: 16
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0A0A0A',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Award size={14} />
                Community Stats
              </h3>
            </div>
            <div style={{
              padding: '16px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12
              }}>
                {[
                  { label: 'Members', value: community.member_count },
                  { label: 'Seniors', value: verifiedSeniors },
                  { label: 'Doubts', value: community.doubt_count },
                  { label: 'Answers', value: Math.floor(community.doubt_count * 0.8) }
                ].map((stat, i) => (
                  <div key={i} style={{
                    textAlign: 'center',
                    padding: '12px',
                    background: '#F9FAFB',
                    borderRadius: 8
                  }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#0A0A0A',
                      marginBottom: 4
                    }}>
                      {stat.value.toLocaleString()}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#6B7280',
                      fontWeight: 600
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #F3F4F6',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0A0A0A',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Shield size={14} />
                Community Rules
              </h3>
            </div>
            <div style={{
              padding: '16px'
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: 16,
                fontSize: 12,
                color: '#6B7280',
                lineHeight: 1.6
              }}>
                <li style={{ marginBottom: 8 }}>Be respectful and professional</li>
                <li style={{ marginBottom: 8 }}>Share relevant and helpful content</li>
                <li style={{ marginBottom: 8 }}>No spam or self-promotion</li>
                <li style={{ marginBottom: 8 }}>Protect privacy and confidential info</li>
                <li>Follow college code of conduct</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .hero-content {
            padding: 12px 16px !important;
          }
          
          .hero-info {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .college-avatar {
            width: 60px !important;
            height: 60px !important;
            font-size: 24px !important;
          }
          
          .hero-title {
            font-size: 20px !important;
          }
          
          .hero-tags {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          
          .hero-stats {
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
          
          .content-grid {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
            gap: 16px !important;
          }
          
          .sidebar {
            position: static !important;
            order: -1;
          }
          
          .tab-bar {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .post-item {
            padding: 16px !important;
            margin-bottom: 12px !important;
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
          
          .mobile-scroll {
            -webkit-overflow-scrolling: touch;
          }
        }
        
        @media (max-width: 480px) {
          .hero-title {
            font-size: 18px !important;
          }
          
          .post-item {
            padding: 12px !important;
          }
          
          .post-title {
            font-size: 13px !important;
          }
          
          .post-content {
            font-size: 11px !important;
          }
          
          .hero-stats {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  )
}
                          
