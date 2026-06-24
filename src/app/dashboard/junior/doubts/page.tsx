'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, HelpCircle, Clock, CheckCircle,
  TrendingUp, Calendar, Filter, Search
} from 'lucide-react'

interface Doubt {
  id: string
  title: string
  content: string
  created_at: string
  is_answered: boolean
  upvote_count: number
  answer_count: number
  category: string
}

export default function JuniorDoubtsPage() {
  const router = useRouter()
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'answered' | 'pending'>('all')

  useEffect(() => {
    fetchDoubts()
  }, [])

  const fetchDoubts = async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      if (!res.ok) return
      const data = await res.json()
      setDoubts(data.myPosts || [])
    } catch (error) {
      console.error('Error fetching doubts:', error)
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const filteredDoubts = doubts.filter(doubt => {
    const matchesSearch = doubt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doubt.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || 
                         (filter === 'answered' && doubt.is_answered) ||
                         (filter === 'pending' && !doubt.is_answered)
    return matchesSearch && matchesFilter
  })

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#F8F9FA',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>

      {/* Sidebar - Same as main dashboard */}
      <div className="mobile-sidebar" style={{
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
              background: 'linear-gradient(135deg,#F4A01C,#06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HelpCircle size={18} color="white" />
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0A0A0A'
            }}>
              cl<span style={{ color: '#F4A01C' }}>aspire</span>
            </span>
          </div>
        </div>

        {/* Back Button */}
        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={() => router.push('/dashboard/junior')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #F3F4F6',
              background: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#6B7280',
              width: '100%'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>

        {/* Navigation */}
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
            { label: 'Overview', icon: '📊', href: '/dashboard/junior' },
            { label: 'Doubts', icon: '❓', href: '/dashboard/junior/doubts', active: true },
            { label: 'Events', icon: '📅', href: '/dashboard/junior/events' },
            { label: 'Community', icon: '👥', href: '/community' },
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
                background: item.active ? '#F3F0FF' : 'transparent',
                color: item.active ? '#F4A01C' : '#6B7280',
                fontWeight: item.active ? 700 : 500,
                fontSize: 14
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.active && (
                <div style={{
                  marginLeft: 'auto',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: '#F4A01C'
                }} />
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="mobile-main" style={{
        marginLeft: 260,
        flex: 1,
        padding: '0 0 40px'
      }}>

        {/* Header */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #F3F4F6',
          padding: '20px 32px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h1 style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0A0A0A',
              margin: 0,
              fontFamily: 'Instrument Serif, serif'
            }}>
              My Doubts History
            </h1>
            <button
              onClick={() => router.push('/community?create=true')}
              style={{
                background: 'linear-gradient(135deg, #F4A01C, #06B6D4)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <HelpCircle size={16} />
              Ask New Doubt
            </button>
          </div>

          {/* Search and Filter */}
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center'
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              maxWidth: 400
            }}>
              <Search size={18} style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }} />
              <input
                type="text"
                placeholder="Search doubts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: 8,
                  border: '1px solid #F3F4F6',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'Plus Jakarta Sans'
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: 4,
              background: '#F9FAFB',
              padding: 2,
              borderRadius: 8
            }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'answered', label: 'Answered' },
                { value: 'pending', label: 'Pending' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: filter === option.value ? 'white' : 'transparent',
                    color: filter === option.value ? '#F4A01C' : '#6B7280',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px' }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#9CA3AF'
            }}>
              Loading doubts...
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#9CA3AF'
            }}>
              <HelpCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#6B7280',
                margin: '0 0 8px'
              }}>
                No doubts found
              </h3>
              <p style={{
                fontSize: 14,
                color: '#9CA3AF',
                margin: '0 0 20px'
              }}>
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Start by asking your first doubt in the community'}
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={() => router.push('/community?create=true')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: '#F4A01C',
                    color: 'white',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ask First Doubt
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: 16
            }}>
              {filteredDoubts.map(doubt => (
                <div key={doubt.id} style={{
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #F3F4F6',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12
                  }}>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#0A0A0A',
                      margin: 0,
                      flex: 1,
                      lineHeight: 1.4
                    }}>
                      {doubt.title || doubt.content.slice(0, 100) + '...'}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 100,
                      background: doubt.is_answered ? '#F0FDF4' : '#FEF3C7',
                      color: doubt.is_answered ? '#16A34A' : '#D97706',
                      whiteSpace: 'nowrap',
                      marginLeft: 12
                    }}>
                      {doubt.is_answered ? (
                        <>
                          <CheckCircle size={10} />
                          Answered
                        </>
                      ) : (
                        <>
                          <Clock size={10} />
                          Pending
                        </>
                      )}
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: 14,
                    color: '#6B7280',
                    margin: '0 0 12px',
                    lineHeight: 1.5
                  }}>
                    {doubt.content}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 12,
                    color: '#9CA3AF'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={12} />
                      {doubt.upvote_count} upvotes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HelpCircle size={12} />
                      {doubt.answer_count} answers
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      {timeAgo(doubt.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-sidebar {
            transform: translateX(-100%) !important;
          }
          .mobile-main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
