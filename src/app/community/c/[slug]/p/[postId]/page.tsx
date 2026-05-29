'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowLeft, ArrowUp, ArrowDown, MessageCircle,
  CheckCircle, Clock, Eye, Shield, Send,
  ChevronRight, TrendingUp, Share2
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

import PostImageCarousel from '@/components/PostImageCarousel'

export default function PostDetailPage({ params }: { params: Promise<{ slug: string; postId: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [postId, setPostId] = useState('')
  const [post, setPost] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAnswer, setNewAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [voteLoading, setVoteLoading] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const { slug: s, postId: p } = await params
      setSlug(s)
      setPostId(p)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchCurrentUser()
    }
  }, [postId])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const json = await res.json()
        setCurrentUser(json.user)
      }
    } catch {
      // Not logged in
    }
  }

  const fetchPost = async () => {
    setLoading(true)
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          ),
          communities (
            slug,
            colleges ( name, short_name )
          )
        `)
        .eq('id', postId)
        .single()

      if (postError || !postData) {
        console.error('Post fetch error:', postError)
        router.push(`/community/c/${slug}`)
        return
      }

      setPost(postData)

      // Increment view count
      await supabase
        .from('posts')
        .update({ view_count: (postData.view_count || 0) + 1 })
        .eq('id', postId)

      // Fetch answers
      const { data: answersData } = await supabase
        .from('answers')
        .select(`
          *,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true })

      setAnswers(answersData || [])

      // Fetch user vote
      try {
        const authRes = await fetch('/api/auth/me')
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData.user) {
            const { data: voteData } = await supabase
              .from('votes')
              .select('vote_type')
              .eq('post_id', postId)
              .eq('user_id', authData.user.id)
              .single()
            if (voteData) {
              setUserVote(voteData.vote_type as 'upvote' | 'downvote')
            }
          }
        }
      } catch {}

    } catch (err) {
      console.error('Error:', err)
      router.push(`/community/c/${slug}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (voteLoading) return
    
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

      setVoteLoading(true)

      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, vote_type: voteType })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh post data
          const { data: updatedPost } = await supabase
            .from('posts')
            .select('upvote_count, downvote_count')
            .eq('id', postId)
            .single()
          
          if (updatedPost) {
            setPost((prev: any) => ({
              ...prev,
              upvote_count: updatedPost.upvote_count,
              downvote_count: updatedPost.downvote_count
            }))
          }
          setUserVote(result.action === 'removed' ? null : voteType)
        }
      }
    } catch (err) {
      console.error('Vote error:', err)
    } finally {
      setVoteLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim() || submitting) return

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

      setSubmitting(true)

      const { data, error } = await supabase
        .from('answers')
        .insert({
          post_id: postId,
          author_id: authData.user.id,
          content: newAnswer.trim()
        })
        .select(`
          *,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          )
        `)
        .single()

      if (!error && data) {
        setAnswers(prev => [...prev, data])
        setNewAnswer('')
        // Update answer count
        await supabase
          .from('posts')
          .update({ answer_count: (post.answer_count || 0) + 1 })
          .eq('id', postId)
        setPost((prev: any) => ({
          ...prev,
          answer_count: (prev.answer_count || 0) + 1
        }))
      }
    } catch (err) {
      console.error('Answer error:', err)
    } finally {
      setSubmitting(false)
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

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'doubt':
        return { label: 'Doubt', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '❓' }
      case 'discussion':
        return { label: 'Discussion', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '💬' }
      case 'experience':
        return { label: 'Experience', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '⭐' }
      case 'referral_hunt':
        return { label: 'Referral Hunt', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '🎯' }
      case 'resource':
        return { label: 'Resource', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '📚' }
      default:
        return { label: type, color: '#6B7280', bg: '#F9FAFB', border: '#F3F4F6', icon: '📝' }
    }
  }

  if (loading) {
    return (
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
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontWeight: 500 }}>
          Loading post...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!post) return null

  const ts = getTypeStyle(post.type)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4FF',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      overflowX: 'hidden'
    }}>

      {/* Breadcrumb */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #EEEBFF',
        padding: '12px 20px',
      }}>
        <div style={{
          maxWidth: 800,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: '#9CA3AF',
          fontWeight: 500
        }}>
          <span
            onClick={() => router.push('/community')}
            style={{ cursor: 'pointer', color: '#7C3AED', fontWeight: 600 }}
          >
            Community
          </span>
          <ChevronRight size={12} />
          <span
            onClick={() => router.push(`/community/c/${slug}`)}
            style={{ cursor: 'pointer', color: '#7C3AED', fontWeight: 600 }}
          >
            c/{slug}
          </span>
          <ChevronRight size={12} />
          <span style={{ color: '#6B7280' }}>Post</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: 800,
        margin: '24px auto',
        padding: '0 16px',
        paddingBottom: 100
      }}>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#7C3AED',
            background: 'white',
            border: '1px solid #EEEBFF',
            borderRadius: 10,
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans',
            marginBottom: 16
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Post Card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #EEEBFF',
          padding: '24px',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Author Row */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 10,
              background: post.users?.avatar_url 
                ? 'transparent' 
                : (post.users?.role === 'senior'
                    ? 'linear-gradient(135deg,#059669,#34D399)'
                    : 'linear-gradient(135deg,#7C3AED,#06B6D4)'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 15,
              fontWeight: 800,
              flexShrink: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onClick={() => router.push(`/u/${post.users?.unique_id}`)}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {post.users?.avatar_url ? (
                <img 
                  src={post.users.avatar_url} 
                  alt={post.users.full_name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                post.users?.full_name?.[0] || 'U'
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 4
              }}>
                <span 
                  onClick={() => router.push(`/u/${post.users?.unique_id}`)}
                  style={{ fontSize: 15, fontWeight: 700, color: '#1F2937', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
                  onMouseLeave={e => e.currentTarget.style.color = '#1F2937'}
                >
                  {post.users?.full_name}
                </span>
                {post.users?.role === 'senior' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    background: '#ECFDF5', color: '#059669',
                    padding: '2px 6px', borderRadius: 100,
                    border: '1px solid #A7F3D0'
                  }}>
                    SENIOR
                  </span>
                )}
                {post.users?.is_verified && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    background: '#EDE9FE', color: '#7C3AED',
                    padding: '2px 6px', borderRadius: 100
                  }}>
                    VERIFIED
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}>
                <span
                  onClick={() => router.push(`/community/c/${slug}`)}
                  style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#7C3AED', background: '#F5F3FF',
                    padding: '2px 8px', borderRadius: 100,
                    cursor: 'pointer'
                  }}
                >
                  c/{slug}
                </span>
                <span style={{ fontSize: 11, color: '#D1D5DB' }}>•</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} />
                  {timeAgo(post.created_at)}
                </span>
              </div>
            </div>

            {/* Type Badge */}
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: ts.bg, color: ts.color,
              border: `1.5px solid ${ts.border}`,
              padding: '4px 12px', borderRadius: 100,
              letterSpacing: '0.02em', textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {ts.icon} {ts.label}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 12px',
            lineHeight: 1.4,
            wordBreak: 'break-word'
          }}>
            {post.title}
          </h1>

          {/* Content */}
          <p style={{
            fontSize: 14,
            color: '#4B5563',
            margin: '0 0 16px',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {post.content}
          </p>

          <PostImageCarousel 
            imageUrls={post.image_url} 
            onImageClick={(url) => window.open(url, '_blank')} 
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginBottom: 16
            }}>
              {post.tags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 600,
                  background: '#F5F3FF', color: '#7C3AED',
                  padding: '3px 8px', borderRadius: 100,
                  border: '1px solid #EDE9FE'
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 16,
            borderTop: '1px solid #F3F4F6',
            flexWrap: 'wrap'
          }}>
            {/* Upvote */}
            <button
              onClick={() => handleVote('upvote')}
              disabled={voteLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700,
                color: userVote === 'upvote' ? '#7C3AED' : '#6B7280',
                background: userVote === 'upvote' ? '#F5F3FF' : '#F9FAFB',
                border: userVote === 'upvote' ? '1.5px solid #DDD6FE' : '1px solid #F3F4F6',
                borderRadius: 8, padding: '8px 14px',
                cursor: voteLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                transition: 'all 0.15s',
                opacity: voteLoading ? 0.6 : 1
              }}
            >
              <ArrowUp size={13} />
              {post.upvote_count || 0}
            </button>

            {/* Downvote */}
            <button
              onClick={() => handleVote('downvote')}
              disabled={voteLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700,
                color: userVote === 'downvote' ? '#EF4444' : '#6B7280',
                background: userVote === 'downvote' ? '#FEF2F2' : '#F9FAFB',
                border: userVote === 'downvote' ? '1.5px solid #FECACA' : '1px solid #F3F4F6',
                borderRadius: 8, padding: '8px 14px',
                cursor: voteLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                transition: 'all 0.15s',
                opacity: voteLoading ? 0.6 : 1
              }}
            >
              <ArrowDown size={13} />
              {post.downvote_count || 0}
            </button>

            {/* Answers count */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600,
              color: post.is_answered ? '#059669' : '#6B7280',
              background: post.is_answered ? '#ECFDF5' : '#F9FAFB',
              border: post.is_answered ? '1px solid #A7F3D0' : '1px solid #F3F4F6',
              borderRadius: 8, padding: '8px 14px'
            }}>
              <MessageCircle size={13} />
              {post.answer_count || 0} {post.is_answered ? 'Solved' : 'Answers'}
              {post.is_answered && <CheckCircle size={11} />}
            </span>

            {/* Views */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#D1D5DB', fontWeight: 500,
              marginLeft: 'auto'
            }}>
              <Eye size={12} />
              {post.view_count || 0} views
            </span>
          </div>
        </div>

        {/* Answers Section */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 800,
            color: '#111827', margin: '0 0 14px',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <MessageCircle size={16} color="#7C3AED" />
            Answers ({answers.length})
          </h2>

          {answers.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: 16,
              border: '1px solid #EEEBFF',
              padding: '32px 20px',
              textAlign: 'center'
            }}>
              <MessageCircle size={28} color="#DDD6FE" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', margin: '0 0 4px' }}>
                No answers yet
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                Be the first to help!
              </p>
            </div>
          ) : (
            answers.map((answer: any, index: number) => (
              <div
                key={answer.id}
                style={{
                  background: answer.is_accepted ? '#FEFFF5' : 'white',
                  borderRadius: 14,
                  border: answer.is_accepted ? '2px solid #A7F3D0' : '1px solid #EEEBFF',
                  padding: '18px',
                  marginBottom: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                }}
              >
                {answer.is_accepted && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 10, fontWeight: 700,
                    color: '#059669', background: '#ECFDF5',
                    padding: '4px 10px', borderRadius: 100,
                    border: '1px solid #A7F3D0',
                    marginBottom: 10, width: 'fit-content'
                  }}>
                    <CheckCircle size={11} />
                    ACCEPTED ANSWER
                  </div>
                )}

                {/* Answer Author */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 12
                }}>
                  <div 
                    onClick={() => router.push(`/u/${answer.users?.unique_id}`)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: answer.users?.avatar_url 
                        ? 'transparent' 
                        : (answer.users?.role === 'senior'
                            ? 'linear-gradient(135deg,#059669,#34D399)'
                            : 'linear-gradient(135deg,#7C3AED,#06B6D4)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 800, flexShrink: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span 
                        onClick={() => router.push(`/u/${answer.users?.unique_id}`)}
                        style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
                        onMouseLeave={e => e.currentTarget.style.color = '#1F2937'}
                      >
                        {answer.users?.full_name}
                      </span>
                      {answer.users?.role === 'senior' && (
                        <span style={{
                          fontSize: 8, fontWeight: 700,
                          background: '#ECFDF5', color: '#059669',
                          padding: '1px 5px', borderRadius: 100,
                          border: '1px solid #A7F3D0'
                        }}>
                          SENIOR
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
                      {timeAgo(answer.created_at)}
                    </span>
                  </div>
                </div>

                {/* Answer Content */}
                <p style={{
                  fontSize: 13, color: '#4B5563',
                  margin: 0, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {answer.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Answer Input */}
        {currentUser && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            padding: '18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            position: 'sticky',
            bottom: 16
          }}>
            <p style={{
              fontSize: 12, fontWeight: 700,
              color: '#374151', margin: '0 0 10px'
            }}>
              Your Answer
            </p>
            <textarea
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              placeholder="Write your answer here..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: '12px',
                borderRadius: 10,
                border: '1.5px solid #EEEBFF',
                fontSize: 13,
                fontFamily: 'Plus Jakarta Sans',
                color: '#374151',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.6
              }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#EEEBFF'}
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!newAnswer.trim() || submitting}
              style={{
                marginTop: 10,
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 700,
                color: 'white',
                background: !newAnswer.trim() || submitting
                  ? '#D1D5DB'
                  : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                cursor: !newAnswer.trim() || submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                transition: 'all 0.15s'
              }}
            >
              <Send size={13} />
              {submitting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        )}

        {!currentUser && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #EEEBFF',
            padding: '24px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px', fontWeight: 500 }}>
              Login to post your answer
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                fontSize: 13, fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans'
              }}
            >
              Login →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="maxWidth: 800"] {
            padding: 0 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
