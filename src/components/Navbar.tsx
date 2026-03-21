'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Menu, Users, GraduationCap, Briefcase, DollarSign, LayoutDashboard, User, LogOut, ChevronRight, MessageSquare } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // Fetch unread message count
  useEffect(() => {
    if (!user?.id) return

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/messages/unread-count')
        const data = await res.json()
        setUnreadMessageCount(data.count || 0)
      } catch (err) {
        console.error('Failed to fetch unread count:', err)
      }
    }

    fetchUnreadCount()
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Sync mobile menu state with body class for BottomNavbar visibility
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-active')
    } else {
      document.body.classList.remove('mobile-menu-active')
    }

    // Dispatch custom event for BottomNavbar and other components
    window.dispatchEvent(new CustomEvent('claspire:mobileMenuToggle', {
      detail: { open: mobileMenuOpen }
    }));

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-active');
      window.dispatchEvent(new CustomEvent('claspire:mobileMenuToggle', {
        detail: { open: false }
      }));
    };
  }, [mobileMenuOpen])

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 z-[999] bg-white/97 border-b border-gray-200 backdrop-blur-[8px]">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-plus-jakarta-sans font-bold text-lg text-black no-underline hover:no-underline">
            Clas<span style={{ color: '#7C3AED' }}>pire</span>
          </Link>
        </div>

        {/* Desktop Center Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/community" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
            <Users size={16} />
            Community
          </Link>
          <Link href={user?.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior'} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link href="/seniors" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
            <Users size={16} />
            Seniors
          </Link>
          <Link href="/jobs" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
            <Briefcase size={16} />
            Jobs
          </Link>
          <Link href="/colleges" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
            <GraduationCap size={16} />
            Colleges
          </Link>
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#F3F4F6',
              animation: 'pulse 1.5s infinite'
            }} />
          ) : user ? (
            <div className="flex items-center gap-4">
              <NotificationBell dark />
              <Link 
                href={user?.role === 'senior' ? '/dashboard/senior?activeTab=messages' : '/dashboard/junior?activeTab=messages'}
                className="relative p-2 rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <MessageSquare size={20} />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadMessageCount}
                  </span>
                )}
              </Link>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: 100,
                    padding: '6px 12px 6px 6px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: user.avatar_url
                      ? 'transparent'
                      : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 800,
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'U'
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }} className="hidden sm:block">
                    {user.full_name?.split(' ')[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{
                      transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s'
                    }}>
                    <path d="M2 4l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div style={{
                      position: 'absolute',
                      right: 0, top: 'calc(100% + 8px)',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: 12,
                      padding: 8,
                      minWidth: 200,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      zIndex: 50
                    }}>
                      <div style={{
                        padding: '8px 12px 12px',
                        borderBottom: '1px solid #F3F4F6',
                        marginBottom: 4
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{user.full_name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: 'monospace' }}>{user.unique_id}</div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: user.role === 'senior' ? '#F0FDF4' : '#F3F0FF',
                          border: `1px solid ${user.role === 'senior' ? '#BBF7D0' : '#DDD6FE'}`,
                          borderRadius: 100,
                          padding: '2px 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: user.role === 'senior' ? '#16A34A' : '#7C3AED',
                          marginTop: 6
                        }}>
                          {user.role === 'senior' ? '✅ Verified Senior' : '🎓 Student'}
                        </div>
                      </div>
                      {[
                        { icon: LayoutDashboard, label: 'Dashboard', href: user.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior' },
                        { icon: User, label: 'My Profile', href: '/profile' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#374151',
                            textDecoration: 'none',
                            transition: 'background 0.1s'
                          }}
                          className="hover:bg-gray-50"
                        >
                          <item.icon size={16} color="#6B7280" />
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ height: 1, background: '#F3F4F6', margin: '4px 0' }} />
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          signOut()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#EF4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'background 0.1s'
                        }}
                        className="hover:bg-red-50"
                      >
                        <LogOut size={16} color="#EF4444" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="/login">
                <button style={{
                  background: 'transparent',
                  color: '#7C3AED',
                  border: '1.5px solid #7C3AED',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button style={{
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  Join Free
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right */}
        <div className="md:hidden flex items-center gap-3">
          {loading ? (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
          ) : user ? (
            <div className="flex items-center gap-3">
              <NotificationBell dark />
              <Link 
                href={user?.role === 'senior' ? '/dashboard/senior?activeTab=messages' : '/dashboard/junior?activeTab=messages'}
                className="relative p-2 rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <MessageSquare size={18} />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadMessageCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-xs font-black flex items-center justify-center overflow-hidden"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                )}
              </button>
            </div>
          ) : (
            <Link href="/signup">
              <button className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                Join
              </button>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              width: 36, height: 36,
              borderRadius: 8,
              border: '1.5px solid #E5E7EB',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} color="#374151" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 998,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* Slide-in Panel */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px',
          background: 'white',
          zIndex: 999,
          transform: 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          animation: 'slideInLeft 0.3s ease-out'
        }}>

          {/* Panel Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px',
            borderBottom: '1px solid #F3F4F6'
          }}>
            {/* Logo */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#0A0A0A',
                textDecoration: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
            >
              Clas<span style={{ color: '#7C3AED' }}>pire</span>
            </Link>

            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                border: '1px solid #E5E7EB',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} color="#6B7280" />
            </button>
          </div>

          {/* User card (if logged in) */}
          {user && (
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F3F4F6',
              background: '#F9FAFB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: user.avatar_url
                    ? 'transparent'
                    : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 800,
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.full_name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'
                  )}
                </div>

                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0A0A0A'
                  }}>
                    {user.full_name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#9CA3AF',
                    marginTop: 2,
                    fontFamily: 'monospace'
                  }}>
                    {user.unique_id}
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: user.role === 'senior'
                  ? '#F0FDF4' : '#F3F0FF',
                border: `1px solid ${user.role === 'senior'
                  ? '#BBF7D0' : '#DDD6FE'}`,
                borderRadius: 100,
                padding: '3px 10px',
                fontSize: 10,
                fontWeight: 700,
                color: user.role === 'senior'
                  ? '#16A34A' : '#7C3AED',
                marginTop: 10
              }}>
                {user.role === 'senior'
                  ? '✓ Verified Senior'
                  : '✓ Student'}
              </div>
            </div>
          )}

          {/* Nav Links */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 12px'
          }}>

            {/* Section: Main */}
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              padding: '8px 8px 4px',
              margin: 0
            }}>
              Main
            </p>

            {[
              { label: 'Community', href: '/community', icon: Users },
              { label: 'Colleges', href: '/colleges', icon: GraduationCap },
              { label: 'Seniors', href: '/seniors', icon: Users },
              { label: 'Jobs', href: '/jobs', icon: Briefcase },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 10px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                  marginBottom: 2,
                  gap: 12
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement)
                    .style.background = '#F9FAFB'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement)
                    .style.background = 'transparent'
                }}
              >
                <item.icon size={18} color="#6B7280" />
                {item.label}
              </a>
            ))}

            {/* Section: Account (if logged in) */}
            {user && (
              <>
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#9CA3AF',
                  padding: '16px 8px 4px',
                  margin: 0
                }}>
                  Account
                </p>

                {[
                  {
                    label: 'Dashboard',
                    href: user.role === 'senior'
                      ? '/dashboard/senior'
                      : '/dashboard/junior',
                    icon: LayoutDashboard
                  },
                  { label: 'My Profile', href: '/profile', icon: User },
                ].map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 10px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                      textDecoration: 'none',
                      transition: 'background 0.1s',
                      marginBottom: 2,
                      gap: 12
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement)
                        .style.background = '#F9FAFB'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement)
                        .style.background = 'transparent'
                    }}
                  >
                    <item.icon size={18} color="#6B7280" />
                    {item.label}
                  </a>
                ))}
              </>
            )}

            {/* Pricing */}
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              padding: '16px 8px 4px',
              margin: 0
            }}>
              More
            </p>

            <a
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 10px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                textDecoration: 'none',
                marginBottom: 2,
                gap: 12
              }}
            >
              <DollarSign size={18} color="#6B7280" />
              Pricing
            </a>
          </div>

          {/* Bottom section */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #F3F4F6'
          }}>
            {user ? (
              // Sign out button
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut()
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: '1.5px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#EF4444',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <LogOut size={18} />
                Sign Out
              </button>
            ) : (
              // Login + Signup buttons
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <a
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    border: '1.5px solid #E5E7EB',
                    background: 'white',
                    color: '#0A0A0A',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  Sign In
                </a>
                <a
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  Join Free →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
