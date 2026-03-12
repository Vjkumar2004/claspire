'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePoints } from '@/contexts/PointsContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import {
  Search, LayoutGrid, HelpCircle,
  MessageCircle, Clock, TrendingUp,
  ArrowUp, ArrowDown, CheckCircle,
  Eye, ChevronRight, Briefcase,
  Video, Building2, Crown, Zap,
  Hash, Star, Shield, Globe, Plus,
  BookOpen, Target, Send, X, ChevronDown, ChevronUp, Sparkles, Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showAward } = usePoints()
  const [communities, setCommunities] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [userCommunity, setUserCommunity] = useState<any>(null)

  // Inline answer section state
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [postAnswers, setPostAnswers] = useState<Record<string, any[]>>({})
  const [answersLoading, setAnswersLoading] = useState<Record<string, boolean>>({})
  const [newAnswerText, setNewAnswerText] = useState<Record<string, string>>({})
  const [answerSubmitting, setAnswerSubmitting] = useState<Record<string, boolean>>({})

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

    const fetchUserVotes = async () => {
      // Get current user from API
      let userId: string | null = null
      try {
        const authRes = await fetch('/api/auth/me')
        if (authRes.ok) {
          const authData = await authRes.json()
          userId = authData.user?.id || null
        }
      } catch (error) {
        console.error('Failed to get user for votes:', error)
      }

      if (!userId) return

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
    fetchUserVotes()
  }, [posts])

  // Get user's college community
  useEffect(() => {
    const getUserCommunity = async () => {
      try {
        const authRes = await fetch('/api/auth/me')
        if (authRes.ok) {
          const authData = await authRes.json()
          const user = authData.user
          if (user && user.college_id) {
            const mine = communities.find(c =>
              c.colleges?.id === user.college_id
            )
            setUserCommunity(mine || null)
          }
        }
      } catch (error) {
        console.error('Failed to get user community:', error)
      }
    }

    if (communities.length) {
      getUserCommunity()
    }
  }, [communities])

  // Enhanced vote handler with proper state management
  const handleVote = async (
    postId: string,
    voteType: 'upvote' | 'downvote'
  ) => {
    // Authentication check - fetch current user from session
    let userId: string
    try {
      // Use session-based authentication like the API expects
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      const authData = await authRes.json()
      if (!authData.user) {
        router.push('/login')
        return
      }
      userId = authData.user.id
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
      return
    }

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
          upvotes: result.upvotes || prev[postId].upvotes,
          downvotes: result.downvotes || prev[postId].downvotes,
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

  // Fetch answers for a post
  const fetchPostAnswers = async (postId: string) => {
    if (postAnswers[postId]) return // Already cached
    
    setAnswersLoading(prev => ({ ...prev, [postId]: true }))
    try {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          *,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified
          )
        `)
        .eq('post_id', postId)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true })
      
      setPostAnswers(prev => ({ ...prev, [postId]: data || [] }))
    } catch (err) {
      console.error('Failed to fetch answers:', err)
      setPostAnswers(prev => ({ ...prev, [postId]: [] }))
    } finally {
      setAnswersLoading(prev => ({ ...prev, [postId]: false }))
    }
  }

  // Toggle answer section
  const toggleAnswerSection = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
    } else {
      setExpandedPost(postId)
      fetchPostAnswers(postId)
    }
  }

  // Submit inline answer
  const submitInlineAnswer = async (postId: string) => {
    const text = newAnswerText[postId]?.trim()
    if (!text || answerSubmitting[postId]) return

    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      const authData = await authRes.json()
      if (!authData.user) {
        router.push('/login')
        return
      }

      setAnswerSubmitting(prev => ({ ...prev, [postId]: true }))

      const response = await fetch('/api/answers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          content: text
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const result = await response.json()

      if (result.success && result.answer) {
        // Show points award
        showAward(5, "Answered a question 🤝");

        setPostAnswers(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), result.answer]
        }))
        setNewAnswerText(prev => ({ ...prev, [postId]: '' }))
        
        // Update answer count on the post UI
        setPosts(prev => prev.map((p: any) =>
          p.id === postId
            ? { ...p, answer_count: (p.answer_count || 0) + 1, is_answered: true }
            : p
        ))
      }
    } catch (err) {
      console.error('Answer submit error:', err)
    } finally {
      setAnswerSubmitting(prev => ({ ...prev, [postId]: false }))
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
        : filter === 'unanswered'
          ? !p.is_answered && p.type === 'doubt'
          : filter === 'trending'
            ? (p.upvote_count || 0) >= 3
            : p.type === filter

    return matchSearch && matchFilter
  })

  // Helper functions
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'doubt':
        return {
          label: 'Doubt',
          color: '#2563EB',
          bg: '#EFF6FF',
          border: '#BFDBFE',
          icon: '❓'
        }
      case 'discussion':
        return {
          label: 'Discussion',
          color: '#7C3AED',
          bg: '#F5F3FF',
          border: '#DDD6FE',
          icon: '💬'
        }
      case 'experience':
        return {
          label: 'Experience',
          color: '#D97706',
          bg: '#FFFBEB',
          border: '#FDE68A',
          icon: '⭐'
        }
      case 'referral_hunt':
        return {
          label: 'Referral Hunt',
          color: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          icon: '🎯'
        }
      case 'resource':
        return {
          label: 'Resource',
          color: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
          icon: '📚'
        }
      default:
        return {
          label: type,
          color: '#6B7280',
          bg: '#F9FAFB',
          border: '#F3F4F6',
          icon: '📝'
        }
    }
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
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      <Navbar />

      {/* ── PREMIUM HERO BANNER ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
        padding: '60px 20px 48px',
        color: 'white',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(124, 58, 237, 0.2)'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '100px',
            padding: '6px 16px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: 20,
            letterSpacing: '0.1em',
            color: '#A78BFA',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Sparkles size={12} />
            CLASPIRE COMMUNITY
          </div>
          
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            fontWeight: 400,
            margin: '0 0 12px',
            fontFamily: 'var(--font-instrument-serif)',
            lineHeight: 1.1,
            background: 'linear-gradient(to bottom, #FFFFFF, #D1D5DB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            The Heart of College <br /> Conversations
          </h1>
          
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            margin: '0 0 32px',
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: '600px',
            color: '#94A3B8'
          }}>
            Connect with {communities.length}+ college communities. Ask doubts, share experiences, and find career opportunities in a verified senior network.
          </p>

          {/* Search Bar in Hero */}
          <div style={{
            maxWidth: '700px',
            position: 'relative'
          }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                zIndex: 2
              }}
            />
            <input
              type="text"
              placeholder="Search posts, doubts, or @seniors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '18px 24px 18px 54px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                fontFamily: 'Plus Jakarta Sans',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                color: 'white',
                boxSizing: 'border-box',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                e.target.style.borderColor = 'rgba(124, 58, 237, 0.5)';
                e.target.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.2), inset 0 1px 1px rgba(255,255,255,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)';
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 3 COLUMN LAYOUT ── */}
      <div className="feed-grid">

        {/* ════ LEFT SIDEBAR ════ */}
        <div className="left-sidebar">
          {/* My Community Section */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(124, 58, 237, 0.08)',
            padding: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                margin: 0
              }}>
                My Community
              </p>
            </div>

            {userCommunity ? (
              <div
                onClick={() => router.push(`/community/c/${userCommunity.slug}`)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: '12px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
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
                    color: '#1E293B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    c/{userCommunity.slug}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
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
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px', fontWeight: 500 }}>
                  Join your college!
                </p>
                <button
                  onClick={() => router.push('/signup')}
                  style={{
                    width: '100%',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white',
                    background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Get Started →
                </button>
              </div>
            )}
          </div>
          {/* Main Navigation */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(124, 58, 237, 0.08)',
            padding: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            {[
              { key: 'all', label: 'Feed Home', icon: <Globe size={18} /> },
              { key: 'trending', label: 'Trending Now', icon: <TrendingUp size={18} /> },
              { key: 'doubt', label: 'Q&A Section', icon: <HelpCircle size={18} /> },
              { key: 'resource', label: 'Resources', icon: <BookOpen size={18} /> }
            ].map(item => (
              <div
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`nav-item ${filter === item.key ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>

          {/* Categories */}
          <div style={{ padding: '0 16px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#94A3B8',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '24px 0 12px'
            }}>
              Categories
            </p>
            {[
              { key: 'discussion', label: 'Discussions', icon: <Hash size={14} /> },
              { key: 'experience', label: 'Experiences', icon: <Star size={14} /> },
              { key: 'referral_hunt', label: 'Referrals', icon: <Target size={14} /> },
              { key: 'unanswered', label: 'Unanswered', icon: <Filter size={14} /> }
            ].map(item => (
              <div
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 4px',
                  fontSize: '13px',
                  fontWeight: 550,
                  color: filter === item.key ? '#7C3AED' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ opacity: filter === item.key ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Quick Links Card */}
          <div style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
            borderRadius: '20px',
            padding: '24px',
            color: 'white',
            marginTop: 12,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-20%',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(20px)'
            }} />
            <p style={{
              fontSize: '18px',
              fontFamily: 'var(--font-instrument-serif)',
              margin: '0 0 12px',
              position: 'relative'
            }}>
              Premium Access
            </p>
            <p style={{
              fontSize: '12px',
              opacity: 0.8,
              lineHeight: 1.5,
              margin: '0 0 20px',
              position: 'relative'
            }}>
              Unlock placement guides & senior mock interviews.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                background: 'white',
                color: '#7C3AED',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Explore Plans
            </button>
          </div>
        </div>

        {/* ════ CENTER FEED ════ */}
        <div className="feed-wrapper">

          {/* Filter Pills */}
          <div style={{
            position: 'relative',
            marginTop: 16,
            marginBottom: 16
          }}>
            <div
              className="custom-scrollbar"
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 12,
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {[
                {
                  key: 'all',
                  label: 'All'
                },
                {
                  key: 'doubt',
                  label: '❓ Doubts'
                },
                {
                  key: 'discussion',
                  label: '💬 Discussions'
                },
                {
                  key: 'experience',
                  label: '⭐ Experiences'
                },
                {
                  key: 'referral_hunt',
                  label: '🎯 Referrals'
                },
                {
                  key: 'resource',
                  label: '📚 Resources'
                },
                {
                  key: 'unanswered',
                  label: '🔔 Unanswered'
                },
                {
                  key: 'trending',
                  label: '🔥 Trending'
                }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() =>
                    setFilter(f.key as any)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: 100,
                    border: filter === f.key
                      ? 'none'
                      : '1.5px solid #E5E7EB',
                    background: filter === f.key
                      ? 'linear-gradient(135deg,#7C3AED,#06B6D4)'
                      : 'white',
                    color: filter === f.key
                      ? 'white' : '#6B7280',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: filter === f.key
                      ? '0 2px 8px rgba(124,58,237,0.3)'
                      : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Right fade gradient 
      shows more pills exist */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 4,
              width: 40,
              background:
                'linear-gradient(to left, #F5F4FF, transparent)',
              pointerEvents: 'none'
            }}
              className="pills-fade"
            />
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {[1, 2, 3].map(i => (
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
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post: any) => {
              const ts = getTypeStyle(post.type)
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
                  className="post-card"
                >
                  {/* Top Header: Community & Type */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    gap: 12
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      overflow: 'hidden'
                    }}>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/community/c/${post.communities?.slug}`);
                        }}
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#7C3AED',
                          background: 'rgba(124, 58, 237, 0.05)',
                          padding: '4px 10px',
                          borderRadius: '100px',
                          border: '1px solid rgba(124, 58, 237, 0.1)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        c/{post.communities?.slug}
                      </div>
                      <span style={{ fontSize: '10px', color: '#CBD5E1' }}>•</span>
                      <span style={{
                        fontSize: '11px',
                        color: '#64748B',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}>
                        {timeAgo(post.created_at)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: ts.bg,
                      color: ts.color,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      border: `1px solid ${ts.border}`,
                      flexShrink: 0
                    }}>
                      {ts.icon} {ts.label}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 400,
                      color: '#0F172A',
                      margin: '0 0 8px',
                      lineHeight: 1.3,
                      fontFamily: 'var(--font-instrument-serif)',
                      letterSpacing: '-0.01em'
                    }}>
                      {post.title}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#475569',
                      margin: 0,
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontWeight: 450
                    }}>
                      {post.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                      marginBottom: 20
                    }}>
                      {post.tags.slice(0, 4).map((tag: string) => (
                        <span key={tag} style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#64748B',
                          background: '#F1F5F9',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0'
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Action Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    borderTop: '1px solid #F1F5F9'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {/* Author Info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          background: post.users?.role === 'senior' 
                            ? 'linear-gradient(135deg, #059669, #10B981)' 
                            : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {post.users?.full_name?.[0] || 'U'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#1E293B',
                            lineHeight: 1.2
                          }}>
                            {post.users?.full_name}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            color: '#94A3B8',
                            fontWeight: 500
                          }}>
                            {post.users?.role === 'senior' ? 'Verified Senior' : 'Junior Mentee'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      {/* Voting Buttons (Small) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        borderRadius: '10px',
                        padding: '2px',
                        border: '1px solid #E2E8F0'
                      }}>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleVote(post.id, 'upvote')
                          }}
                          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: '8px',
            border: 'none',
            background: votes[post.id]?.userVote === 'upvote' ? 'white' : 'transparent',
            color: votes[post.id]?.userVote === 'upvote' ? '#7C3AED' : '#64748B',
            boxShadow: votes[post.id]?.userVote === 'upvote' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
                        >
                          <ArrowUp size={12} strokeWidth={2.5} />
                          {votes[post.id]?.upvotes || 0}
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleVote(post.id, 'downvote')
                          }}
                          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: '8px',
            border: 'none',
            background: votes[post.id]?.userVote === 'downvote' ? 'white' : 'transparent',
            color: votes[post.id]?.userVote === 'downvote' ? '#EF4444' : '#64748B',
            boxShadow: votes[post.id]?.userVote === 'downvote' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
                        >
                          <ArrowDown size={12} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Answer Count Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          toggleAnswerSection(post.id)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#7C3AED',
                          background: 'rgba(124, 58, 237, 0.05)',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageCircle size={12} strokeWidth={2.5} />
                        {post.answer_count || 0} Answers
                      </button>
                    </div>
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

                  {/* ── INLINE ANSWER SECTION (YouTube-style) ── */}
                  {expandedPost === post.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        marginTop: 12,
                        borderTop: '1px solid #F3F4F6',
                        paddingTop: 12
                      }}
                    >
                      {/* Answers Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12
                      }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <MessageCircle size={13} color="#7C3AED" />
                          {postAnswers[post.id]?.length || 0} Answers
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#7C3AED',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Plus Jakarta Sans',
                            padding: 0
                          }}
                        >
                          View Full Post →
                        </button>
                      </div>

                      {/* Loading */}
                      {answersLoading[post.id] && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px 0',
                          gap: 8
                        }}>
                          <div style={{
                            width: 14, height: 14,
                            border: '2px solid #EDE9FE',
                            borderTop: '2px solid #7C3AED',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }} />
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                            Loading answers...
                          </span>
                        </div>
                      )}

                      {/* Answers list */}
                      {!answersLoading[post.id] && postAnswers[post.id]?.length === 0 && (
                        <div style={{
                          padding: '12px 0',
                          textAlign: 'center'
                        }}>
                          <p style={{
                            fontSize: 11,
                            color: '#9CA3AF',
                            margin: 0,
                            fontWeight: 500
                          }}>
                            No answers yet — be the first to help!
                          </p>
                        </div>
                      )}

                      {!answersLoading[post.id] && postAnswers[post.id]?.map((answer: any) => (
                        <div
                          key={answer.id}
                          style={{
                            display: 'flex',
                            gap: 8,
                            padding: '10px 0',
                            borderBottom: '1px solid #F9FAFB'
                          }}
                        >
                          {/* Answer avatar */}
                          <div style={{
                            width: 26, height: 26,
                            borderRadius: 7,
                            background: answer.users?.role === 'senior'
                              ? 'linear-gradient(135deg,#059669,#34D399)'
                              : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: 2
                          }}>
                            {answer.users?.full_name?.[0] || 'U'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                              flexWrap: 'wrap'
                            }}>
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#1F2937'
                              }}>
                                {answer.users?.full_name}
                              </span>
                              {answer.users?.role === 'senior' && (
                                <span style={{
                                  fontSize: 8,
                                  fontWeight: 700,
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  padding: '1px 4px',
                                  borderRadius: 100,
                                  border: '1px solid #A7F3D0'
                                }}>
                                  SENIOR
                                </span>
                              )}
                              {answer.is_accepted && (
                                <span style={{
                                  fontSize: 8,
                                  fontWeight: 700,
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  padding: '1px 4px',
                                  borderRadius: 100,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}>
                                  <CheckCircle size={8} /> ACCEPTED
                                </span>
                              )}
                              <span style={{
                                fontSize: 9,
                                color: '#D1D5DB',
                                fontWeight: 500
                              }}>
                                {timeAgo(answer.created_at)}
                              </span>
                            </div>
                            <p style={{
                              fontSize: 12,
                              color: '#4B5563',
                              margin: 0,
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {answer.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Answer input */}
                      <div style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 10,
                        alignItems: 'flex-end'
                      }}>
                        <textarea
                          value={newAnswerText[post.id] || ''}
                          onChange={e => setNewAnswerText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Write your answer..."
                          rows={1}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1.5px solid #EEEBFF',
                            fontSize: 12,
                            fontFamily: 'Plus Jakarta Sans',
                            color: '#374151',
                            outline: 'none',
                            resize: 'none',
                            minHeight: 36,
                            maxHeight: 120,
                            lineHeight: 1.4,
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s'
                          }}
                          onFocus={e => e.target.style.borderColor = '#7C3AED'}
                          onBlur={e => e.target.style.borderColor = '#EEEBFF'}
                          onInput={e => {
                            const target = e.target as HTMLTextAreaElement
                            target.style.height = 'auto'
                            target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                          }}
                        />
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            submitInlineAnswer(post.id)
                          }}
                          disabled={!newAnswerText[post.id]?.trim() || answerSubmitting[post.id]}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: !newAnswerText[post.id]?.trim() || answerSubmitting[post.id]
                              ? 'not-allowed' : 'pointer',
                            background: !newAnswerText[post.id]?.trim() || answerSubmitting[post.id]
                              ? '#E5E7EB'
                              : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                            color: 'white',
                            flexShrink: 0,
                            transition: 'all 0.15s'
                          }}
                        >
                          {answerSubmitting[post.id] ? (
                            <div style={{
                              width: 14, height: 14,
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div className="right-sidebar">
          {/* Top Communities Hub */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            border: '1px solid rgba(124, 58, 237, 0.08)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <TrendingUp size={16} color="#7C3AED" />
                Community Hub
              </span>
            </div>

            <div style={{ padding: '8px' }}>
              {communities.slice(0, 4).map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/community/c/${c.slug}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: i === 0 
                      ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' 
                      : i === 1 
                      ? 'linear-gradient(135deg, #059669, #10B981)'
                      : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: i < 2 ? 'white' : '#64748B',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    {c.colleges?.short_name?.[0] || 'C'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#1E293B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      c/{c.slug}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                      {c.member_count || 0} active members
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              onClick={() => router.push('/colleges')}
              style={{
                padding: '16px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#7C3AED',
                cursor: 'pointer',
                textAlign: 'center',
                background: '#F5F3FF',
                borderTop: '1px solid rgba(124, 58, 237, 0.1)'
              }}
            >
              Explore All Colleges ↗
            </div>
          </div>

          {/* Suggested For You */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            border: '1px solid rgba(124, 58, 237, 0.08)',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1E293B',
              margin: '0 0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Sparkles size={16} color="#059669" />
              Suggested For You
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {communities
                .filter(c => c.slug !== userCommunity?.slug)
                .slice(0, 3)
                .map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748B',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      {c.colleges?.short_name?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.colleges?.short_name}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                        {c.colleges?.location}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/community/c/${c.slug}`)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        background: 'white',
                        color: '#64748B',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#7C3AED';
                        e.currentTarget.style.color = '#7C3AED';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.color = '#64748B';
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Stats Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '24px',
            padding: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{
              position: 'absolute',
              top: '-10%',
              right: '-10%',
              width: '120px',
              height: '120px',
              background: 'rgba(124, 58, 237, 0.15)',
              borderRadius: '50%',
              filter: 'blur(30px)'
            }} />

            <h4 style={{
              fontSize: '18px',
              fontFamily: 'var(--font-instrument-serif)',
              margin: '0 0 20px',
              letterSpacing: '0.01em',
              position: 'relative'
            }}>
              Platform Ecosystem
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              {[
                { label: 'Verified Communities', value: communities.length, icon: <Building2 size={14} /> },
                { label: 'Active Members', value: communities.reduce((a, c) => a + (c.member_count || 0), 0), icon: <Globe size={14} /> },
                { 
                  label: 'New Posts Today', 
                  value: posts.filter((p: any) => {
                    const today = new Date().toDateString();
                    return new Date(p.created_at).toDateString() === today;
                  }).length,
                  icon: <Zap size={14} /> 
                }
              ].map((stat, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.8, fontSize: '12px' }}>
                    {stat.icon}
                    {stat.label}
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 400, fontFamily: 'var(--font-instrument-serif)' }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
        </div>
      </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.5 }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(124, 58, 237, 0.2) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(124, 58, 237, 0.2);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(124, 58, 237, 0.4);
        }

        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            scrollbar-width: none;
          }
        }

        .left-sidebar { 
            position: sticky;
            top: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .right-sidebar { 
            position: sticky;
            top: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            min-width: 0;
        }

        .feed-grid {
            max-width: 1280px;
            margin: 40px auto;
            padding: 0 32px;
            display: grid;
            grid-template-columns: 240px minmax(0, 1fr) 320px;
            gap: 32px;
            align-items: start;
            box-sizing: border-box;
        }

        .feed-wrapper {
            min-width: 0;
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .post-card {
            background: white;
            border-radius: 20px;
            border: 1px solid rgba(124, 58, 237, 0.08);
            padding: 24px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            position: relative;
            z-index: 1;
        }

        .post-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(124, 58, 237, 0.06);
            border-color: rgba(124, 58, 237, 0.2);
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #64748B;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .nav-item:hover {
            background: rgba(124, 58, 237, 0.05);
            color: #7C3AED;
        }

        .nav-item.active {
            background: #F5F3FF;
            color: #7C3AED;
        }

        /* Desktop: 3 columns */
        @media (min-width: 1025px) {
          .feed-grid {
            grid-template-columns: 240px minmax(0,1fr) 320px;
          }
          .pills-fade {
            display: none;
          }
        }

        /* Tablet: 2 columns */
        @media (max-width: 1024px) and (min-width: 769px) {
          .feed-grid {
            grid-template-columns: minmax(0,1fr) 280px;
            gap: 24px;
            padding: 0 24px;
          }
          .left-sidebar { 
            display: none; 
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .feed-grid {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
            margin: 0 !important;
            gap: 16px !important;
          }
          .left-sidebar, .right-sidebar { 
            display: none !important; 
          }
          .post-card {
            padding: 20px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      {/* Floating Create Post Button */}
      <button
        className="floating-create-btn"
        onClick={async () => {
          // Check if user is logged in
          try {
            const authRes = await fetch('/api/auth/me')
            if (!authRes.ok) {
              router.push('/login')
              return
            }
            const authData = await authRes.json()
            if (!authData.user) {
              router.push('/login')
              return
            }

            // Check if user has a community
            if (userCommunity) {
              // Redirect to user's community with post modal open
              router.push(`/community/c/${userCommunity.slug}?create=true`)
            } else {
              // Scroll to communities section to find their college
              const element = document.getElementById('communities-section')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }
          } catch (error) {
            console.error('Auth check failed:', error)
            router.push('/login')
          }
        }}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)'
        }}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
