'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, Clock, Video,
  Users, TrendingUp, Filter, Search,
  ExternalLink, PlayCircle
} from 'lucide-react'

interface Webinar {
  id: string
  title: string
  description: string
  date: string
  duration: string
  instructor: string
  attended: boolean
  category: string
  meeting_link?: string
  recording_link?: string
}

export default function JuniorEventsPage() {
  const router = useRouter()
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'attended' | 'upcoming'>('all')

  useEffect(() => {
    fetchWebinars()
  }, [])

  const fetchWebinars = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockWebinars: Webinar[] = [
        {
          id: '1',
          title: 'Introduction to React Hooks',
          description: 'Learn the fundamentals of React Hooks and how to use them effectively in your applications.',
          date: '2024-03-15T10:00:00Z',
          duration: '2 hours',
          instructor: 'John Doe',
          attended: true,
          category: 'Technical',
          recording_link: 'https://example.com/recording1'
        },
        {
          id: '2',
          title: 'Career Guidance for IT Students',
          description: 'Essential tips and strategies for building a successful career in the IT industry.',
          date: '2024-03-20T14:00:00Z',
          duration: '1.5 hours',
          instructor: 'Jane Smith',
          attended: true,
          category: 'Career',
          recording_link: 'https://example.com/recording2'
        },
        {
          id: '3',
          title: 'Advanced JavaScript Concepts',
          description: 'Deep dive into advanced JavaScript concepts including closures, prototypes, and async programming.',
          date: '2024-03-25T16:00:00Z',
          duration: '2.5 hours',
          instructor: 'Mike Johnson',
          attended: false,
          category: 'Technical',
          meeting_link: 'https://example.com/meeting3'
        },
        {
          id: '4',
          title: 'Resume Building Workshop',
          description: 'Learn how to create a professional resume that stands out to recruiters.',
          date: '2024-03-30T11:00:00Z',
          duration: '1 hour',
          instructor: 'Sarah Wilson',
          attended: false,
          category: 'Career',
          meeting_link: 'https://example.com/meeting4'
        }
      ]
      setWebinars(mockWebinars)
    } catch (error) {
      console.error('Error fetching webinars:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const filteredWebinars = webinars.filter(webinar => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || 
                         (filter === 'attended' && webinar.attended) ||
                         (filter === 'upcoming' && isUpcoming(webinar.date))
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
              background: 'linear-gradient(135deg,#0A66C2,#06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={18} color="white" />
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0A0A0A'
            }}>
              cl<span style={{ color: '#0A66C2' }}>aspire</span>
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
            { label: 'Doubts', icon: '❓', href: '/dashboard/junior/doubts' },
            { label: 'Events', icon: '📅', href: '/dashboard/junior/events', active: true },
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
                color: item.active ? '#0A66C2' : '#6B7280',
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
                  background: '#0A66C2'
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
              Webinar History
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                padding: '6px 12px',
                borderRadius: 100,
                background: '#F0FDF4',
                color: '#16A34A',
                fontSize: 12,
                fontWeight: 600
              }}>
                {webinars.filter(w => w.attended).length} Attended
              </div>
              <div style={{
                padding: '6px 12px',
                borderRadius: 100,
                background: '#FEF3C7',
                color: '#D97706',
                fontSize: 12,
                fontWeight: 600
              }}>
                {webinars.filter(w => isUpcoming(w.date)).length} Upcoming
              </div>
            </div>
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
                placeholder="Search webinars..."
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
                { value: 'attended', label: 'Attended' },
                { value: 'upcoming', label: 'Upcoming' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: filter === option.value ? 'white' : 'transparent',
                    color: filter === option.value ? '#0A66C2' : '#6B7280',
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
              Loading webinars...
            </div>
          ) : filteredWebinars.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#9CA3AF'
            }}>
              <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#6B7280',
                margin: '0 0 8px'
              }}>
                No webinars found
              </h3>
              <p style={{
                fontSize: 14,
                color: '#9CA3AF',
                margin: 0
              }}>
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'No webinars scheduled at the moment'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: 16
            }}>
              {filteredWebinars.map(webinar => {
                const upcoming = isUpcoming(webinar.date)
                return (
                  <div key={webinar.id} style={{
                    background: 'white',
                    borderRadius: 12,
                    border: `1px solid ${upcoming ? '#FDE68A' : '#F3F4F6'}`,
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 100,
                      background: upcoming ? '#FEF3C7' : 
                               webinar.attended ? '#F0FDF4' : '#FEE2E2',
                      color: upcoming ? '#D97706' : 
                             webinar.attended ? '#16A34A' : '#EF4444'
                    }}>
                      {upcoming ? (
                        <>
                          <Clock size={10} />
                          Upcoming
                        </>
                      ) : webinar.attended ? (
                        <>
                          <PlayCircle size={10} />
                          Attended
                        </>
                      ) : (
                        <>
                          <Video size={10} />
                          Missed
                        </>
                      )}
                    </div>

                    <div style={{ marginRight: 120 }}>
                      <h3 style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#0A0A0A',
                        margin: '0 0 8px',
                        fontFamily: 'Instrument Serif, serif'
                      }}>
                        {webinar.title}
                      </h3>
                      
                      <p style={{
                        fontSize: 14,
                        color: '#6B7280',
                        margin: '0 0 16px',
                        lineHeight: 1.5
                      }}>
                        {webinar.description}
                      </p>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        fontSize: 13,
                        color: '#9CA3AF'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={14} />
                          {formatDate(webinar.date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={14} />
                          {formatTime(webinar.date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Video size={14} />
                          {webinar.duration}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={14} />
                          {webinar.instructor}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 16
                    }}>
                      {upcoming && webinar.meeting_link && (
                        <button
                          onClick={() => window.open(webinar.meeting_link, '_blank')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: '#0A66C2',
                            color: 'white',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <ExternalLink size={14} />
                          Join Webinar
                        </button>
                      )}
                      
                      {!upcoming && webinar.recording_link && (
                        <button
                          onClick={() => window.open(webinar.recording_link, '_blank')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: '#06B6D4',
                            color: 'white',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <PlayCircle size={14} />
                          Watch Recording
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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
