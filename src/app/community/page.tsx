'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import {
  Search, LayoutGrid, HelpCircle,
  MessageCircle, Clock, TrendingUp,
  ArrowUp, ArrowDown, CheckCircle,
  Eye, ChevronRight, Briefcase,
  Video, Building2, Crown, Zap,
  Hash, Star, Shield, Globe
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CommunityPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [userCommunity, setUserCommunity] = useState<any>(null)
  
  // Add state for each post's vote status
  const [votes, setVotes] = useState<Record<string, {
    userVote: 'upvote' | 'downvote' | null
    upvotes: number
    downvotes: number
    isLoading: boolean
    error: string | null
  }>>({})

  // Initialize vote state with user's existing votes
  useEffect(() => {
    if (!posts.length) return
    
    const userStr = localStorage.getItem('claspire_user')
    const userId = userStr ? JSON.parse(userStr).id : null
    
    const v: Record<string, {
      userVote: 'upvote' | 'downvote' | null
      upvotes: number
      downvotes: number
      isLoading: boolean
      error: string | null
    }> = {}
    
    posts.forEach((p: any) => {
      v[p.id] = {
        userVote: null,
        upvotes: p.upvote_count || 0,
        downvotes: p.downvote_count || 0,
        isLoading: false,
        error: null
      }
    })
    setVotes(v)
    
    // Fetch user's existing votes
    if (userId) {
      fetchUserVotes(userId)
    }
  }, [posts])

  // Fetch user's existing votes
  const fetchUserVotes = async (userId: string) => {
    try {
      const { data: userVotes } = await supabase
        .from('votes')
        .select('post_id, vote_type')
        .eq('user_id', userId)
        .in('post_id', posts.map(p => p.id))
      
      if (userVotes) {
        setVotes(prev => {
          const updated = { ...prev }
          userVotes.forEach(vote => {
            if (updated[vote.post_id]) {
              updated[vote.post_id].userVote = vote.vote_type as 'upvote' | 'downvote'
            }
          })
          return updated
        })
      }
    } catch (error) {
      console.error('Failed to fetch user votes:', error)
    }
  }

  // Get user's college community
  useEffect(() => {
    const userStr = localStorage.getItem('claspire_user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.college_id) {
        const mine = communities.find(c =>
          c.colleges?.id === user.college_id
        )
        setUserCommunity(mine || null)
      }
    }
  }, [communities])

  // Enhanced vote handler with proper state management
  const handleVote = async (
    postId: string,
    voteType: 'upvote' | 'downvote'
  ) => {
    // Authentication check
    const userStr = localStorage.getItem('claspire_user')
    if (!userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    const userId = user.id

    // Get current vote state
    const currentVote = votes[postId]
    if (!currentVote || currentVote.isLoading) {
      return // Prevent multiple simultaneous votes
    }

    // Store previous state for rollback
    const previousState = { ...currentVote }
    
    // Calculate optimistic updates
    let optimisticUpdate: Partial<typeof currentVote>
    
    if (currentVote.userVote === voteType) {
      // Toggle off (remove vote)
      optimisticUpdate = {
        userVote: null,
        upvotes: voteType === 'upvote' 
          ? Math.max(0, currentVote.upvotes - 1)
          : currentVote.upvotes,
        downvotes: voteType === 'downvote'
          ? Math.max(0, currentVote.downvotes - 1)
          : currentVote.downvotes,
        isLoading: true,
        error: null
      }
    } else if (currentVote.userVote === null) {
      // New vote
      optimisticUpdate = {
        userVote: voteType,
        upvotes: voteType === 'upvote'
          ? currentVote.upvotes + 1
          : currentVote.upvotes,
        downvotes: voteType === 'downvote'
          ? currentVote.downvotes + 1
          : currentVote.downvotes,
        isLoading: true,
        error: null
      }
    } else {
      // Switch vote (from upvote to downvote or vice versa)
      optimisticUpdate = {
        userVote: voteType,
        upvotes: voteType === 'upvote'
          ? currentVote.upvotes + 1
          : Math.max(0, currentVote.upvotes - 1),
        downvotes: voteType === 'downvote'
          ? currentVote.downvotes + 1
          : Math.max(0, currentVote.downvotes - 1),
        isLoading: true,
        error: null
      }
    }

    // Apply optimistic update
    setVotes(prev => ({
      ...prev,
      [postId]: { ...prev[postId], ...optimisticUpdate }
    }))

    try {
      // Make API call
      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          vote_type: voteType
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Vote failed')
      }

      // Fetch updated vote counts to ensure consistency
      const { data: updatedPost } = await supabase
        .from('posts')
        .select('upvote_count, downvote_count')
        .eq('id', postId)
        .single()

      // Update with actual server data
      setVotes(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          upvotes: updatedPost?.upvote_count || prev[postId].upvotes,
          downvotes: updatedPost?.downvote_count || prev[postId].downvotes,
          isLoading: false,
          error: null,
          userVote: result.action === 'removed' ? null : voteType
        }
      }))

    } catch (error) {
      console.error('Vote error:', error)
      
      // Rollback to previous state
      setVotes(prev => ({
        ...prev,
        [postId]: {
          ...previousState,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to vote'
        }
      }))

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('401')) {
        // Session expired, redirect to login
        localStorage.removeItem('claspire_user')
        router.push('/login')
      } else {
        // Show toast or alert for other errors
        setTimeout(() => {
          setVotes(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              error: null
            }
          }))
        }, 3000)
      }
    }
  }

  const fetchCommunities = async () => {
    setLoading(true)
    try {
      console.log('Fetching communities and posts...')
      
      // Fetch communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select(`
          id,
          slug,
          display_name,
          description,
          member_count,
          senior_count,
          doubt_count,
          colleges (
            id,
            name,
            short_name,
            location,
            state,
            type,
            email_domain
          )
        `)
        .order('member_count', { ascending: false })

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            full_name, unique_id,
            role, is_verified
          ),
          communities (
            slug,
            colleges ( name, short_name )
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!communitiesError && communitiesData) {
        setCommunities(communitiesData)
      }
      
      if (!postsError && postsData) {
        setPosts(postsData)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [])

  // Filter posts
  const filteredPosts = posts.filter((p: any) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t: string) => t.includes(search.toLowerCase()))

    const matchFilter =
      filter === 'all' ? true
      : filter === 'unanswered' ? !p.is_answered
      : filter === 'trending' ? (p.upvote_count || 0) > 0
      : p.type === filter

    return matchSearch && matchFilter
  })

  // Helper functions
  const getTypeStyle = (type: string) => {
    return type === 'doubt'
      ? { bg: '#FEF3C7', color: '#D97706', label: 'DOUBT' }
      : { bg: '#DBEAFE', color: '#2563EB', label: 'DISCUSSION' }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diff = now.getTime() - past.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return past.toLocaleDateString()
  }

  // Loading state
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12,
      fontFamily: 'Plus Jakarta Sans'
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #EDE9FE',
        borderTop: '3px solid #7C3AED',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{
        fontSize: 13,
        color: '#9CA3AF',
        margin: 0,
        fontWeight: 500
      }}>
        Loading communities...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4FF',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <Navbar />

      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg,#1E0A4E 0%,#4C1D95 50%,#0C4A6E 100%)',
        padding: '72px 16px 24px 16px',
        color: 'white'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 100,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 700,
            marginBottom: 12,
            letterSpacing: '0.06em'
          }}>
            🎓 CLASPIRE COMMUNITY
          </div>
          <h1 style={{
            fontSize: 'clamp(20px,5vw,28px)',
            fontWeight: 900,
            margin: '0 0 6px',
            fontFamily: 'Instrument Serif, serif',
            lineHeight: 1.2
          }}>
            Community Feed
          </h1>
          <p style={{
            fontSize: 13,
            opacity: 0.7,
            margin: '0 0 20px',
            fontWeight: 500,
            lineHeight: 1.4
          }}>
            Doubts, discussions & opportunities from {communities.length} college communities
          </p>

          {/* Search Bar in Hero */}
          <div style={{
            maxWidth: '100%',
            position: 'relative'
          }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              type="text"
              placeholder="Search posts, doubts, tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 12,
                border: 'none',
                fontSize: 14,
                fontFamily: 'Plus Jakarta Sans',
                outline: 'none',
                background: 'white',
                color: '#111827',
                boxSizing: 'border-box',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 3 COLUMN LAYOUT ── */}
      <div style={{
        maxWidth: 1200,
        margin: '20px auto',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: '220px 1fr 300px',
        gap: 20,
        alignItems: 'start'
      }}
      className="feed-grid"
      >

        {/* ════ LEFT SIDEBAR ════ */}
        <div style={{
          position: 'sticky',
          top: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
        className="left-sidebar"
        >

          {/* My Communities */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F9FAFB'
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#9CA3AF',
                margin: 0
              }}>
                My Community
              </p>
            </div>

            {/* Show user's own college community */}
            {userCommunity ? (
              <div
                onClick={() => router.push(`/community/c/${userCommunity.slug}`)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderBottom: '1px solid #F9FAFB',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {userCommunity.colleges?.short_name?.[0] || 'C'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    c/{userCommunity.slug}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#9CA3AF',
                    fontWeight: 500
                  }}>
                    {userCommunity.member_count || 0} members
                  </div>
                </div>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#10B981',
                  flexShrink: 0
                }} />
              </div>
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: 11,
                  color: '#9CA3AF',
                  margin: '0 0 10px',
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  Join your college community!
                </p>
                <button
                  onClick={() => router.push('/signup')}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white',
                    background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans'
                  }}
                >
                  Get Started →
                </button>
              </div>
            )}
          </div>

          {/* Feed Filter Links */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F9FAFB'
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#9CA3AF',
                margin: 0
              }}>
                Browse
              </p>
            </div>
            {[
              { key: 'all', label: 'All Posts', icon: <LayoutGrid size={14} /> },
              { key: 'doubt', label: 'Doubts', icon: <HelpCircle size={14} /> },
              { key: 'discussion', label: 'Discussions', icon: <MessageCircle size={14} /> },
              { key: 'unanswered', label: 'Unanswered', icon: <Clock size={14} /> },
              { key: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  background: filter === item.key ? '#F5F3FF' : 'white',
                  border: 'none',
                  borderLeft: filter === item.key ? '3px solid #7C3AED' : '3px solid transparent',
                  color: filter === item.key ? '#7C3AED' : '#6B7280',
                  fontSize: 13,
                  fontWeight: filter === item.key ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Links */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            padding: '14px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <p style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              margin: '0 0 10px'
            }}>
              Quick Links
            </p>
            {[
              { label: 'Jobs Board', icon: <Briefcase size={13} />, href: '/jobs' },
              { label: 'Webinars', icon: <Video size={13} />, href: '/webinars' },
              { label: 'All Colleges', icon: <Building2 size={13} />, href: '/colleges' },
              { label: 'Pricing', icon: <Crown size={13} />, href: '/pricing' }
            ].map(link => (
              <div
                key={link.label}
                onClick={() => router.push(link.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  fontSize: 12,
                  color: '#6B7280',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: '1px solid #F9FAFB',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#7C3AED'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
              >
                <span style={{ color: '#A78BFA' }}>
                  {link.icon}
                </span>
                {link.label}
                <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>

        {/* ════ CENTER FEED ════ */}
        <div className="feed-wrapper">

          {/* Filter Pills (mobile-friendly) */}
          <div style={{
            display: 'flex',
            gap: 6,
            marginBottom: 16,
            overflowX: 'auto',
            paddingBottom: 4
          }}
          className="filter-pills hide-scrollbar"
          >
            {[
              { key: 'all', label: 'All' },
              { key: 'doubt', label: 'Doubts' },
              { key: 'discussion', label: 'Discussions' },
              { key: 'unanswered', label: 'Unanswered' },
              { key: 'trending', label: 'Trending' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: filter === f.key ? 'none' : '1.5px solid #E5E7EB',
                  background: filter === f.key ? 'linear-gradient(135deg,#7C3AED,#06B6D4)' : 'white',
                  color: filter === f.key ? 'white' : '#6B7280',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: filter === f.key ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #EEEBFF',
                  padding: '20px',
                  animation: 'pulse 1.5s ease infinite'
                }}>
                  <div style={{
                    height: 12,
                    background: '#F3F4F6',
                    borderRadius: 100,
                    width: '60%',
                    marginBottom: 10
                  }} />
                  <div style={{
                    height: 10,
                    background: '#F9FAFB',
                    borderRadius: 100,
                    width: '90%',
                    marginBottom: 6
                  }} />
                  <div style={{
                    height: 10,
                    background: '#F9FAFB',
                    borderRadius: 100,
                    width: '75%'
                  }} />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: 16,
              border: '1px solid #EEEBFF',
              padding: '40px 16px',
              textAlign: 'center'
            }}>
              <MessageCircle
                size={32}
                color="#DDD6FE"
                style={{
                  margin: '0 auto 12px',
                  display: 'block'
                }}
              />
              <p style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#374151',
                margin: '0 0 6px'
              }}>
                No posts found
              </p>
              <p style={{
                fontSize: 11,
                color: '#9CA3AF',
                margin: 0
              }}>
                Be the first to post in your community!
              </p>
            </div>
          ) : (
            filteredPosts.map((post: any) => {
              const ts = getTypeStyle(post.type)
              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/community/c/${post.communities?.slug}/post/${post.id}`)}
                  className="post-card"
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    border: '1px solid #EEEBFF',
                    padding: '16px',
                    marginBottom: 12,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(124,58,237,0.1)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#DDD6FE'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#EEEBFF'
                  }}
                >
                  {/* Author Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 10,
                    flexWrap: 'wrap'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      background: post.users?.role === 'senior'
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
                      {post.users?.full_name?.[0] || 'U'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 80px)' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginBottom: 2
                      }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#1F2937',
                          wordBreak: 'break-word'
                        }}>
                          {post.users?.full_name}
                        </span>
                        {post.users?.role === 'senior' && (
                          <span style={{
                            fontSize: 8,
                            fontWeight: 700,
                            background: '#ECFDF5',
                            color: '#059669',
                            padding: '1px 5px',
                            borderRadius: 100,
                            border: '1px solid #A7F3D0',
                            flexShrink: 0
                          }}>
                            SENIOR
                          </span>
                        )}
                        {post.users?.is_verified && (
                          <span style={{
                            fontSize: 8,
                            fontWeight: 700,
                            background: '#EDE9FE',
                            color: '#7C3AED',
                            padding: '1px 5px',
                            borderRadius: 100,
                            flexShrink: 0
                          }}>
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap'
                      }}>
                        {/* Community badge */}
                        <span
                          onClick={e => {
                            e.stopPropagation()
                            router.push(`/community/c/${post.communities?.slug}`)
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#7C3AED',
                            background: '#F5F3FF',
                            padding: '1px 5px',
                            borderRadius: 100,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          c/{post.communities?.slug}
                        </span>
                        <span style={{ fontSize: 10, color: '#D1D5DB', flexShrink: 0 }}>•</span>
                        <span style={{
                          fontSize: 10,
                          color: '#9CA3AF',
                          fontWeight: 500,
                          flexShrink: 0
                        }}>
                          {timeAgo(post.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Type badge */}
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: ts.bg,
                      color: ts.color,
                      padding: '2px 8px',
                      borderRadius: 100,
                      flexShrink: 0
                    }}>
                      {ts.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 
                    className="post-title"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111827',
                      margin: '0 0 8px',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {post.title}
                  </h3>

                  {/* Content preview */}
                  <p 
                    className="post-content"
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      margin: '0 0 12px',
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      WebkitLineClamp: 2,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      flexWrap: 'wrap',
                      marginBottom: 10
                    }}>
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} style={{
                          fontSize: 9,
                          fontWeight: 600,
                          background: '#F5F3FF',
                          color: '#7C3AED',
                          padding: '2px 6px',
                          borderRadius: 100,
                          border: '1px solid #EDE9FE'
                        }}>
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: '#9CA3AF',
                          padding: '2px 6px'
                        }}>
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    paddingTop: 12,
                    borderTop: '1px solid #F9FAFB',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexWrap: 'wrap'
                    }}>
                      {/* Upvote */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleVote(post.id, 'upvote')
                        }}
                        disabled={votes[post.id]?.isLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: votes[post.id]?.userVote === 'upvote' ? '#7C3AED' : '#6B7280',
                          background: votes[post.id]?.userVote === 'upvote' ? '#F5F3FF' : '#F9FAFB',
                          border: votes[post.id]?.userVote === 'upvote' ? '1.5px solid #DDD6FE' : '1px solid #F3F4F6',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: votes[post.id]?.isLoading ? 'not-allowed' : 'pointer',
                          fontFamily: 'Plus Jakarta Sans',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                          opacity: votes[post.id]?.isLoading ? 0.6 : 1
                        }}
                      >
                        {votes[post.id]?.isLoading && votes[post.id]?.userVote !== 'upvote' ? (
                          <div style={{
                            width: 11, height: 11,
                            border: '2px solid #6B7280',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }} />
                        ) : (
                          <ArrowUp size={11} />
                        )}
                        {votes[post.id]?.upvotes || 0}
                      </button>

                      {/* Downvote */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleVote(post.id, 'downvote')
                        }}
                        disabled={votes[post.id]?.isLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: votes[post.id]?.userVote === 'downvote' ? '#EF4444' : '#6B7280',
                          background: votes[post.id]?.userVote === 'downvote' ? '#FEF2F2' : '#F9FAFB',
                          border: votes[post.id]?.userVote === 'downvote' ? '1.5px solid #FECACA' : '1px solid #F3F4F6',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: votes[post.id]?.isLoading ? 'not-allowed' : 'pointer',
                          fontFamily: 'Plus Jakarta Sans',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                          opacity: votes[post.id]?.isLoading ? 0.6 : 1
                        }}
                      >
                        {votes[post.id]?.isLoading && votes[post.id]?.userVote !== 'downvote' ? (
                          <div style={{
                            width: 11, height: 11,
                            border: '2px solid #6B7280',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }} />
                        ) : (
                          <ArrowDown size={11} />
                        )}
                        {votes[post.id]?.downvotes || 0}
                      </button>

                      {/* Answers */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          router.push(`/community/c/${post.communities?.slug}/post/${post.id}`)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: post.is_answered ? '#059669' : '#6B7280',
                          background: post.is_answered ? '#ECFDF5' : '#F9FAFB',
                          border: post.is_answered ? '1px solid #A7F3D0' : '1px solid #F3F4F6',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontFamily: 'Plus Jakarta Sans',
                          flexShrink: 0
                        }}
                      >
                        <MessageCircle size={11} />
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {post.answer_count || 0}
                          {post.is_answered ? ' Solved' : ' Answers'}
                        </span>
                        {post.is_answered && <CheckCircle size={9} />}
                      </button>
                    </div>

                    {/* Views */}
                    <span style={{
                      fontSize: 10,
                      color: '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontWeight: 500,
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}>
                      <Eye size={10} />
                      {post.view_count || 0}
                    </span>
                  </div>

                  {/* Error Display */}
                  {votes[post.id]?.error && (
                    <div style={{
                      fontSize: 10,
                      color: '#EF4444',
                      background: '#FEF2F2',
                      padding: '4px 8px',
                      borderRadius: 6,
                      marginTop: 8,
                      border: '1px solid #FECACA',
                      fontWeight: 500
                    }}>
                      {votes[post.id]?.error}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div style={{
          position: 'sticky',
          top: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
        className="right-sidebar"
        >

          {/* Top Communities */}
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
                background: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={13} color="#7C3AED" />
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#111827'
              }}>
                Top Communities
              </span>
            </div>

            {communities.slice(0, 5).map((c, i) => (
              <div
                key={c.id}
                onClick={() => router.push(`/community/c/${c.slug}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #F9FAFB',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
              >
                {/* Rank */}
                <span style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: i === 0 ? '#D97706' : i === 1 ? '#9CA3AF' : i === 2 ? '#B45309' : '#D1D5DB',
                  width: 20,
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>

                {/* Avatar */}
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {c.colleges?.short_name?.[0] || 'C'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    c/{c.slug}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#9CA3AF',
                    fontWeight: 500
                  }}>
                    {c.member_count || 0} members
                  </div>
                </div>

                <ChevronRight size={13} color="#D1D5DB" />
              </div>
            ))}

            <div
              onClick={() => router.push('/colleges')}
              style={{
                padding: '12px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: '#7C3AED',
                cursor: 'pointer',
                textAlign: 'center',
                background: '#FAFAFA'
              }}
            >
              View All Colleges →
            </div>
          </div>

          {/* Suggested Communities */}
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
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={13} color="#059669" />
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#111827'
              }}>
                Suggested For You
              </span>
            </div>

            {/* Show communities user hasn't joined */}
            {communities
              .filter(c => c.slug !== userCommunity?.slug)
              .slice(0, 4)
              .map(c => (
              <div
                key={c.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg,#0C4A6E,#06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {c.colleges?.short_name?.[0] || 'C'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {c.colleges?.short_name}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#9CA3AF',
                    fontWeight: 500
                  }}>
                    {c.colleges?.location}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/community/c/${c.slug}`)}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#7C3AED',
                    background: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    borderRadius: 8,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans',
                    flexShrink: 0
                  }}
                >
                  View →
                </button>
              </div>
            ))}
          </div>

          {/* Platform Stats */}
          <div style={{
            background: 'linear-gradient(135deg,#1E0A4E,#4C1D95)',
            borderRadius: 16,
            padding: '18px',
            color: 'white'
          }}>
            <p style={{
              fontSize: 13,
              fontWeight: 800,
              margin: '0 0 14px',
              fontFamily: 'Instrument Serif'
            }}>
              Claspire Stats
            </p>
            {[
              { label: 'Colleges', value: communities.length },
              { label: 'Total Members', value: communities.reduce((a, c) => a + (c.member_count || 0), 0) },
              { label: 'Posts Today', value: posts.filter((p: any) => {
                const d = new Date(p.created_at)
                const today = new Date()
                return d.toDateString() === today.toDateString()
              }).length }
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12
              }}>
                <span style={{ opacity: 0.65, fontWeight: 500 }}>
                  {stat.label}
                </span>
                <span style={{
                  fontWeight: 800,
                  fontSize: 15,
                  fontFamily: 'Instrument Serif'
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'white',
        borderTop: '1px solid #F3F4F6',
        zIndex: 990,
        padding: '8px 0 20px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          {[
            {
              label: 'Feed',
              icon: <LayoutGrid size={20} />,
              href: '/community'
            },
            {
              label: 'Colleges',
              icon: <Building2 size={20} />,
              href: '/colleges'
            },
            {
              label: 'Jobs',
              icon: <Briefcase size={20} />,
              href: '/jobs'
            },
            {
              label: 'Dashboard',
              icon: <Star size={20} />,
              href: '/dashboard'
            }
          ].map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => router.push(tab.href)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: i === 0
                  ? '#7C3AED' : '#9CA3AF',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 10,
                fontWeight: i === 0 ? 700 : 500,
                padding: '4px 0'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.5 }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .feed-grid {
            grid-template-columns: 1fr 260px !important;
          }
          .left-sidebar {
            display: none !important;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .feed-grid {
            grid-template-columns: 1fr !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .right-sidebar {
            display: none !important;
          }
          .left-sidebar {
            display: none !important;
          }
          .post-card {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-top: none !important;
            border-bottom: 6px solid #F5F4FF !important;
            margin-bottom: 0 !important;
            padding: 14px 16px !important;
          }
          .feed-wrapper {
            padding: 0 !important;
          }
          .filter-pills {
            padding: 10px 16px !important;
            background: white;
            border-bottom: 1px solid #F3F4F6;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .mobile-bottom-nav {
            display: block !important;
          }
          /* Add bottom padding to feed */
          .feed-wrapper {
            padding-bottom: 80px !important;
          }
        }
      `}</style>
    </div>
  )
}
