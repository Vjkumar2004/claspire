'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePoints } from '@/contexts/PointsContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Search, HelpCircle, MessageSquare, Clock, TrendingUp,
  ArrowUp, ArrowDown, CheckCircle, Eye, ChevronRight, Briefcase,
  Building2, Crown, Zap, Hash, Star, Shield, Globe,
  BookOpen, Target, Send, X, Sparkles, Filter, Plus,
  Image, FileText, Share2, MoreHorizontal, Bookmark, ThumbsUp, MessageCircle,
  ChevronUp, ChevronDown, Award, GraduationCap, MapPin, UserCheck, Activity
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
  const urlPattern = /(https?:\/\/[^\s\)]+)/g
  const matches = text.match(urlPattern) || []

  if (matches.length === 0) {
    return <span>{text}</span>
  }

  const result: React.ReactNode[] = []
  let lastIndex = 0

  matches.forEach((match, index) => {
    const textBefore = text.substring(lastIndex, text.indexOf(match))
    if (textBefore) {
      result.push(<span key={`text-${index}`}>{textBefore}</span>)
    }

    result.push(
      <a
        key={`link-${index}`}
        href={match}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[#7C3AED] hover:underline font-semibold"
      >
        {match}
      </a>
    )
    lastIndex = text.indexOf(match) + match.length
  })

  const textAfter = text.substring(lastIndex)
  if (textAfter) {
    result.push(<span key={`text-final`}>{textAfter}</span>)
  }

  return result
}

function CommunityPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldCreate = searchParams.get('create') === 'true'
  const { user } = useAuth()
  const { showAward } = usePoints()

  // Base state listings
  const [communities, setCommunities] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filter, setFilter] = useState('all')
  const [userCommunity, setUserCommunity] = useState<any>(null)

  // Phase 2 optimization states
  const [feedSearchQuery, setFeedSearchQuery] = useState('')
  const [profileUser, setProfileUser] = useState<any>(null)

  // Direct Messaging Overhaul States (Phase 3)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [chatThreads, setChatThreads] = useState<any[]>([])
  const [activeChatUser, setActiveChatUser] = useState<any>(null)
  const [drawerMessages, setDrawerMessages] = useState<any[]>([])
  const [drawerNewMessage, setDrawerNewMessage] = useState('')
  const [drawerChatLoading, setDrawerChatLoading] = useState(false)
  const [drawerChatSending, setDrawerChatSending] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const drawerScrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)

  // Inline answer states
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [postAnswers, setPostAnswers] = useState<Record<string, any[]>>({})
  const [answersLoading, setAnswersLoading] = useState<Record<string, boolean>>({})
  const [newAnswerText, setNewAnswerText] = useState<Record<string, string>>({})
  const [answerSubmitting, setAnswerSubmitting] = useState<Record<string, boolean>>({})

  // Content expansion state
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({})

  // Pagination / Load more
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  // Votes state
  const [votes, setVotes] = useState<Record<string, {
    userVote: 'upvote' | 'downvote' | null
    upvotes: number
    downvotes: number
    isLoading: boolean
    error: string | null
  }>>({})

  // Campus Placements (real jobs)
  const [campusJobs, setCampusJobs] = useState<any[]>([])

  const toggleContentExpansion = (postId: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

  const closeImageModal = () => {
    setShowImageModal(false)
    setSelectedImage('')
  }

  // Fetch full details of the authenticated user to render rich profile identity card
  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setProfileUser(data.user)
          }
        }
      } catch (err) {
        console.error('Failed to load profile details:', err)
      }
    }
    fetchFullProfile()
  }, [user])

  // Fetch real campus placement jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('id, role, company_name, location, job_type, salary_range, referral_available, is_active, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5)
        if (!error && data) {
          setCampusJobs(data)
        }
      } catch (err) {
        console.error('Failed to fetch campus jobs:', err)
      }
    }
    fetchJobs()
  }, [])

  // Fetch active conversations and accepted connections dynamically
  useEffect(() => {
    const fetchChatWidgetData = async () => {
      try {
        const threadsMap = new Map()

        // 1. Fetch active conversations from /api/messages/list
        const resList = await fetch('/api/messages/list')
        if (resList.ok) {
          const listData = await resList.json()
          const convs = listData.conversations || []
          convs.forEach((conv: any) => {
            const oId = conv.otherUserId
            if (oId && !threadsMap.has(oId)) {
              threadsMap.set(oId, {
                id: oId,
                users: {
                  id: oId,
                  full_name: conv.otherUser?.full_name || 'Alumni Partner',
                  avatar_url: conv.otherUser?.avatar_url || null,
                  role: 'member'
                }
              })
            }
          })
        }

        // 2. Fetch accepted message requests for juniors (mentors) - student role ONLY
        if (profileUser.role === 'student') {
          const resSeniors = await fetch('/api/message-requests/accepted-seniors')
          if (resSeniors.ok) {
            const seniorsData = await resSeniors.json()
            const seniors = seniorsData.seniors || []
            seniors.forEach((s: any) => {
              const oId = s.senior_id
              if (oId && !threadsMap.has(oId)) {
                threadsMap.set(oId, {
                  id: oId,
                  users: {
                    id: oId,
                    full_name: s.full_name,
                    avatar_url: s.avatar_url || null,
                    role: 'senior'
                  }
                })
              }
            })
          }
        }

        const threadsList = Array.from(threadsMap.values())
        setChatThreads(threadsList)
      } catch (err) {
        console.error('Failed to load chat drawer details:', err)
        setChatThreads([])
      }
    }

    if (profileUser) {
      fetchChatWidgetData()
    }
  }, [profileUser])

  // Polling chat messages inside the interactive drawer/bottom sheet
  useEffect(() => {
    if (!activeChatUser || !profileUser?.id) return

    let isMounted = true
    setDrawerChatLoading(true)

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/messages/history?userId=${activeChatUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.messages && Array.isArray(data.messages)) {
            setDrawerMessages(data.messages)
          }
        }
      } catch (err) {
        console.error('Failed to poll chat history inside drawer:', err)
      } finally {
        if (isMounted) setDrawerChatLoading(false)
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [activeChatUser, profileUser])

  // Auto Scroll to bottom for messages inside drawer/bottom sheet
  useEffect(() => {
    if (drawerScrollRef.current) {
      drawerScrollRef.current.scrollTop = drawerScrollRef.current.scrollHeight
    }
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTop = mobileScrollRef.current.scrollHeight
    }
  }, [drawerMessages])

  const sendDrawerMessage = async () => {
    const text = drawerNewMessage.trim()
    if (!text || !activeChatUser || drawerChatSending || !profileUser?.id) return

    setDrawerChatSending(true)
    setDrawerNewMessage('')

    const conversationId = [profileUser.id, activeChatUser.id].sort().join('_')
    const optMsg = {
      id: `temp-${Date.now()}`,
      sender_id: profileUser.id,
      receiver_id: activeChatUser.id,
      content: text,
      created_at: new Date().toISOString(),
      conversation_id: conversationId
    }

    setDrawerMessages(prev => [...prev, optMsg])

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeChatUser.id,
          content: text
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setDrawerMessages(prev => prev.map(m => m.id === optMsg.id ? data.message : m))
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        setDrawerMessages(prev => prev.filter(m => m.id !== optMsg.id))
        if (errorData.error === 'not_connected') {
          alert('You are not connected with this user yet. Mentorship messages require an accepted request connection. Go to their profile to request a connection!')
        } else {
          alert(errorData.error || 'Failed to send message')
        }
      }
    } catch (err) {
      console.error('Failed to send message inside drawer:', err)
      setDrawerMessages(prev => prev.filter(m => m.id !== optMsg.id))
      alert('Network error. Please try again.')
    } finally {
      setDrawerChatSending(false)
    }
  }

  // Initialize votes
  useEffect(() => {
    if (!posts.length) return

    const fetchUserVotes = async () => {
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

      const v: Record<string, any> = {}
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

  // Get user college community
  useEffect(() => {
    const getUserCommunity = async () => {
      try {
        const authRes = await fetch('/api/auth/me')
        if (authRes.ok) {
          const authData = await authRes.json()
          const user = authData.user
          if (user && user.college_id) {
            const mine = communities.find(c => c.colleges?.id === user.college_id)
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

  useEffect(() => {
    if (shouldCreate && userCommunity) {
      router.push(`/community/c/${userCommunity.slug}?create=true`)
    }
  }, [shouldCreate, userCommunity, router])

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    let userId: string
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
      userId = authData.user.id
    } catch (error) {
      router.push('/login')
      return
    }

    const currentVote = votes[postId]
    if (!currentVote || currentVote.isLoading) return

    const previousState = { ...currentVote }
    let optimisticUpdate: Partial<typeof currentVote>

    if (currentVote.userVote === voteType) {
      optimisticUpdate = {
        userVote: null,
        upvotes: voteType === 'upvote' ? Math.max(0, currentVote.upvotes - 1) : currentVote.upvotes,
        downvotes: voteType === 'downvote' ? Math.max(0, currentVote.downvotes - 1) : currentVote.downvotes,
        isLoading: true,
        error: null
      }
    } else if (currentVote.userVote === null) {
      optimisticUpdate = {
        userVote: voteType,
        upvotes: voteType === 'upvote' ? currentVote.upvotes + 1 : currentVote.upvotes,
        downvotes: voteType === 'downvote' ? currentVote.downvotes + 1 : currentVote.downvotes,
        isLoading: true,
        error: null
      }
    } else {
      optimisticUpdate = {
        userVote: voteType,
        upvotes: voteType === 'upvote' ? currentVote.upvotes + 1 : Math.max(0, currentVote.upvotes - 1),
        downvotes: voteType === 'downvote' ? currentVote.downvotes + 1 : Math.max(0, currentVote.downvotes - 1),
        isLoading: true,
        error: null
      }
    }

    setVotes(prev => ({
      ...prev,
      [postId]: { ...prev[postId], ...optimisticUpdate }
    }))

    try {
      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, vote_type: voteType })
      })

      if (!response.ok) throw new Error('Vote request failed')
      const result = await response.json()

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
      setVotes(prev => ({
        ...prev,
        [postId]: { ...previousState, isLoading: false, error: 'Failed to cast vote' }
      }))
    }
  }

  const fetchPostAnswers = async (postId: string) => {
    if (postAnswers[postId]) return
    setAnswersLoading(prev => ({ ...prev, [postId]: true }))
    try {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          id, content, created_at, is_accepted, upvote_count, author_id,
          users!answers_author_id_fkey ( id, full_name, unique_id, role, is_verified, avatar_url )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(10)

      if (!error && data) {
        setPostAnswers(prev => ({ ...prev, [postId]: data }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAnswersLoading(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleAnswerSection = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
    } else {
      setExpandedPost(postId)
      fetchPostAnswers(postId)
    }
  }

  const submitInlineAnswer = async (postId: string) => {
    const text = newAnswerText[postId]?.trim()
    if (!text || answerSubmitting[postId]) return

    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      setAnswerSubmitting(prev => ({ ...prev, [postId]: true }))

      const response = await fetch('/api/answers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: text })
      })

      if (!response.ok) throw new Error('Answer creation failed')
      const result = await response.json()

      if (result.success && result.answer) {
        showAward(5, "Answered a question 🤝")
        setPostAnswers(prev => ({ ...prev, [postId]: [...(prev[postId] || []), result.answer] }))
        setNewAnswerText(prev => ({ ...prev, [postId]: '' }))
        setPosts(prev => prev.map((p: any) =>
          p.id === postId ? { ...p, answer_count: (p.answer_count || 0) + 1, is_answered: true } : p
        ))
      }
    } catch (err) {
      console.error(err)
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

      const countsBySlug = new Map<string, number>(
        data.communities.map((c: any) => [c.slug, c.member_count || 0])
      )
      const seniorsBySlug = new Map<string, number>(
        data.communities.map((c: any) => [c.slug, c.senior_count || 0])
      )

      return [...list]
        .map((c) => ({
          ...c,
          member_count: Math.max(
            c.member_count || 0,
            (countsBySlug.get(c.slug) as number) || 0
          ),
          senior_count: Math.max(
            c.senior_count || 0,
            (seniorsBySlug.get(c.slug) as number) || 0
          ),
        }))
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    } catch (err) {
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
      if (!loadMore) {
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select(`
            id, slug, display_name, description, member_count, senior_count, doubt_count,
            colleges ( id, name, short_name, location, state, type, email_domain )
          `)
          .order('member_count', { ascending: false })
          .limit(20)

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

      const currentPage = loadMore ? page : 1
      const limit = 5
      const offset = (currentPage - 1) * limit

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, title, content, type, created_at, upvote_count, downvote_count, answer_count, is_answered, tags, image_url, author_id,
          users!posts_author_id_fkey ( full_name, unique_id, role, is_verified, avatar_url ),
          communities ( slug, colleges ( name, short_name ) )
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
        setHasMore(postsData.length === limit)
        if (loadMore) {
          setPage(prev => prev + 1)
        } else {
          setPage(2)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (loadMore) setLoadingMore(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [])

  // Infinite Scroll Observer
  const feedEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (loading || !hasMore) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        fetchCommunities(true)
      }
    }, { threshold: 0.1 })

    if (feedEndRef.current) {
      observer.observe(feedEndRef.current)
    }
    return () => observer.disconnect()
  }, [loading, hasMore, loadingMore, page])

  // Filter posts with both category filters AND local search inputs
  const filteredPosts = posts.filter((p: any) => {
    // 1. Post Type category filters
    const matchFilter =
      filter === 'all' ? true
        : filter === 'unanswered' ? !p.is_answered && p.type === 'doubt'
          : filter === 'trending' ? (p.upvote_count || 0) >= 3
            : filter === 'photo' ? !!p.image_url
              : p.type === filter

    // 2. Feed search queries (local feed filtering)
    const query = feedSearchQuery.toLowerCase().trim()
    if (!query) return matchFilter

    const matchQuery =
      p.title?.toLowerCase().includes(query) ||
      p.content?.toLowerCase().includes(query) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(query)) ||
      p.users?.full_name?.toLowerCase().includes(query) ||
      p.communities?.slug?.toLowerCase().includes(query) ||
      p.communities?.colleges?.short_name?.toLowerCase().includes(query)

    return matchFilter && matchQuery
  })

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'doubt':
        return { label: 'Doubt', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '❓' }
      case 'discussion':
        return { label: 'Discussion', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '💬' }
      case 'experience':
        return { label: 'Experience', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '⭐' }
      case 'referral_hunt':
        return { label: 'Referral', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '🎯' }
      case 'resource':
        return { label: 'Resource', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '📚' }
      default:
        return { label: type, color: '#6B7280', bg: '#F9FAFB', border: '#F3F4F6', icon: '📝' }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading active feed...</p>
        <NotificationPrompt />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-plus-jakarta-sans text-[#1E293B] antialiased pb-12">

      {/* Global Navbar Header dynamic search triggers */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4">
              <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search globally across people, groups, posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 text-sm outline-none text-slate-900 placeholder-slate-400 font-medium"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Column Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ LEFT COLUMN: Rich Sticky LinkedIn-style Profile Identity Card ════ */}
          <aside className="lg:col-span-3 sticky top-[88px] self-start space-y-4 hidden lg:block">

            {/* Identity Card */}
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
              <div className="h-20 bg-gradient-to-r from-purple-700 to-indigo-900 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="px-4 pb-4 relative flex flex-col items-center -mt-10">

                {/* User Avatar with outer ring */}
                <div className="w-20 h-20 rounded-md border-4 border-white overflow-hidden bg-slate-50 shadow-md flex items-center justify-center">
                  {profileUser?.avatar_url ? (
                    <img src={profileUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-slate-800 uppercase">
                      {profileUser?.full_name?.[0] || 'U'}
                    </span>
                  )}
                </div>

                {/* Name & Badge details */}
                <h3 className="font-bold text-slate-900 text-sm mt-3 text-center leading-tight">
                  {profileUser?.full_name || 'Guest User'}
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 text-center truncate w-full">
                  @{profileUser?.unique_id || 'guest'}
                </p>

                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${profileUser?.role === 'senior'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-purple-50 text-purple-600 border-purple-100'
                    }`}>
                    {profileUser?.role === 'senior' ? '★ Verified Senior Mentor' : 'Mentee Member'}
                  </span>
                </div>

                {/* Professional headline/bio context */}
                <p className="text-[11px] text-slate-500 text-center font-medium mt-3 px-1 leading-normal border-b border-slate-100 pb-3 w-full">
                  {profileUser?.bio || (profileUser?.role === 'senior'
                    ? `Mentor • Specialist at ${profileUser?.company || 'Industry Partners'}`
                    : `Student of ${profileUser?.branch || 'Engineering Department'}`)}
                </p>

                {/* Extended academic & student details */}
                <div className="w-full pt-3 space-y-2 text-[10px] text-slate-500 font-semibold border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{userCommunity?.colleges?.short_name || profileUser?.college || 'No campus linked'}</span>
                  </div>
                  {profileUser?.branch && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{profileUser.branch}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Graduation: {profileUser?.graduation_year || profileUser?.passout_year || 'Class of 2026'}</span>
                  </div>
                </div>

                {/* High Density Metric Tally grid */}
                <div className="w-full pt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="block text-[14px] font-black text-[#7C3AED] leading-none">
                      {profileUser?.rise_points || profileUser?.points || 0}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mt-1 block">
                      Rise RP
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="block text-[14px] font-black text-slate-800 leading-none">
                      {profileUser?.answer_count || 0}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mt-1 block">
                      Answers
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Navigation shortcuts list */}
            <div className="bg-white rounded-md border border-slate-200 p-2.5 shadow-sm">
              <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-2.5 mb-1.5">
                Ecosystem Hubs
              </h4>
              <nav className="space-y-0.5">
                {[
                  { key: 'all', label: 'Global Feed Home', icon: Globe },
                  { key: 'trending', label: 'Trending Posts', icon: TrendingUp },
                  { key: 'doubt', label: 'Q&A doubts', icon: HelpCircle }
                ].map((item) => {
                  const isActive = filter === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setFilter(item.key)
                        setFeedSearchQuery('') // Reset query on layout change
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded font-bold text-xs transition-colors cursor-pointer ${isActive ? 'bg-purple-50 text-[#7C3AED]' : 'text-slate-600 hover:text-black hover:bg-slate-50'
                        }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* ════ CENTER COLUMN: Searchable + Filterable Feed ════ */}
          <main className="lg:col-span-6 space-y-3.5">

            {/* Dedicated LinkedIn-Style Feed Search & Filter Bar */}
            <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden flex-shrink-0 border border-slate-100">
                  {profileUser?.avatar_url ? (
                    <img src={profileUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profileUser?.full_name?.[0] || 'U'
                  )}
                </div>

                {/* Local search input block */}
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded px-3 py-2 transition-all">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={feedSearchQuery}
                    onChange={(e) => setFeedSearchQuery(e.target.value)}
                    placeholder="Search feed by title, tag, keywords, author, or campus..."
                    className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-800 placeholder-slate-400"
                  />
                  {feedSearchQuery && (
                    <button
                      onClick={() => setFeedSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Standard Post creator button */}
                <button
                  onClick={() => router.push('?create=true')}
                  className="p-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] rounded border border-purple-100 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
                  title="Create a new post"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Feed Filters row - Keep as only system of filters */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2.5 border-t border-slate-100 scrollbar-none select-none">
                {[
                  { key: 'photo', label: 'Photos Only', icon: Image, color: 'text-sky-500' },
                  { key: 'doubt', label: 'Doubts', icon: HelpCircle, color: 'text-purple-500' },
                  { key: 'resource', label: 'Resources', icon: BookOpen, color: 'text-emerald-500' },
                  { key: 'referral_hunt', label: 'Referrals', icon: Target, color: 'text-rose-500' },
                  { key: 'discussion', label: 'Discussions', icon: Hash, color: 'text-amber-500' },
                  { key: 'experience', label: 'Experiences', icon: Star, color: 'text-indigo-500' }
                ].map((btn) => {
                  const isActive = filter === btn.key
                  return (
                    <button
                      key={btn.key}
                      onClick={() => setFilter(isActive ? 'all' : btn.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-bold text-[11px] whitespace-nowrap cursor-pointer ${isActive
                          ? 'bg-purple-100 text-[#7C3AED] shadow-sm border border-purple-200'
                          : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      <btn.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C3AED]' : btn.color}`} />
                      <span>{btn.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filter query status information */}
            {(feedSearchQuery || filter !== 'all') && (
              <div className="bg-purple-50 border border-purple-100 rounded-md px-3 py-2 flex items-center justify-between text-[11px] font-bold">
                <span className="text-purple-950 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>
                    Showing filtered feed (
                    {filter !== 'all' && <span className="text-[#7C3AED]">Type: {filter}</span>}
                    {feedSearchQuery && <span> • Search: "{feedSearchQuery}"</span>}
                    )
                  </span>
                </span>
                <button
                  onClick={() => {
                    setFilter('all')
                    setFeedSearchQuery('')
                  }}
                  className="text-[#7C3AED] hover:underline cursor-pointer"
                >
                  Reset Feed
                </button>
              </div>
            )}

            {/* High-density interactive Post cards */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-md border border-slate-200 p-10 text-center shadow-sm">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs">No matching posts in view</h4>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">Try modifying your filters or search keywords above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredPosts.map((post: any) => {
                    const ts = getTypeStyle(post.type)
                    return (
                      <motion.article
                        key={post.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors"
                      >
                        {/* Feed Card Header details */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">

                            {/* Author avatar */}
                            <div
                              onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                              className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden flex-shrink-0 cursor-pointer border border-slate-100"
                            >
                              {post.users?.avatar_url ? (
                                <img src={post.users.avatar_url} alt={post.users?.full_name} className="w-full h-full object-cover" />
                              ) : (
                                post.users?.full_name?.[0] || 'U'
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                                  className="font-bold text-slate-900 hover:text-[#7C3AED] hover:underline text-xs text-left leading-none"
                                >
                                  {post.users?.full_name}
                                </button>
                                <span className={`text-[7px] font-black uppercase px-1 rounded ${post.users?.role === 'senior' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                  }`}>
                                  {post.users?.role === 'senior' ? 'Senior' : 'Mentee'}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                {post.communities?.colleges?.short_name || 'Campus'} Hub • {timeAgo(post.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Post type badging */}
                          <span
                            style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}
                            className="text-[8px] font-bold uppercase px-2 py-0.5 rounded border tracking-wide whitespace-nowrap flex items-center gap-1"
                          >
                            <span>{ts.icon}</span>
                            <span>{ts.label}</span>
                          </span>
                        </div>

                        {/* Title click through */}
                        <h4
                          onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
                          className="font-bold text-slate-950 text-xs hover:text-[#7C3AED] transition-colors leading-snug tracking-tight mb-1.5 cursor-pointer"
                        >
                          {post.title}
                        </h4>

                        {/* Content text */}
                        <div className="text-[11px] text-slate-600 leading-normal font-semibold mb-2.5">
                          <p className={expandedContent[post.id] ? '' : 'line-clamp-3 whitespace-pre-wrap'}>
                            {convertUrlsToLinks(post.content)}
                          </p>

                          {post.content && post.content.length > 180 && (
                            <button
                              onClick={() => toggleContentExpansion(post.id)}
                              className="text-[#7C3AED] font-bold hover:underline mt-1 cursor-pointer block"
                            >
                              {expandedContent[post.id] ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>

                        {/* Large Attached media inside card */}
                        {post.image_url && (
                          <div className="rounded border border-slate-100 mb-2.5 bg-slate-50 overflow-hidden flex items-center justify-center max-h-72">
                            <img
                              src={post.image_url}
                              alt="Attached post attachment illustration"
                              onClick={() => handleImageClick(post.image_url)}
                              className="w-full object-cover max-h-72 hover:opacity-95 transition-opacity cursor-zoom-in"
                            />
                          </div>
                        )}

                        {/* Tags line */}
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {post.tags.map((t: string) => (
                              <span key={t} className="text-[8px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Low Opacity action footer bar */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-2">

                            {/* Upvote & Downvote buttons */}
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded p-0.5">
                              <button
                                onClick={() => handleVote(post.id, 'upvote')}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${votes[post.id]?.userVote === 'upvote'
                                    ? 'bg-purple-100 text-[#7C3AED] shadow-sm'
                                    : 'hover:bg-slate-100 text-slate-500'
                                  }`}
                              >
                                <ArrowUp className="w-3 h-3" />
                                <span>{votes[post.id]?.upvotes || 0}</span>
                              </button>

                              <button
                                onClick={() => handleVote(post.id, 'downvote')}
                                className={`flex items-center px-1.5 py-0.5 rounded transition-all cursor-pointer ${votes[post.id]?.userVote === 'downvote'
                                    ? 'bg-red-100 text-red-600 shadow-sm'
                                    : 'hover:bg-slate-100 text-slate-400'
                                  }`}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Answers buttons */}
                            <button
                              onClick={() => toggleAnswerSection(post.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-slate-50 text-slate-500 rounded transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{post.answer_count || 0} Answers</span>
                            </button>
                          </div>

                          <button
                            onClick={() => router.push(`/community/c/${post.communities?.slug}/p/${post.id}`)}
                            className="text-[#7C3AED] hover:underline cursor-pointer text-[10px]"
                          >
                            Explore Detail →
                          </button>
                        </div>

                        {/* Errors details */}
                        {votes[post.id]?.error && (
                          <div className="text-[9px] text-red-600 bg-red-50 border border-red-100 rounded p-2 mt-2">
                            {votes[post.id]?.error}
                          </div>
                        )}

                        {/* Inline Answers dynamic render */}
                        {expandedPost === post.id && (
                          <div className="border-t border-slate-100 mt-2.5 pt-2.5 space-y-2">
                            <h5 className="font-bold text-[10px] text-slate-800 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-[#7C3AED]" />
                              <span>Answers ({postAnswers[post.id]?.length || 0})</span>
                            </h5>

                            {answersLoading[post.id] && (
                              <div className="flex items-center justify-center gap-2 py-3">
                                <div className="w-3.5 h-3.5 border-2 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                                <span className="text-[9px] text-slate-400 font-semibold">Loading answers...</span>
                              </div>
                            )}

                            {!answersLoading[post.id] && postAnswers[post.id]?.length === 0 && (
                              <p className="text-[9px] text-slate-400 font-semibold text-center py-1">
                                No answers yet. Help this mentee by sharing your experience!
                              </p>
                            )}

                            {/* Answers List */}
                            {!answersLoading[post.id] && postAnswers[post.id]?.map((answer: any) => (
                              <div key={answer.id} className="flex gap-2.5 py-1.5 border-b border-slate-50 last:border-b-0 items-start">
                                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden flex-shrink-0 border border-slate-100">
                                  {answer.users?.avatar_url ? (
                                    <img src={answer.users.avatar_url} alt="Author" className="w-full h-full object-cover" />
                                  ) : (
                                    answer.users?.full_name?.[0] || 'U'
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-[10px]">{answer.users?.full_name}</span>
                                    {answer.users?.role === 'senior' && (
                                      <span className="text-[6px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-0.5 rounded">
                                        SENIOR
                                      </span>
                                    )}
                                    {answer.is_accepted && (
                                      <span className="text-[6px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-0.5 rounded flex items-center gap-0.5">
                                        <CheckCircle className="w-2 h-2" /> Accepted
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-600 leading-normal font-semibold mt-0.5">{answer.content}</p>
                                </div>
                              </div>
                            ))}

                            {/* Answer submission block */}
                            <div className="flex items-end gap-2 pt-1.5">
                              <textarea
                                value={newAnswerText[post.id] || ''}
                                onChange={e => setNewAnswerText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="Help by writing an answer..."
                                rows={1}
                                className="flex-1 border border-slate-200 hover:border-slate-300 rounded p-2 text-[10px] font-semibold focus:outline-none focus:border-[#7C3AED] resize-none"
                              />
                              <button
                                onClick={() => submitInlineAnswer(post.id)}
                                disabled={!newAnswerText[post.id]?.trim() || answerSubmitting[post.id]}
                                className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-200 text-white rounded font-bold text-[10px] cursor-pointer transition-colors flex-shrink-0"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.article>
                    )
                  })}
                </AnimatePresence>

                {/* Sliced pagination end triggers */}
                {hasMore && (
                  <div ref={feedEndRef} className="py-6 flex justify-center">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-6 text-slate-400 font-bold text-xs">
                    You've caught up with the entire community feed! 🎉
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ════ RIGHT COLUMN: Sticky Campus Leadership & Discovery ════ */}
          <aside className="lg:col-span-3 sticky top-[88px] self-start space-y-4 hidden lg:block">

            {/* Top communities leader board */}
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Campus Leaders
                </h4>
              </div>

              <div className="p-1.5 space-y-0.5">
                {communities.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/community/c/${c.slug}`)}
                    className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded bg-purple-50 border border-slate-100 flex items-center justify-center font-bold text-[#7C3AED] overflow-hidden text-[10px] flex-shrink-0">
                      {c.slug === 'aaacet' ? (
                        <img src="/aaaclg_logo.jpg" alt="AAACET" className="w-full h-full object-contain" />
                      ) : (c.slug === 'vvvclg' || c.slug === 'vvv') ? (
                        <img src="/vvvclogo.png" alt="VVV" className="w-full h-full object-contain" />
                      ) : c.slug === 'anjac' ? (
                        <img src="/anjac.jpg" alt="ANJAC" className="w-full h-full object-contain" />
                      ) : c.slug === 'sfr' ? (
                        <img src="/sfr.jpg" alt="SFR" className="w-full h-full object-contain" />
                      ) : c.slug === 'skc' ? (
                        <img src="/skc.jpg" alt="SKC" className="w-full h-full object-contain" />
                      ) : c.slug === 'kamaraj' ? (
                        <img src="/kamaraj.jpg" alt="Kamaraj" className="w-full h-full object-contain" />
                      ) : c.slug === 'agpc' ? (
                        <img src="/agpc.jpg" alt="AGPC" className="w-full h-full object-contain" />
                      ) : (
                        c.colleges?.short_name?.[0] || 'C'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 truncate">c/{c.slug}</h5>
                      <p className="text-[9px] text-slate-400 font-semibold">{c.member_count || 0} members</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/colleges')}
                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold text-center border-t border-slate-100 transition-colors cursor-pointer block"
              >
                Explore Campuses ↗
              </button>
            </div>

            {/* Suggested For You Hubs */}
            <div className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Suggested Circles
              </h4>
              <div className="space-y-2.5">
                {communities
                  .filter(c => c.slug !== userCommunity?.slug)
                  .slice(0, 3)
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center font-bold text-slate-500 text-[10px] flex-shrink-0">
                        {c.colleges?.short_name?.[0] || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-800 truncate">{c.colleges?.short_name || c.display_name}</h5>
                        <p className="text-[9px] text-slate-400 font-semibold truncate">{c.colleges?.location || 'Tamil Nadu'}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/community/c/${c.slug}`)}
                        className="px-2 py-0.5 border border-slate-200 hover:border-[#7C3AED] hover:text-[#7C3AED] bg-white rounded font-bold text-[9px] text-slate-600 transition-colors cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Active Placements / Jobs list (real data) */}
            <div className="bg-white rounded-md border border-slate-200 p-3.5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-rose-500" />
                Campus Placements
              </h4>
              <div className="space-y-2.5 text-[10px] font-semibold text-slate-600">
                {campusJobs.length > 0 ? (
                  campusJobs.map((job, idx) => (
                    <div
                      key={job.id}
                      className={`flex items-center justify-between ${idx < campusJobs.length - 1 ? 'border-b border-slate-50 pb-2' : ''}`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-bold text-slate-800 truncate">{job.role}</p>
                        <p className="text-slate-400 mt-0.5 text-[9px] truncate">
                          {job.company_name}{job.referral_available ? ' • Referral' : ''}{job.job_type ? ` • ${job.job_type}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/careers/${job.id}`)}
                        className={`px-2 py-0.5 rounded font-bold text-[9px] cursor-pointer flex-shrink-0 ${
                          idx === 0
                            ? 'bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600'
                            : 'bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx === 0 ? 'Apply' : 'View'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-[10px] text-center py-2">No active placements yet</p>
                )}
              </div>
              {campusJobs.length > 0 && (
                <button
                  onClick={() => router.push('/careers')}
                  className="mt-2.5 w-full text-center text-[10px] font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
                >
                  View All Jobs →
                </button>
              )}
            </div>

            {/* Platform statistics summary */}
            <div className="bg-slate-950 text-white rounded-md p-3.5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <h4 className="font-bold text-xs mb-3 flex items-center gap-1.5 relative z-10">
                <Zap className="w-4 h-4 text-purple-400" />
                Network Statistics
              </h4>
              <div className="space-y-2.5 relative z-10 text-[10px] font-semibold text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Communities Joined</span>
                  <span className="text-white font-bold">{communities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Members</span>
                  <span className="text-white font-bold">
                    {communities.reduce((acc, c) => acc + (c.member_count || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>New Submissions</span>
                  <span className="text-white font-bold">
                    {posts.filter((p: any) => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Floating Action Button (Mobile only) */}
      <button
        onClick={() => router.push('?create=true')}
        className="fixed bottom-6 right-6 lg:hidden w-12 h-12 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-lg text-white font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 z-50 animate-bounce"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ════ MOBILE DIRECT MESSAGING REDESIGN: Floating Circular FAB ════ */}
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className="fixed bottom-24 right-6 lg:hidden w-12 h-12 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform z-50 border border-purple-400"
        title="Open Direct Messages"
      >
        <MessageCircle className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-[9px] font-black text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#7C3AED]">
          {chatThreads.length}
        </span>
      </button>

      {/* ════ MOBILE DIRECT MESSAGING BOTTOM SHEET DRAWER ════ */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] lg:hidden flex items-end"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-plus-jakarta-sans pb-6"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white flex items-center justify-between px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {activeChatUser && (
                    <button
                      onClick={() => setActiveChatUser(null)}
                      className="mr-1 hover:text-purple-200 transition-colors p-1"
                      title="Back to conversation list"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                  <span className="text-xs font-bold">
                    {activeChatUser ? `Chat with ${activeChatUser.full_name}` : 'Direct Messaging'}
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer content body */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 flex flex-col">
                {activeChatUser ? (
                  // Active Chat thread view inside mobile drawer
                  <div className="flex flex-col h-[50vh] bg-white">
                    {/* User status info */}
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 flex-shrink-0">
                      <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center font-bold text-slate-800 text-[10px] overflow-hidden">
                        {activeChatUser.avatar_url ? (
                          <img src={activeChatUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          activeChatUser.full_name?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-[10px] text-slate-900 block leading-tight">{activeChatUser.full_name}</span>
                        <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          {activeChatUser.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                        </span>
                      </div>
                    </div>

                    {/* Messages scrolling */}
                    <div
                      ref={mobileScrollRef}
                      className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50"
                    >
                      {drawerChatLoading && drawerMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full gap-2">
                          <div className="w-4 h-4 border-2 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                          <span className="text-[10px] text-slate-400 font-semibold">Loading history...</span>
                        </div>
                      ) : drawerMessages.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[11px] text-slate-400 font-bold">No messages here yet</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Start the conversation by typing below!</p>
                        </div>
                      ) : (
                        drawerMessages.map((msg: any) => {
                          const isMine = msg.sender_id === profileUser?.id
                          const isOptimistic = msg.id.startsWith('temp-')
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-2.5 rounded-xl text-[10.5px] font-semibold ${isMine
                                  ? `bg-purple-600 text-white rounded-br-none ${isOptimistic ? 'opacity-70' : ''}`
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                                }`}>
                                <p className="leading-normal">{msg.content}</p>
                                <span className={`block text-[6.5px] text-right mt-1 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                                  {isOptimistic ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Chat send block */}
                    <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                      <input
                        type="text"
                        value={drawerNewMessage}
                        onChange={e => setDrawerNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendDrawerMessage()}
                        placeholder="Type message here..."
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#7C3AED] transition-colors"
                      />
                      <button
                        onClick={sendDrawerMessage}
                        disabled={!drawerNewMessage.trim() || drawerChatSending}
                        className="p-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-100 text-white rounded-xl cursor-pointer transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Conversation list screen inside mobile sheet drawer
                  <div className="flex flex-col h-[50vh] bg-white">
                    {chatThreads.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3 border border-purple-100">
                          <MessageSquare className="w-6 h-6 text-[#7C3AED]" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-800">No active connections yet</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 px-4 leading-normal">
                          You are not connected with anyone yet. Connect with seniors or students to start messaging.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setMobileDrawerOpen(false)
                              router.push('/seniors')
                            }}
                            className="px-3 py-1.5 bg-[#7C3AED] text-white text-[9px] font-bold rounded shadow-sm hover:bg-[#6D28D9] transition-all cursor-pointer"
                          >
                            Explore Seniors
                          </button>
                          <button
                            onClick={() => {
                              setMobileDrawerOpen(false)
                              router.push('/colleges')
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            Find Communities
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                        {chatThreads.map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => {
                              setActiveChatUser({
                                id: thread.users?.id || thread.users?.unique_id || thread.id,
                                full_name: thread.users?.full_name || 'Alumni Partner',
                                avatar_url: thread.users?.avatar_url,
                                role: thread.users?.role || 'senior'
                              })
                            }}
                            className="flex items-center gap-3.5 p-3.5 hover:bg-slate-100 bg-white cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center font-bold text-[#7C3AED] text-[10px] overflow-hidden flex-shrink-0 border border-purple-100">
                              {thread.users?.avatar_url ? (
                                <img src={thread.users.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                thread.users?.full_name?.[0] || 'S'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-slate-800 truncate">{thread.users?.full_name}</h5>
                              <p className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                                {thread.users?.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                              </p>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4 text-center bg-white border-t border-slate-100 flex-shrink-0">
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false)
                          router.push('/dashboard/junior')
                        }}
                        className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold rounded transition-colors cursor-pointer border border-purple-100"
                      >
                        Open Full Messaging Center
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ COLLAPSIBLE/EXPANDABLE DESKTOP DIRECT MESSAGING WIDGET ════ */}
      <div
        className={`fixed bottom-0 right-6 z-[9999] w-80 bg-white rounded-t-xl shadow-[0_-4px_25px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden font-plus-jakarta-sans transition-all duration-300 hidden lg:block ${chatExpanded ? 'h-[440px]' : 'h-11'
          }`}
      >
        {/* Header */}
        <div
          onClick={() => {
            setChatExpanded(!chatExpanded)
            if (!chatExpanded) {
              setActiveChatUser(null)
            }
          }}
          className="bg-slate-900 text-white flex items-center justify-between px-3.5 py-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            {activeChatUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveChatUser(null)
                }}
                className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Back to Chats list"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-tight">
                {activeChatUser ? `Chat: ${activeChatUser.full_name}` : 'Direct Messaging'}
              </span>
            </div>
          </div>
          <button className="text-white hover:text-purple-200 transition-colors">
            {chatExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body when expanded */}
        {chatExpanded && (
          <div className="h-[396px] flex flex-col bg-slate-50">
            {activeChatUser ? (
              // Active Conversation Screen inside widget
              <div className="flex flex-col h-full bg-white">
                {/* User mini info */}
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center font-bold text-slate-800 text-[10px] overflow-hidden">
                      {activeChatUser.avatar_url ? (
                        <img src={activeChatUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        activeChatUser.full_name?.[0] || 'U'
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-slate-900 block leading-tight">{activeChatUser.full_name}</span>
                      <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">
                        {activeChatUser.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages scroll area */}
                <div
                  ref={drawerScrollRef}
                  className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50"
                >
                  {drawerChatLoading && drawerMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                      <span className="text-[9px] text-slate-400 font-semibold">Loading messages...</span>
                    </div>
                  ) : drawerMessages.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold">No messages yet</p>
                      <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Send a quick note below to start chatting!</p>
                    </div>
                  ) : (
                    drawerMessages.map((msg: any) => {
                      const isMine = msg.sender_id === profileUser?.id
                      const isOptimistic = msg.id.startsWith('temp-')
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-2 rounded-lg text-[10px] font-semibold ${isMine
                              ? `bg-purple-600 text-white rounded-br-none ${isOptimistic ? 'opacity-70' : ''}`
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                            }`}>
                            <p className="leading-normal">{msg.content}</p>
                            <span className={`block text-[6px] text-right mt-1 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                              {isOptimistic ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Input block */}
                <div className="p-2.5 border-t border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={drawerNewMessage}
                    onChange={e => setDrawerNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendDrawerMessage()}
                    placeholder="Write message..."
                    className="flex-1 border border-slate-200 hover:border-slate-300 rounded px-2.5 py-1.5 text-[10px] font-semibold outline-none focus:border-[#7C3AED] transition-colors"
                  />
                  <button
                    onClick={sendDrawerMessage}
                    disabled={!drawerNewMessage.trim() || drawerChatSending}
                    className="p-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-100 text-white rounded cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              // General Active Threads List Screen inside widget
              <div className="flex flex-col h-full bg-slate-50">
                {chatThreads.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2 border border-purple-100">
                      <MessageSquare className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <h4 className="font-bold text-[10px] text-slate-800">No active connections</h4>
                    <p className="text-[8px] text-slate-400 font-semibold mt-1 px-3 leading-normal">
                      You are not connected with anyone yet. Connect with seniors or students to start messaging.
                    </p>
                    <div className="mt-3.5 flex gap-1.5">
                      <button
                        onClick={() => router.push('/seniors')}
                        className="px-2.5 py-1 bg-[#7C3AED] text-white text-[8px] font-bold rounded hover:bg-[#6D28D9] transition-all cursor-pointer"
                      >
                        Explore Seniors
                      </button>
                      <button
                        onClick={() => router.push('/colleges')}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[8px] font-bold rounded hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Find Communities
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto bg-white">
                    {chatThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => {
                          setActiveChatUser({
                            id: thread.users?.id || thread.users?.unique_id || thread.id,
                            full_name: thread.users?.full_name || 'Alumni Partner',
                            avatar_url: thread.users?.avatar_url,
                            role: thread.users?.role || 'senior'
                          })
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-slate-100 bg-white cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded bg-purple-50 flex items-center justify-center font-bold text-[#7C3AED] text-[10px] overflow-hidden flex-shrink-0">
                          {thread.users?.avatar_url ? (
                            <img src={thread.users.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            thread.users?.full_name?.[0] || 'S'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-[11px] text-slate-800 truncate">{thread.users?.full_name}</h5>
                          <p className="text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                            {thread.users?.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                          </p>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 text-center bg-white mt-auto border-t border-slate-100 flex-shrink-0">
                  <button
                    onClick={() => router.push('/dashboard/junior')}
                    className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[10px] font-bold rounded transition-colors cursor-pointer border border-purple-100"
                  >
                    Full Messaging Console
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
            className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
            >
              <img src={selectedImage} alt="Post preview large" className="rounded-lg object-contain max-h-[85vh] max-w-full" />
              <button
                onClick={closeImageModal}
                className="absolute -top-10 -right-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center cursor-zoom-out transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationPrompt />
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading community hub...</p>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  )
}
