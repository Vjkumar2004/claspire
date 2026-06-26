'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePoints } from '@/contexts/PointsContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Search, HelpCircle, MessageSquare, Clock, TrendingUp,
  CheckCircle, Eye, ChevronRight, Briefcase,
  Building2, Crown, Zap, Hash, Star, Shield, Globe,
  BookOpen, Target, Send, X, Sparkles, Filter, Plus,
  Image, FileText, Share2, MoreHorizontal, Bookmark, ThumbsUp, MessageCircle,
  ChevronUp, ChevronDown, Award, GraduationCap, MapPin, UserCheck, Activity,
  ArrowUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PostModal from '@/components/PostModal'
import { calculateProfileCompletion } from '@/lib/profileCompletion'


interface RecentUpvoter {
  id: string
  full_name: string
  avatar_url: string | null
}

interface FeedStateCache {
  posts: any[]
  communities: any[]
  page: number
  hasMore: boolean
  filter: string
  feedSearchQuery: string
  votes: Record<string, any>
  recentUpvoters: Record<string, RecentUpvoter[]>
  scrollY: number
  expandedPost: string | null
  postAnswers: Record<string, any[]>
  expandedContent: Record<string, boolean>
  userId: string | null
  timestamp: number
  todayPosts?: number
  todayAnswers?: number
  todayReferrals?: number
  todaySeniors?: number
  campusJobs?: any[]
}

let communityFeedCache: FeedStateCache | null = null

import BottomNavbar from '@/components/BottomNavbar'

import ChatWidget from '@/components/community/ChatWidget'
import FeedPost from '@/components/community/FeedPost'
import LeftSidebar from '@/components/community/LeftSidebar'
import RightSidebar from '@/components/community/RightSidebar'
import LikesModal from '@/components/community/LikesModal'

// Utility function to convert URLs to clickable links and preserve line breaks

const convertUrlsToLinks = (text: string) => {
  if (!text) return text
  const urlPattern = /(https?:\/\/[^\s\)]+)/g

  // Split by newlines first to preserve paragraph structure
  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    const matches = line.match(urlPattern) || []

    if (matches.length === 0) {
      return (
        <span key={`line-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    }

    const parts: React.ReactNode[] = []
    let lastIdx = 0

    matches.forEach((match, matchIndex) => {
      const matchStart = line.indexOf(match, lastIdx)
      const before = line.substring(lastIdx, matchStart)
      if (before) {
        parts.push(<span key={`t-${lineIndex}-${matchIndex}`}>{before}</span>)
      }
      parts.push(
        <a
          key={`l-${lineIndex}-${matchIndex}`}
          href={match}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#7C3AED] hover:underline font-semibold break-all"
        >
          {match}
        </a>
      )
      lastIdx = matchStart + match.length
    })

    const remaining = line.substring(lastIdx)
    if (remaining) {
      parts.push(<span key={`t-${lineIndex}-end`}>{remaining}</span>)
    }

    return (
      <span key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}

interface CommunityPageClientProps {
  initialCommunities?: any[]
  initialPosts?: any[]
  initialCampusJobs?: any[]
}

function CommunityPageContent({ initialCommunities = [], initialPosts = [], initialCampusJobs = [] }: CommunityPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldCreate = searchParams.get('create') === 'true'
  const { user, loading: authLoading } = useAuth()
  const { showAward } = usePoints()

  const hasInitialData = useRef(!!(initialCommunities?.length || initialPosts?.length))
  const fetchedVotePostIds = useRef<Set<string>>(new Set())
  // Tracks which user ID we last fetched personal vote state for.
  // Undefined = never fetched. Null = fetched for logged-out session.
  const lastFetchedUserId = useRef<string | null | undefined>(undefined)

  const getValidCache = () => {
    if (!communityFeedCache) return null
    const now = Date.now()
    const TTL = 10 * 60 * 1000 // 10 minutes
    if (now - communityFeedCache.timestamp > TTL) {
      communityFeedCache = null
      return null
    }
    return communityFeedCache
  }

  const validCache = getValidCache()

  // Base state listings
  const [communities, setCommunities] = useState<any[]>(() => validCache?.communities || initialCommunities)
  const [posts, setPosts] = useState<any[]>(() => validCache?.posts || initialPosts)
  const [loading, setLoading] = useState(() => !(validCache || initialPosts.length > 0))
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filter, setFilter] = useState(() => validCache?.filter || 'all')
  const [userCommunity, setUserCommunity] = useState<any>(null)
  const [isCollegeAdmin, setIsCollegeAdmin] = useState(false)

  // Phase 2 optimization states
  const [feedSearchQuery, setFeedSearchQuery] = useState(() => validCache?.feedSearchQuery || '')



  // Inline answer states
  const [expandedPost, setExpandedPost] = useState<string | null>(() => validCache?.expandedPost || null)
  const [postAnswers, setPostAnswers] = useState<Record<string, any[]>>(() => validCache?.postAnswers || {})
  const [answersLoading, setAnswersLoading] = useState<Record<string, boolean>>({})

  // Content expansion state
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>(() => validCache?.expandedContent || {})

  // Pagination / Load more
  const [page, setPage] = useState(() => validCache?.page || (initialPosts?.length > 0 ? 2 : 1))
  const [hasMore, setHasMore] = useState(() => validCache?.hasMore !== undefined ? validCache.hasMore : true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Votes state — initialize from SSR data to avoid 0-flash on first paint
  const [votes, setVotes] = useState<Record<string, {
    userVote: 'upvote' | 'downvote' | null
    upvotes: number
    downvotes: number
    isLoading: boolean
    error: string | null
  }>>(() => {
    if (validCache?.votes) return validCache.votes
    const initial: Record<string, any> = {}
    initialPosts?.forEach(p => {
      initial[p.id] = {
        userVote: null,
        upvotes: p.upvote_count || 0,
        downvotes: p.downvote_count || 0,
        isLoading: false,
        error: null
      }
    })
    return initial
  })

  // Recent upvoters for LinkedIn-style display
  const [recentUpvoters, setRecentUpvoters] = useState<Record<string, RecentUpvoter[]>>(() => validCache?.recentUpvoters || {})

  // Campus Placements (real jobs)
  const [campusJobs, setCampusJobs] = useState<any[]>(initialCampusJobs)

  // Community Activity Metrics
  const [todayPosts, setTodayPosts] = useState(0)
  const [todayAnswers, setTodayAnswers] = useState(0)
  const [todayReferrals, setTodayReferrals] = useState(0)
  const [todaySeniors, setTodaySeniors] = useState(0)

  // Realtime New Posts Queue
  const [newPostsQueue, setNewPostsQueue] = useState<any[]>([])
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false)

  // Scroll restoration tracking state
  const [isRestoringScroll, setIsRestoringScroll] = useState(() => {
    const validCache = getValidCache()
    return !!(validCache && validCache.scrollY > 0)
  })

  // Floating FAB scroll visibility to match bottom nav
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Likes modal state
  const [likesModalOpen, setLikesModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [showPostModal, setShowPostModal] = useState(shouldCreate)

  const toggleContentExpansion = (postId: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Auto-hide FAB on scroll to sync with bottom navbar
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true)
      }

      setLastScrollY(currentScrollY)
      scrollTimeout = setTimeout(() => { }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [lastScrollY])



  // Fetch real campus placement jobs
  useEffect(() => {
    const validCache = getValidCache()
    if (validCache?.campusJobs) {
      setCampusJobs(validCache.campusJobs)
      return
    }
    if (hasInitialData.current) return

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

  // Fetch community activity metrics
  useEffect(() => {
    const validCache = getValidCache()
    if (validCache?.todayPosts !== undefined) {
      setTodayPosts(validCache.todayPosts)
      setTodayAnswers(validCache.todayAnswers ?? 0)
      setTodayReferrals(validCache.todayReferrals ?? 0)
      setTodaySeniors(validCache.todaySeniors ?? 0)
      return
    }

    const fetchActivityMetrics = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      try {
        // Today's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
        if (!postsError && postsData) {
          setTodayPosts(postsData.length)
        }

        // Today's answers
        const { data: answersData, error: answersError } = await supabase
          .from('answers')
          .select('id')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
        if (!answersError && answersData) {
          setTodayAnswers(answersData.length)
        }

        // Today's referrals
        const { data: referralsData, error: referralsError } = await supabase
          .from('referral_requests')
          .select('id')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
        if (!referralsError && referralsData) {
          setTodayReferrals(referralsData.length)
        }

        // New seniors joined today
        const { data: seniorsData, error: seniorsError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'senior')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
        if (!seniorsError && seniorsData) {
          setTodaySeniors(seniorsData.length)
        }
      } catch (err) {
        console.error('Failed to fetch activity metrics:', err)
      }
    }
    fetchActivityMetrics()
  }, [])



  // Initialize votes and fetch recent upvoters
  useEffect(() => {
    if (!posts.length) return

    const fetchUserVotesAndUpvoters = async () => {
      const userId = user?.id || null

      // 1. ALWAYS initialize vote state for all current posts
      // This prevents the "0 upvotes" bug caused by skipping initialization.
      setVotes(prev => {
        const updated = { ...prev }
        let changed = false
        posts.forEach((p: any) => {
          if (!updated[p.id]) {
            changed = true
            updated[p.id] = {
              userVote: null,
              upvotes: p.upvote_count || 0,
              downvotes: p.downvote_count || 0,
              isLoading: false,
              error: null
            }
          }
        })
        return changed ? updated : prev
      })

      // 2. Identify strictly new posts that haven't had recent upvoters fetched
      const newPostIds = posts
        .map(p => p.id)
        .filter(id => !fetchedVotePostIds.current.has(id))

      // 3. Detect if the authenticated user changed (e.g. auth resolved after posts loaded)
      const userChanged = userId !== lastFetchedUserId.current

      // Mark new posts as fetched IMMEDIATELY before awaiting to prevent race conditions
      newPostIds.forEach(id => fetchedVotePostIds.current.add(id))

      // Update the tracked user ID before any await so concurrent runs don't double-fetch
      if (userChanged) {
        lastFetchedUserId.current = userId
      }

      // Fetch if: there are new posts (need upvoters) OR the authenticated user changed
      // (need to apply their personal vote state to already-loaded posts).
      const shouldFetch = newPostIds.length > 0 || (userChanged && !!userId)
      if (!shouldFetch) return

      // When the user identity changed, request ALL current post IDs so the API
      // can return their vote state for every post visible in the feed.
      // For new posts only, newPostIds is sufficient.
      const postIdsForBatch = (userChanged && !!userId)
        ? posts.map(p => p.id)
        : newPostIds

      try {
        const res = await fetch('/api/posts/votes-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postIds: postIdsForBatch })
        })

        if (res.ok) {
          const data = await res.json()

          // Only update upvoter avatars for newly fetched posts to avoid
          // overwriting optimistic updates on already-rendered posts.
          if (data.recentVotes && newPostIds.length > 0) {
            const newPostIdSet = new Set(newPostIds)
            const upvoterMap: Record<string, RecentUpvoter[]> = {}
            data.recentVotes.forEach((vote: any) => {
              if (!newPostIdSet.has(vote.post_id)) return
              const pid = vote.post_id
              if (!upvoterMap[pid]) upvoterMap[pid] = []
              if (upvoterMap[pid].length < 3 && vote.users) {
                if (!upvoterMap[pid].some((u: any) => u.id === vote.users.id)) {
                  upvoterMap[pid].push({
                    id: vote.users.id,
                    full_name: vote.users.full_name,
                    avatar_url: vote.users.avatar_url
                  })
                }
              }
            })
            setRecentUpvoters(prev => ({ ...prev, ...upvoterMap }))
          }

          if (userId && data.userVotes) {
            setVotes(prev => {
              const updated = { ...prev }
              data.userVotes.forEach((vote: any) => {
                if (updated[vote.post_id]) {
                  updated[vote.post_id] = {
                    ...updated[vote.post_id],
                    userVote: vote.vote_type as 'upvote' | 'downvote'
                  }
                }
              })
              return updated
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch votes batch:', error)
      }
    }

    fetchUserVotesAndUpvoters()
  }, [posts, user?.id])

  // Get user college community
  useEffect(() => {
    if (!user?.college_id) {
      setUserCommunity(null)
      return
    }

    const found = communities.find((c) => c.colleges?.id === user.college_id)
    if (found) {
      setUserCommunity(found)
      fetch(`/api/community/${found.slug}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => setIsCollegeAdmin(!!data?.isCollegeAdmin))
        .catch(() => setIsCollegeAdmin(false))
      return
    }

    // Communities loaded but user's college not in top-20 — fallback: fetch directly
    if (communities.length) {
      supabase
        .from('communities')
        .select('id, slug, display_name, college_id, colleges ( id, logo_url, short_name )')
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserCommunity(data)
            fetch(`/api/community/${data.slug}`)
              .then((r) => r.ok ? r.json() : null)
              .then((d) => setIsCollegeAdmin(!!d?.isCollegeAdmin))
              .catch(() => setIsCollegeAdmin(false))
          } else {
            setUserCommunity(null)
          }
        })
    }
    // else: communities not yet loaded — will retry when communities changes
  }, [communities, user?.college_id])

  useEffect(() => {
    if (shouldCreate) {
      setShowPostModal(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [shouldCreate])

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user?.id) {
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
          upvotes: result.upvotes !== undefined ? result.upvotes : prev[postId].upvotes,
          downvotes: result.downvotes !== undefined ? result.downvotes : prev[postId].downvotes,
          isLoading: false,
          error: null,
          userVote: result.action === 'removed' ? null : voteType
        }
      }))

      // Optimistically update recent upvoters
      if (voteType === 'upvote' && user) {
        if (result.action === 'removed') {
          // Remove current user from upvoters
          setRecentUpvoters(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(u => u.id !== user.id)
          }))
        } else if (result.action === 'added') {
          // Add current user to front of upvoters
          setRecentUpvoters(prev => {
            const existing = prev[postId] || []
            if (existing.some(u => u.id === user.id)) return prev
            return {
              ...prev,
              [postId]: [{ id: user.id, full_name: user.full_name, avatar_url: user.avatar_url || null }, ...existing].slice(0, 3)
            }
          })
        }
      } else if (voteType === 'downvote' && user && currentVote.userVote === 'upvote') {
        // Switched from upvote to downvote — remove from upvoters
        setRecentUpvoters(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(u => u.id !== user.id)
        }))
      }
    } catch (error) {
      setVotes(prev => ({
        ...prev,
        [postId]: { ...previousState, isLoading: false, error: 'Failed to cast vote' }
      }))
    }
  }

  const fetchPostAnswers = async (postId: string, forceRefresh = false) => {
    if (!forceRefresh && postAnswers[postId]?.length) return
    setAnswersLoading(prev => ({ ...prev, [postId]: true }))
    try {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          *,
          users!answers_author_id_fkey ( id, full_name, unique_id, role, is_verified, avatar_url )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Answer fetch error:', error)
      }
      if (data) {
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

  const handleSharePost = async (post: any) => {
    const slug = post.communities?.slug
    if (!slug) return

    const url = `${window.location.origin}/community/c/${slug}/p/${post.id}`
    const title = post.title || 'Claspire post'
    const text = post.content?.slice(0, 120) || 'Check out this post on Claspire'

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard')
    } catch {
      prompt('Copy this link:', url)
    }
  }

  const handleUpvotersClick = (postId: string) => {
    setSelectedPostId(postId)
    setLikesModalOpen(true)
  }

  const submitInlineAnswer = async (postId: string, text: string, parentAnswerId?: string) => {
    const trimmed = text.trim()
    if (!trimmed) return false

    if (!user?.id) {
      router.push('/login')
      return false
    }

    try {
      const response = await fetch('/api/answers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: trimmed, parent_answer_id: parentAnswerId })
      })

      if (!response.ok) throw new Error('Answer creation failed')
      const result = await response.json()

      if (result.success && result.answer) {
        if (trimmed.length >= 20) {
          showAward(5, "Answered a question 🤝")
        }

        const enrichedAnswer = {
          ...result.answer,
          users: {
            ...result.answer.users,
            full_name: user?.full_name || result.answer.users?.full_name,
            avatar_url: user?.avatar_url,
            role: user?.role,
            unique_id: user?.unique_id,
            is_verified: user?.is_verified,
          }
        }

        setPostAnswers(prev => ({ ...prev, [postId]: [...(prev[postId] || []), enrichedAnswer] }))
        setPosts(prev => prev.map((p: any) => {
          if (p.id === postId) {
            return {
              ...p,
              answer_count: !parentAnswerId ? (p.answer_count || 0) + 1 : p.answer_count,
              is_answered: true
            }
          }
          return p
        }))
        return true
      }
      return false
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const deleteInlineAnswer = async (postId: string, answerId: string, parentAnswerId?: string) => {
    if (!user?.id) return false

    // Optimistic UI update
    setPostAnswers(prev => {
      const answers = prev[postId] || []
      return {
        ...prev,
        [postId]: answers.filter(a => a.id !== answerId && a.parent_answer_id !== answerId)
      }
    })

    if (!parentAnswerId) {
      setPosts(prev => prev.map((p: any) => {
        if (p.id === postId) {
          const newCount = Math.max(0, (p.answer_count || 0) - 1)
          return { ...p, answer_count: newCount, is_answered: newCount > 0 }
        }
        return p
      }))
    }

    try {
      const response = await fetch('/api/answers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId })
      })

      if (!response.ok) throw new Error('Answer deletion failed')
      return true
    } catch (err) {
      console.error('Failed to delete answer:', err)
      return false
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
        const res = await fetch('/api/community/leaderboard')
        const data = await res.json()
        if (data.communities?.length) {
          setCommunities(data.communities)
        }
      }

      const currentPage = loadMore ? page : 1
      const limit = 5
      const offset = (currentPage - 1) * limit

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, title, content, type, created_at, upvote_count, downvote_count, answer_count, is_answered, tags, image_url, author_id, is_college_post,
          users!posts_author_id_fkey ( full_name, unique_id, role, is_verified, avatar_url ),
          communities ( slug, colleges ( name, short_name, logo_url ) )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!postsError && postsData) {
        if (loadMore) {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newPosts = postsData.filter(p => !existingIds.has(p.id))
            return [...prev, ...newPosts]
          })
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

  const handleLoadNewPosts = async () => {
    // console.log('HANDLE LOAD NEW POSTS CALLED')
    if (isRefreshingFeed) return
    setIsRefreshingFeed(true)

    try {
      const limit = 5
      const offset = 0

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, title, content, type, created_at, upvote_count, downvote_count, answer_count, is_answered, tags, image_url, author_id, is_college_post,
          users!posts_author_id_fkey ( full_name, unique_id, role, is_verified, avatar_url ),
          communities ( slug, colleges ( name, short_name, logo_url ) )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!postsError && postsData) {
        setPosts(postsData)
        setHasMore(postsData.length === limit)
        setPage(2)
        setNewPostsQueue([])
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      console.error('Failed to soft refresh posts:', err)
    } finally {
      setIsRefreshingFeed(false)
    }
  }

  // Mount effect: Fetch communities/posts if no valid cache exists
  useEffect(() => {
    const validCache = getValidCache()
    if (!validCache && !(initialPosts?.length)) {
      fetchCommunities()
    }
  }, [])



  // Session Boundary Check
  useEffect(() => {
    if (!authLoading) {
      const currentUserId = user?.id || null
      if (communityFeedCache && communityFeedCache.userId !== null && communityFeedCache.userId !== currentUserId) {
        communityFeedCache = null
        setPosts([])
        setCommunities([])
        setPage(1)
        setHasMore(true)
        setFilter('all')
        setFeedSearchQuery('')
        setVotes({})
        setRecentUpvoters({})
        setExpandedPost(null)
        setPostAnswers({})
        setExpandedContent({})
        setLoading(true)
        fetchCommunities()
      }
    }
  }, [authLoading, user?.id])

  // Synchronize state to in-memory cache
  useEffect(() => {
    if (!loading) {
      communityFeedCache = {
        posts,
        communities,
        page,
        hasMore,
        filter,
        feedSearchQuery,
        votes,
        recentUpvoters,
        scrollY: communityFeedCache?.scrollY || 0,
        expandedPost,
        postAnswers,
        expandedContent,
        userId: authLoading ? (communityFeedCache?.userId || null) : (user?.id || null),
        timestamp: communityFeedCache?.timestamp || Date.now(),
        todayPosts,
        todayAnswers,
        todayReferrals,
        todaySeniors,
        campusJobs,
      }
    }
  }, [posts, communities, page, hasMore, filter, feedSearchQuery, votes, recentUpvoters, expandedPost, postAnswers, expandedContent, user?.id, loading, authLoading, todayPosts, todayAnswers, todayReferrals, todaySeniors, campusJobs])

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (communityFeedCache) {
        communityFeedCache.scrollY = window.scrollY
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Restore scroll position on mount if cache is valid
  useEffect(() => {
    const validCache = getValidCache()
    if (validCache && validCache.scrollY > 0) {
      const restoreScroll = () => {
        window.scrollTo(0, validCache.scrollY)
      }

      restoreScroll()

      const rafId1 = requestAnimationFrame(restoreScroll)
      const rafId2 = requestAnimationFrame(() => requestAnimationFrame(restoreScroll))

      const timeoutId1 = setTimeout(restoreScroll, 100)
      const timeoutId2 = setTimeout(restoreScroll, 300)
      const timeoutId3 = setTimeout(() => {
        restoreScroll()
        setIsRestoringScroll(false)
      }, 600)

      return () => {
        cancelAnimationFrame(rafId1)
        cancelAnimationFrame(rafId2)
        clearTimeout(timeoutId1)
        clearTimeout(timeoutId2)
        clearTimeout(timeoutId3)
      }
    } else {
      setIsRestoringScroll(false)
    }
  }, [])

  // Listen for new public posts via Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: "visibility=eq.public" },
        (payload) => {
          setNewPostsQueue(prev => {
            if (prev.some(p => p.id === payload.new.id)) return prev
            return [payload.new as any, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  const handleRefreshRef = useRef(handleLoadNewPosts)
  useEffect(() => {
    handleRefreshRef.current = handleLoadNewPosts
  })

  useEffect(() => {
    const onRefresh = () => {
      handleRefreshRef.current()
    }
    window.addEventListener('REFRESH_COMMUNITY_FEED', onRefresh)
    return () => window.removeEventListener('REFRESH_COMMUNITY_FEED', onRefresh)
  }, [])



  // Infinite Scroll Observer
  const feedEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isRestoringScroll || loading || !hasMore) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        fetchCommunities(true)
      }
    }, { threshold: 0.1 })

    if (feedEndRef.current) {
      observer.observe(feedEndRef.current)
    }
    return () => observer.disconnect()
  }, [isRestoringScroll, loading, hasMore, loadingMore, page])

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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E14] font-plus-jakarta-sans antialiased">
        <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-6 lg:px-8 mt-0 sm:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <aside className="hidden md:block md:col-span-3 space-y-4">
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-5 shadow-sm animate-pulse">
                <div className="w-16 h-16 bg-slate-200 dark:bg-[#38434F] rounded-full mx-auto mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-24 mx-auto mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-32 mx-auto" />
              </div>
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-full" />
                ))}
              </div>
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-28 mb-3" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                    <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded flex-1" />
                  </div>
                ))}
              </div>
            </aside>
            <main className="md:col-span-9 lg:col-span-6 space-y-4">
              <div className="bg-surface dark:bg-[#283036] rounded-none sm:rounded-md border-y sm:border border-surface dark:border-[#38434F] p-5 shadow-sm animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                  <div className="h-10 bg-slate-200 dark:bg-[#38434F] rounded-full flex-1" />
                  <div className="w-10 h-10 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 bg-slate-200 dark:bg-[#38434F] rounded-full w-24 flex-shrink-0" />
                  ))}
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-5 shadow-sm animate-pulse space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                    <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-32" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 bg-slate-200 dark:bg-[#38434F] rounded w-16" />
                    <div className="h-8 bg-slate-200 dark:bg-[#38434F] rounded w-20" />
                    <div className="h-8 bg-slate-200 dark:bg-[#38434F] rounded w-16" />
                  </div>
                </div>
              ))}
            </main>
            <aside className="hidden lg:block lg:col-span-3 space-y-4">
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-28 mb-3" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2 pb-2 border-b border-surface dark:border-[#38434F] last:border-0">
                    <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-1/2" />
                  </div>
                ))}
              </div>
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-4 shadow-sm animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-[#38434F] rounded w-24 mb-3" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-20" />
                    <div className="h-2 bg-slate-200 dark:bg-[#38434F] rounded w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-[#38434F] rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-200 dark:bg-[#38434F] rounded w-24" />
                    <div className="h-2 bg-slate-200 dark:bg-[#38434F] rounded w-28" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E14] font-plus-jakarta-sans text-[#1E293B] dark:text-[#E4E8EC] antialiased pb-12">

      {/* Global Navbar Header dynamic search triggers */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-w-xl bg-surface dark:bg-[#283036] rounded-xl shadow-2xl overflow-hidden border border-surface dark:border-[#38434F]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4">
              <Search className="text-slate-400 dark:text-[#B0B7BE] w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search globally across people, groups, posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
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
      <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-6 lg:px-8 mt-0 sm:mt-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">

          {/* ════ LEFT COLUMN: Rich Sticky LinkedIn-style Profile Identity Card ════ */}
          <LeftSidebar
            user={user}
            userCommunity={userCommunity}
            filter={filter}
            setFilter={setFilter}
            setFeedSearchQuery={setFeedSearchQuery}
          />

          {/* ════ CENTER COLUMN: Searchable + Filterable Feed ════ */}
          <main className="md:col-span-8 lg:col-span-6 space-y-3 sm:space-y-4">

            {user && calculateProfileCompletion(user) < 80 && (() => {
              const pct = calculateProfileCompletion(user)
              const radius = 22
              const stroke = 4
              const circumference = 2 * Math.PI * radius
              const offset = circumference - (pct / 100) * circumference
              const missing = [
                !user.avatar_url && 'Photo',
                !user.headline && 'Headline',
                !user.bio && 'Bio',
              ].filter(Boolean)
              return (
                <div className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  {/* Circular Progress Ring */}
                  <div className="relative flex-shrink-0 flex items-center justify-center">
                    <svg width={56} height={56} className="rotate-[-90deg]">
                      <circle cx={28} cy={28} r={radius} fill="none" stroke="#E8D5FF" strokeWidth={stroke} />
                      <circle
                        cx={28} cy={28} r={radius} fill="none"
                        stroke="#7C3AED" strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>
                    <span className="absolute text-[11px] font-extrabold text-purple-700 dark:text-purple-300">{pct}%</span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Complete Your Profile</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      Missing: <span className="text-purple-600 dark:text-purple-400 font-semibold">{missing.join(', ')}</span>
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex-shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm shadow-purple-600/20"
                  >
                    Complete
                  </button>
                </div>
              )
            })()}

            {/* Dedicated LinkedIn-Style Feed Search & Filter Bar */}
            <div className="bg-surface dark:bg-[#283036] rounded-none sm:rounded-md border-y border-x-0 sm:border border-surface dark:border-[#38434F] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                {/* Circular Profile Avatar */}
                <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-[#1D2226] flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs overflow-hidden flex-shrink-0 border border-surface dark:border-[#38434F]">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.[0] || 'U'
                  )}
                </div>

                {/* Local search input block */}
                <div className="flex-1 flex items-center gap-2 bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] hover:border-slate-300 dark:hover:border-[#38434F] rounded-full px-4 py-2.5 transition-all focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20">
                  <Search className="w-4 h-4 text-slate-400 dark:text-[#B0B7BE] flex-shrink-0" />
                  <input
                    type="text"
                    value={feedSearchQuery}
                    onChange={(e) => setFeedSearchQuery(e.target.value)}
                    placeholder="Search feed by title, tag, keywords, author, or campus..."
                    className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-805 placeholder-slate-400 dark:placeholder-slate-500"
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

                {/* Circular Post creator button */}
                <button
                  onClick={() => setShowPostModal(true)}
                  className="w-10 h-10 sm:w-8 sm:h-8 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-[#7C3AED] rounded-full border border-purple-100 dark:border-purple-800 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
                  title="Create a new post"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Feed Filters row - Keep as only system of filters */}
              <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-surface dark:border-[#38434F] scrollbar-none select-none px-1">
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
                      className={`flex items-center gap-2 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full transition-all font-semibold text-xs whitespace-nowrap cursor-pointer ${isActive
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-[#7C3AED] border border-purple-200 dark:border-purple-800'
                        : 'bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] hover:bg-app dark:hover:bg-[#1D2226] text-slate-600 dark:text-[#B0B7BE]'
                        }`}
                    >
                      <btn.icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-[#7C3AED]' : btn.color}`} />
                      <span>{btn.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filter query status information */}
            {(feedSearchQuery || filter !== 'all') && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-md px-3 py-2 flex items-center justify-between text-[11px] font-bold">
                <span className="text-purple-950 dark:text-purple-200 flex items-center gap-2">
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

            {/* LinkedIn-Style New Posts Available Pill / Refresh Indicator */}
            {(isRefreshingFeed || newPostsQueue.length > 0) && (
              <div className="flex justify-center my-3.5 h-9">
                {isRefreshingFeed ? (
                  <div className="flex items-center justify-center px-4 py-2 bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] rounded-full shadow-sm gap-2">
                    <div className="w-4 h-4 border-2 border-purple-100 border-t-[#7C3AED] rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-[#B0B7BE]">Refreshing feed...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadNewPosts}
                    className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                    <span>↑ {newPostsQueue.length} New Post{newPostsQueue.length > 1 ? 's' : ''} Available</span>
                  </button>
                )}
              </div>
            )}

            {/* High-density interactive Post cards */}
            {filteredPosts.length === 0 ? (
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-10 text-center shadow-sm">
                <div className="w-12 h-12 bg-app dark:bg-[#1D2226] border border-surface dark:border-[#38434F] rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-slate-400 dark:text-[#B0B7BE]" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">No matching posts in view</h4>
                <p className="text-slate-400 dark:text-[#B0B7BE] text-[10px] mt-1 font-semibold">Try modifying your filters or search keywords above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredPosts.map((post: any) => {
                    return (
                      <FeedPost
                        key={post.id}
                        post={post}
                        expandedContent={expandedContent[post.id]}
                        voteData={votes[post.id]}
                        recentUpvoters={recentUpvoters[post.id]}
                        expandedPost={expandedPost}
                        postAnswers={postAnswers[post.id]}
                        answersLoading={answersLoading[post.id]}
                        onToggleContent={toggleContentExpansion}
                        onVote={handleVote}
                        onToggleAnswerSection={toggleAnswerSection}
                        onSharePost={handleSharePost}
                        onSubmitInlineAnswer={submitInlineAnswer}
                        onDeleteInlineAnswer={deleteInlineAnswer}
                        currentUserId={user?.id}
                        onUpvotersClick={handleUpvotersClick}
                      />
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
                  <div className="text-center py-6 text-slate-400 dark:text-[#B0B7BE] font-bold text-xs">
                    You've caught up with the entire community feed! 🎉
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ════ RIGHT COLUMN: Sticky Campus Leadership & Discovery ════ */}
          <RightSidebar
            communities={communities}
            userCommunity={userCommunity}
            posts={posts}
            todayPosts={todayPosts}
            todayAnswers={todayAnswers}
            todayReferrals={todayReferrals}
            todaySeniors={todaySeniors}
          />

        </div>
      </div>



      {/* ════ COMMUNITY CHAT WIDGET (Extracted) ════ */}
      <ChatWidget user={user} isNavVisible={isNavVisible} />

      {showPostModal && (
        <PostModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => {
            setShowPostModal(false)
            handleLoadNewPosts()
          }}
          communitySlug={userCommunity?.slug || ''}
          communityId={userCommunity?.id || ''}
          userRole={user?.role || 'student'}
          canPostAsCollege={isCollegeAdmin}
          collegeName={userCommunity?.colleges?.name}
          collegeLogo={userCommunity?.colleges?.logo_url}
          collegeSlug={userCommunity?.colleges?.slug}
          user={{
            name: user?.full_name || 'User',
            avatarUrl: user?.avatar_url,
            isVerified: user?.is_verified,
            collegeName: userCommunity?.colleges?.name,
            role: user?.role
          }}
        />
      )}

      {/* Likes Modal */}
      <LikesModal
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        postId={selectedPostId || ''}
        totalLikes={votes[selectedPostId || '']?.upvotes || 0}
        currentUser={user}
      />

    </div>
  )
}



export default function CommunityPageClient({ initialCommunities, initialPosts, initialCampusJobs }: CommunityPageClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E14] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans dark:text-white">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading community hub...</p>
      </div>
    }>
      <CommunityPageContent
        initialCommunities={initialCommunities}
        initialPosts={initialPosts}
        initialCampusJobs={initialCampusJobs}
      />
    </Suspense>
  )
}
