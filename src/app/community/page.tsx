'use client'
import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePoints } from '@/contexts/PointsContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Search, LayoutGrid, HelpCircle,
  MessageCircle, Clock, TrendingUp,
  ArrowUp, ArrowDown, CheckCircle,
  Eye, ChevronRight, Briefcase,
  Video, Building2, Crown, Zap,
  Hash, Star, Shield, Globe,
  BookOpen, Target, Send, X, ChevronDown, ChevronUp, Sparkles, Filter, Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationPrompt from '@/components/NotificationPrompt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

// Utility function to convert URLs to clickable links
const convertUrlsToLinks = (text: string) => {
  if (!text) return text
  
  // Improved URL regex pattern - more precise matching
  const urlPattern = /(https?:\/\/[^\s\)]+)/g
  
  // Find all matches first
  const matches = text.match(urlPattern) || []
  
  if (matches.length === 0) {
    return <span>{text}</span>
  }
  
  // Create result array with text and links
  const result: React.ReactNode[] = []
  let lastIndex = 0
  
  matches.forEach((match, index) => {
    // Add text before the URL
    const textBefore = text.substring(lastIndex, text.indexOf(match))
    if (textBefore) {
      result.push(
        <span key={`text-${index}`} style={{ 
          display: 'inline',
          verticalAlign: 'baseline',
          lineHeight: 'inherit'
        }}>
          {textBefore}
        </span>
      )
    }
    
    // Add the link
    result.push(
      <a
        key={`link-${index}`}
        href={match}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation()
          const target = e.currentTarget as HTMLElement
          target.style.color = '#6D28D9'
          target.style.textDecoration = 'underline'
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLElement
          target.style.color = '#7C3AED'
          target.style.textDecoration = 'none'
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement
          target.style.color = '#7C3AED'
          target.style.textDecoration = 'underline'
        }}
        style={{
          color: '#7C3AED',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontWeight: 500,
          position: 'relative',
          zIndex: 10,
          display: 'inline',
          verticalAlign: 'baseline',
          lineHeight: 'inherit',
          margin: '0 2px'
        }}
      >
        {match}
      </a>
    )
    
    // Update last index
    lastIndex = text.indexOf(match) + match.length
  })
  
  // Add remaining text after last URL
  const textAfter = text.substring(lastIndex)
  if (textAfter) {
    result.push(
      <span key={`text-final`} style={{ 
        display: 'inline',
        verticalAlign: 'baseline',
        lineHeight: 'inherit'
      }}>
        {textAfter}
      </span>
    )
  }
  
  return result
}

function CommunityPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldCreate = searchParams.get('create') === 'true'
  const { user } = useAuth()
  const { showAward } = usePoints()
  const [communities, setCommunities] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filter, setFilter] = useState('all')
  const [hideHeader, setHideHeader] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [userCommunity, setUserCommunity] = useState<any>(null)
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)

  // Inline answer section state
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [postAnswers, setPostAnswers] = useState<Record<string, any[]>>({})
  const [answersLoading, setAnswersLoading] = useState<Record<string, boolean>>({})
  const [newAnswerText, setNewAnswerText] = useState<Record<string, string>>({})
  const [answerSubmitting, setAnswerSubmitting] = useState<Record<string, boolean>>({})

  // Content expansion state
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({})

  // Performance optimization states
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  // Toggle content expansion
  const toggleContentExpansion = (postId: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false)
    setSelectedImage('')
  }

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

      // Initialize votes state for all posts
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
  
  // Handle redirect if create=true is present
  useEffect(() => {
    if (shouldCreate && userCommunity) {
      router.push(`/community/c/${userCommunity.slug}?create=true`)
    }
  }, [shouldCreate, userCommunity, router])

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

  // Fetch answers for a post with performance optimizations
  const fetchPostAnswers = async (postId: string) => {
    if (postAnswers[postId]) return // Already cached
    
    setAnswersLoading(prev => ({ ...prev, [postId]: true }))
    try {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          id,
          content,
          created_at,
          is_accepted,
          upvote_count,
          author_id,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(10) // Limit answers to improve performance

      if (!error && data) {
        setPostAnswers(prev => ({ ...prev, [postId]: data }))
      }
    } catch (err) {
      console.error('Error fetching answers:', err)
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

  const enrichCommunitiesWithLiveCounts = async (list: any[]) => {
    if (!list.length) return list
    try {
      const res = await fetch('/api/colleges')
      const data = await res.json()
      if (!data.success || !data.communities?.length) return list

      const countsBySlug = new Map(
        data.communities.map((c: any) => [c.slug, c.member_count || 0])
      )
      const seniorsBySlug = new Map(
        data.communities.map((c: any) => [c.slug, c.senior_count || 0])
      )

      return [...list]
        .map((c) => ({
          ...c,
          member_count: Math.max(
            c.member_count || 0,
            countsBySlug.get(c.slug) || 0
          ),
          senior_count: Math.max(
            c.senior_count || 0,
            seniorsBySlug.get(c.slug) || 0
          ),
        }))
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    } catch (err) {
      console.error('Failed to enrich community member counts:', err)
      return list
    }
  }

  const fetchCommunities = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setPage(1)
    }
    
    try {
      console.log('Fetching communities and posts...', { page, loadMore })

      // Fetch communities with optimized query (only on initial load)
      if (!loadMore) {
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
          .limit(20) // Limit communities to improve performance
        
        if (!communitiesError && communitiesData && communitiesData.length > 0) {
          setCommunities(await enrichCommunitiesWithLiveCounts(communitiesData))
        } else {
          const { data: collegesData, error: collegesError } = await supabase
            .from('colleges')
            .select('id, name, short_name, slug, location, state, type, email_domain')
            .order('name', { ascending: true })
            .limit(20)

          if (!collegesError && collegesData) {
            const fallback = collegesData.map((college: any) => ({
              id: college.id,
              slug: college.slug,
              display_name: college.short_name || college.name,
              description: `${college.name} community on Claspire`,
              member_count: 0,
              senior_count: 0,
              doubt_count: 0,
              colleges: college
            }))
            setCommunities(await enrichCommunitiesWithLiveCounts(fallback))
          }
        }
      }

      // Fetch posts with pagination
      const currentPage = loadMore ? page : 1
      const limit = 20
      const offset = (currentPage - 1) * limit

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          type,
          created_at,
          upvote_count,
          downvote_count,
          answer_count,
          is_answered,
          tags,
          image_url,
          author_id,
          users!posts_author_id_fkey (
            full_name, 
            unique_id,
            role, 
            is_verified, 
            avatar_url
          ),
          communities (
            slug,
            colleges ( name, short_name )
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!postsError && postsData) {
        if (loadMore) {
          setPosts(prev => [...prev, ...postsData])
        } else {
          setPosts(postsData)
        }
        
        // Check if there are more posts to load
        setHasMore(postsData.length === limit)
        if (loadMore) {
          setPage(prev => prev + 1)
        } else {
          setPage(2)
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      if (loadMore) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [])

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loadingMore || loading) return

      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      // Load more when user is 500px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        fetchCommunities(true)
      }
    }

    // Add scroll listener with throttling
    let timeoutId: NodeJS.Timeout
    const throttledHandleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 200)
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [hasMore, loadingMore, loading, page])

  // Hide header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setHideHeader(true)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setHideHeader(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

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

  // Debug logging
  console.log('Community Debug:', { 
    loading, 
    postsLength: posts.length, 
    filteredPostsLength: filteredPosts.length, 
    filter, 
    search 
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
      <NotificationPrompt />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>

      {/* Search overlay — opens when icon clicked */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setShowSearch(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4">
              <Search size={20} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search posts, doubts, or @seniors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
              />
              <button 
                onClick={() => setShowSearch(false)}
                className="text-xs font-bold text-purple-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REDDIT-STYLE FIXED LAYOUT ── */}
      <div className="feed-grid" style={{
        position: 'relative',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px 0',
        minHeight: 'calc(100vh - 96px)',
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 1fr) 320px',
        gap: '24px',
        alignItems: 'start',
        boxSizing: 'border-box',
        width: '100%',
        zIndex: 1,
        marginTop: '30px'
      }}>

        {/* ════ LEFT SIDEBAR ════ */}
        <div style={{
          position: 'relative',
          paddingRight: '8px'
        }}
        className="left-sidebar">
          {/* My Community Section */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.background = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.background = 'transparent'
                }}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 10,
                  background: (userCommunity.slug === 'aaacet' || userCommunity.slug === 'vvvclg' || userCommunity.slug === 'vvv' || userCommunity.slug === 'anjac' || userCommunity.slug === 'sfr' || userCommunity.slug === 'skc' || userCommunity.slug === 'kamaraj' || userCommunity.slug === 'agpc') ? 'white' : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  border: (userCommunity.slug === 'aaacet' || userCommunity.slug === 'vvvclg' || userCommunity.slug === 'vvv' || userCommunity.slug === 'anjac' || userCommunity.slug === 'sfr' || userCommunity.slug === 'skc' || userCommunity.slug === 'kamaraj' || userCommunity.slug === 'agpc') ? '1px solid #F1F5F9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  overflow: 'hidden',
                  padding: (userCommunity.slug === 'aaacet' || userCommunity.slug === 'vvvclg' || userCommunity.slug === 'vvv' || userCommunity.slug === 'anjac' || userCommunity.slug === 'sfr' || userCommunity.slug === 'skc' || userCommunity.slug === 'kamaraj' || userCommunity.slug === 'agpc') ? '4px' : '0'
                }}>
                  {userCommunity.slug === 'aaacet' ? (
                    <img src="/aaaclg_logo.jpg" alt="AAACET" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (userCommunity.slug === 'vvvclg' || userCommunity.slug === 'vvv') ? (
                    <img src="/vvvclogo.png" alt="VVV" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : userCommunity.slug === 'anjac' ? (
                    <img src="/anjac.jpg" alt="ANJAC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : userCommunity.slug === 'sfr' ? (
                    <img src="/sfr.jpg" alt="SFR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : userCommunity.slug === 'skc' ? (
                    <img src="/skc.jpg" alt="SKC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : userCommunity.slug === 'kamaraj' ? (
                    <img src="/kamaraj.jpg" alt="Kamaraj" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : userCommunity.slug === 'agpc' ? (
                    <img src="/agpc.jpg" alt="AGPC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    userCommunity.colleges?.short_name?.[0] || 'C'
                  )}
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
                    color: '#94A3B8',
                    margin: '0 0 10px',
                    padding: '12px 24px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1E293B, #06B6D4)',
                    border: '1px solid #1E293B',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
          {/* Main Navigation */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
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
        </div>

        {/* ════ CENTER FEED ════ */}
        <div style={{
          minWidth: 0,
          paddingRight: '8px',
          paddingTop: '0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          zIndex: 2
        }}>

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
                  padding: '20px 20px 0px', // Removed bottom padding
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
            <div>
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
                    <div
                      onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
                      style={{
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 400,
                        color: '#0F172A',
                        margin: '0 0 8px',
                        lineHeight: 1.3,
                        fontFamily: 'var(--font-instrument-serif)',
                        letterSpacing: '-0.01em',
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'left',
                        wordWrap: 'break-word',
                        transition: 'opacity 0.2s ease'
                      }}>
                        {convertUrlsToLinks(post.title)}
                      </h3>
                    </div>

                    <p style={{
                      color: '#475569',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      margin: 0,
                      display: expandedContent[post.id] ? 'block' : '-webkit-box',
                      WebkitLineClamp: expandedContent[post.id] ? 'unset' : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontWeight: 450,
                      position: 'relative',
                      zIndex: 1,
                      textAlign: 'left',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {convertUrlsToLinks(post.content)}
                    </p>
                    
                    {/* Show "more" button if content is long and not expanded */}
                    {!expandedContent[post.id] && post.content && post.content.length > 150 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleContentExpansion(post.id)
                        }}
                        style={{
                          color: '#7C3AED',
                          fontSize: '14px',
                          fontWeight: 500,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 0',
                          marginTop: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        ...more
                      </button>
                    )}
                    
                    {/* Show "less" button if content is expanded */}
                    {expandedContent[post.id] && post.content && post.content.length > 150 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleContentExpansion(post.id)
                        }}
                        style={{
                          color: '#7C3AED',
                          fontSize: '14px',
                          fontWeight: 500,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 0',
                          marginTop: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        ...less
                      </button>
                    )}
                    {post.image_url && (
                      <div style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        marginTop: 16,
                        border: '1px solid #F1F5F9'
                      }}>
                        <img
                          src={post.image_url}
                          alt="Post"
                          style={{
                            width: '100%',
                            maxHeight: 300,
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onClick={e => {
                            e.stopPropagation()
                            handleImageClick(post.image_url)
                          }}
                        />
                      </div>
                    )}
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
                      {post.users && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          background: post.users?.avatar_url 
                            ? 'transparent' 
                            : (post.users?.role === 'senior' 
                                ? 'linear-gradient(135deg, #059669, #10B981)' 
                                : 'linear-gradient(135deg, #7C3AED, #4F46E5)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          overflow: 'hidden'
                        }}>
                          {post.users?.avatar_url ? (
                            <img 
                              src={post.users.avatar_url} 
                              alt={post.users?.full_name || 'User'} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            post.users?.full_name?.[0] || 'U'
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/u/${post.users?.unique_id}`)
                            }}
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#1E293B',
                              lineHeight: 1.2,
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              textAlign: 'left',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = '#7C3AED';
                              (e.currentTarget as HTMLElement).style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = '#1E293B';
                              (e.currentTarget as HTMLElement).style.textDecoration = 'none';
                            }}
                          >
                            {post.users?.full_name}
                          </button>
                          <span style={{
                            fontSize: '10px',
                            color: '#94A3B8',
                            fontWeight: 500
                          }}>
                            {post.users?.role === 'senior' ? 'Verified Senior' : 'Junior Mentee'}
                          </span>
                        </div>
                      </div>
                      )}
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
                            background: answer.users?.avatar_url 
                              ? 'transparent' 
                              : (answer.users?.role === 'senior'
                                  ? 'linear-gradient(135deg,#059669,#34D399)'
                                  : 'linear-gradient(135deg,#7C3AED,#06B6D4)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: 2,
                            overflow: 'hidden'
                          }}>
                            {answer.users?.avatar_url ? (
                              <img 
                                src={answer.users.avatar_url} 
                                alt={answer.users.full_name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              answer.users?.full_name?.[0] || 'U'
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                              flexWrap: 'wrap'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/u/${answer.users?.unique_id}`)
                                }}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#1F2937',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.color = '#7C3AED';
                                  (e.currentTarget as HTMLElement).style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.color = '#1F2937';
                                  (e.currentTarget as HTMLElement).style.textDecoration = 'none';
                                }}
                              >
                                {answer.users?.full_name}
                              </button>
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
          
          {/* Infinite Scroll Loading Indicator */}
          {loadingMore && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              gap: '8px'
            }}>
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid #E5E7EB',
                borderTop: '2px solid #7C3AED',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 500
              }}>
                Loading more posts...
              </span>
            </div>
          )}
          
          {/* End of posts indicator */}
          {!hasMore && posts.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#9CA3AF',
              fontSize: '12px',
              fontWeight: 500
            }}>
              You've reached the end! 🎉
            </div>
          )}
          </div>
        )}
      </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div style={{
          position: 'relative',
          paddingLeft: '8px'
        }}
        className="right-sidebar">
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
                    background: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr' || c.slug === 'skc' || c.slug === 'kamaraj' || c.slug === 'agpc') ? '#F8FAFC' : (i === 0 ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : i === 1 ? 'linear-gradient(135deg, #059669, #10B981)' : '#F1F5F9'),
                    border: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr' || c.slug === 'skc' || c.slug === 'kamaraj' || c.slug === 'agpc') ? '1px solid #F1F5F9' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: (c.slug === 'aaacet' || c.slug === 'vvvclg' || c.slug === 'vvv' || c.slug === 'anjac' || c.slug === 'sfr') ? '4px' : '0',
                    flexShrink: 0,
                    color: i < 2 ? 'white' : '#64748B',
                    fontSize: '13px',
                    fontWeight: 800
                  }}>
                    {c.slug === 'aaacet' ? (
                      <img src="/aaaclg_logo.jpg" alt="AAACET" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : (c.slug === 'vvvclg' || c.slug === 'vvv') ? (
                      <img src="/vvvclogo.png" alt="VVV" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : c.slug === 'anjac' ? (
                      <img src="/anjac.jpg" alt="ANJAC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : c.slug === 'sfr' ? (
                      <img src="/sfr.jpg" alt="SFR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : c.slug === 'skc' ? (
                      <img src="/skc.jpg" alt="SKC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : c.slug === 'kamaraj' ? (
                      <img src="/kamaraj.jpg" alt="Kamaraj" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : c.slug === 'agpc' ? (
                      <img src="/agpc.jpg" alt="AGPC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : (
                      c.colleges?.short_name?.[0] || c.slug?.[0]?.toUpperCase() || 'C'
                    )}
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
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
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
            borderRadius: '8px',
            padding: '24px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{
              position: 'absolute',
              top: '-5%',
              right: '-5%',
              width: '80px',
              height: '80px',
              background: 'rgba(124, 58, 237, 0.1)',
              borderRadius: '50%',
              filter: 'blur(20px)',
              zIndex: 0
            }} />

            <h4 style={{
              fontSize: '15px',
              fontWeight: 700,
              margin: '0 0 20px',
              letterSpacing: '0.01em',
              position: 'relative',
              zIndex: 1
            }}>
              Platform Ecosystem
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
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
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
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
            border-radius: 8px;
            border: 1px solid #E2E8F0;
            padding: 24px;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            position: relative;
            z-index: 1;
        }

        .post-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
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

        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
        }

        /* Hide scrollbar for right sidebar */
        .right-sidebar::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
        }

        .right-sidebar {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
        }

        /* Additional scrollbar hiding */
        .right-sidebar *::-webkit-scrollbar {
            display: none !important;
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
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
            width: 100vw !important;
          }
          * {
            box-sizing: border-box !important;
          }
          .feed-grid {
            grid-template-columns: 1fr !important;
            padding: 0 !important;
            margin: 0 !important;
            gap: 0 !important;
            max-width: 100vw !important;
            width: 100vw !important;
            overflow-x: hidden !important;
            margin-top: 60px !important;
          }
          .left-sidebar, .right-sidebar { 
            display: none !important; 
          }
          .post-card {
            padding: 20px !important;
            border-radius: 8px !important;
            margin: 0 16px 16px !important;
          }
        }
      `}</style>

      <NotificationPrompt />
      
      {/* Floating Action Button for Desktop */}
      <button
        onClick={() => router.push('?create=true')}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        className="desktop-fab"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(124, 58, 237, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.4)'
        }}
      >
        <Plus size={28} color="white" strokeWidth={3} />
      </button>
      
      <style>{`
        .desktop-fab {
          display: flex !important;
        }
        
        @media (max-width: 768px) {
          .desktop-fab {
            display: none !important;
          }
        }
      `}</style>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}
              />
              
              {/* Close button */}
              <button
                onClick={closeImageModal}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <X size={20} />
              </button>

              {/* Download button */}
              <a
                href={selectedImage}
                download
                style={{
                  position: 'absolute',
                  bottom: '-40px',
                  right: '0px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
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
          Loading community hub...
        </p>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  )
}
