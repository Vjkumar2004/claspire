'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { X, Menu, Users, GraduationCap, Briefcase, DollarSign, LayoutDashboard, User, LogOut, ChevronRight, MessageSquare, Building2, Search, ArrowLeft, Sun, Moon } from 'lucide-react'
import NotificationBell from './NotificationBell'
import SearchBar from './search/SearchBar'
import { useTheme } from '@/contexts/ThemeContext'

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, loading, signOut } = useAuth()
  const { unreadMessageCount } = useUnreadMessages()
  const { pendingNetworkRequestsCount } = useNotifications()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [primaryCommunitySlug, setPrimaryCommunitySlug] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      fetch('/api/community/my-college')
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Not found')
        })
        .then(data => {
          if (data.communitySlug) {
            setPrimaryCommunitySlug(data.communitySlug)
          }
        })
        .catch(err => {
          console.error('Failed to fetch primary community slug:', err)
        })
    } else {
      setPrimaryCommunitySlug(null)
    }
  }, [user])

  const isFullscreenMessages =
    pathname === '/dashboard/senior/messages' ||
    pathname === '/dashboard/junior/messages' ||
    pathname?.startsWith('/community/c/') && pathname?.includes('/group/')

  const isLandingPage = pathname === '/'

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

  if (isFullscreenMessages) return null

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 h-14 z-[999] backdrop-blur-[12px] ${
      isLandingPage
        ? 'bg-[#0A2540] border-b border-[#1B4F72]'
        : 'bg-surface/90 dark:bg-[#1D2226]/90 border-b border-surface dark:border-[#38434F]'
    }`}>
      <div className="flex items-center justify-between h-full px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/" className={`font-[family-name:var(--font-inter)] font-extrabold text-xl no-underline hover:no-underline tracking-tight flex items-center ${
            isLandingPage ? 'text-white' : 'text-black dark:text-white'
          }`}>
            cl<span className={isLandingPage ? 'text-[#F4A01C]' : 'text-[#7C3AED]'}>aspire</span>
          </Link>
        </div>

        {/* Desktop Sticky Navbar Search Bar (Transitions width smoothly on focus to prevent overlapping menu links) */}
        <div className="hidden md:flex items-center gap-3 flex-1 min-w-[160px] max-w-[240px] lg:max-w-[320px] transition-all duration-300 ease-in-out ml-4 mr-auto">
          <SearchBar />
        </div>

        {/* Desktop Center Links */}
        <div className="hidden md:flex items-center gap-1 xl:gap-2 h-full flex-shrink-0">
          <Link 
            href="/community" 
            onClick={(e) => {
              if (pathname === '/community') {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('REFRESH_COMMUNITY_FEED'))
              }
            }}
            className={`flex items-center gap-1.5 px-2 xl:px-3 h-full text-[13px] font-semibold transition-all border-b-2 ${
            pathname === '/community' 
              ? isLandingPage ? 'text-[#F4A01C] border-[#F4A01C]' : 'text-[#7C3AED] border-[#7C3AED]'
              : isLandingPage
                ? 'text-white/70 border-transparent hover:text-white hover:border-[#F4A01C]/50'
                : 'text-gray-500 dark:text-[#8B949E] border-transparent hover:text-black dark:hover:text-white hover:border-surface dark:hover:border-[#38434F]'
          }`}>
            <Users size={16} />
            <span className="hidden lg:block">Community</span>
          </Link>
          <Link href="/groups" className={`flex items-center gap-1.5 px-2 xl:px-3 h-full text-[13px] font-semibold transition-all border-b-2 ${
            pathname === '/groups' 
              ? isLandingPage ? 'text-[#F4A01C] border-[#F4A01C]' : 'text-[#7C3AED] border-[#7C3AED]'
              : isLandingPage
                ? 'text-white/70 border-transparent hover:text-white hover:border-[#F4A01C]/50'
                : 'text-gray-500 dark:text-[#8B949E] border-transparent hover:text-black dark:hover:text-white hover:border-surface dark:hover:border-[#38434F]'
          }`}>
            <Building2 size={16} />
            <span className="hidden lg:block">Groups</span>
          </Link>
          <Link href={user?.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior'} className={`flex items-center gap-1.5 px-2 xl:px-3 h-full text-[13px] font-semibold transition-all border-b-2 ${
            pathname === '/dashboard/senior' || pathname === '/dashboard/junior'
              ? isLandingPage ? 'text-[#F4A01C] border-[#F4A01C]' : 'text-[#7C3AED] border-[#7C3AED]'
              : isLandingPage
                ? 'text-white/70 border-transparent hover:text-white hover:border-[#F4A01C]/50'
                : 'text-gray-500 dark:text-[#8B949E] border-transparent hover:text-black dark:hover:text-white hover:border-surface dark:hover:border-[#38434F]'
          }`}>
            <LayoutDashboard size={16} />
            <span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link href="/network" className={`relative flex items-center gap-1.5 px-2 xl:px-3 h-full text-[13px] font-semibold transition-all border-b-2 ${
            pathname === '/network' || pathname === '/seniors'
              ? isLandingPage ? 'text-[#F4A01C] border-[#F4A01C]' : 'text-[#7C3AED] border-[#7C3AED]'
              : isLandingPage
                ? 'text-white/70 border-transparent hover:text-white hover:border-[#F4A01C]/50'
                : 'text-gray-500 dark:text-[#8B949E] border-transparent hover:text-black dark:hover:text-white hover:border-surface dark:hover:border-[#38434F]'
          }`}>
            <span className="relative">
              <Users size={16} />
              {pendingNetworkRequestsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white px-0.5">
                  {pendingNetworkRequestsCount > 99 ? '99+' : pendingNetworkRequestsCount}
                </span>
              )}
            </span>
            <span className="hidden lg:block">Network</span>
          </Link>
          <Link href="/jobs" className={`flex items-center gap-1.5 px-2 xl:px-3 h-full text-[13px] font-semibold transition-all border-b-2 ${
            pathname === '/jobs' 
              ? isLandingPage ? 'text-[#F4A01C] border-[#F4A01C]' : 'text-[#7C3AED] border-[#7C3AED]'
              : isLandingPage
                ? 'text-white/70 border-transparent hover:text-white hover:border-[#F4A01C]/50'
                : 'text-gray-500 dark:text-[#8B949E] border-transparent hover:text-black dark:hover:text-white hover:border-surface dark:hover:border-[#38434F]'
          }`}>
            <Briefcase size={16} />
            <span className="hidden lg:block">Jobs</span>
          </Link>
          <Link href="/colleges" className={`flex items-center gap-1.5 px-2 xl:px-3 h-full text-[13px] font-semibold transition-all border-b-2 ${
            pathname === '/colleges' 
              ? isLandingPage ? 'text-[#F4A01C] border-[#F4A01C]' : 'text-[#7C3AED] border-[#7C3AED]'
              : isLandingPage
                ? 'text-white/70 border-transparent hover:text-white hover:border-[#F4A01C]/50'
                : 'text-gray-500 dark:text-[#8B949E] border-transparent hover:text-black dark:hover:text-white hover:border-surface dark:hover:border-[#38434F]'
          }`}>
            <GraduationCap size={16} />
            <span className="hidden lg:block">Colleges</span>
          </Link>
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {loading ? (
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#F3F4F6',
              animation: 'pulse 1.5s infinite'
            }} />
          ) : user ? (
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-gray-600 dark:text-[#B0B7BE] hover:text-black dark:hover:text-white hover:bg-surface-hover dark:hover:bg-[#283036] transition-colors cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NotificationBell dark />
              <Link 
                href={user?.role === 'senior' ? '/dashboard/senior/messages' : '/dashboard/junior/messages'}
                className="relative p-2 rounded-full text-gray-600 dark:text-[#B0B7BE] hover:text-black dark:hover:text-white hover:bg-surface-hover dark:hover:bg-[#283036] transition-colors"
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
                  className="flex items-center gap-2 bg-transparent border-[1.5px] border-[#E5E7EB] dark:border-[#38434F] rounded-full p-[6px] pr-3 cursor-pointer transition-colors hover:border-gray-300 dark:hover:border-gray-600"
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
                  <span style={{ fontSize: 13, fontWeight: 600 }} className="text-[#0A0A0A] hidden xl:block dark:text-white">
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
                      borderRadius: 12,
                      padding: 8,
                      minWidth: 200,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      zIndex: 50
                    }} className="bg-surface border border-[#E5E7EB] dark:bg-[#283036] dark:border-[#38434F]">
                      <div className="border-b border-[#F3F4F6] dark:border-[#38434F]" style={{
                        padding: '8px 12px 12px',
                        marginBottom: 4
                      }}>
                        <div className="text-[#0A0A0A] dark:text-white" style={{ fontSize: 13, fontWeight: 700 }}>{user.full_name}</div>
                        <div className="text-[#9CA3AF] dark:text-[#8B949E]" style={{ fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>{user.unique_id}</div>
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
                            textDecoration: 'none',
                            transition: 'background 0.1s'
                          }}
                          className="text-[#374151] dark:text-[#B0B7BE] hover:bg-app dark:hover:bg-[#1D2226]"
                        >
                          <item.icon size={16} className="text-[#6B7280] dark:text-[#8B949E]" />
                          {item.label}
                        </Link>
                      ))}
                      {primaryCommunitySlug && (
                        <Link
                          href={`/community/c/${primaryCommunitySlug}`}
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'background 0.1s'
                          }}
                          className="text-[#374151] dark:text-[#B0B7BE] hover:bg-app dark:hover:bg-[#1D2226]"
                        >
                          <Users size={16} className="text-[#6B7280] dark:text-[#8B949E]" />
                          My Community
                        </Link>
                      )}
                      <div style={{ height: 1, margin: '4px 0' }} className="bg-[#F3F4F6] dark:bg-[#38434F]" />
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
                        className="hover:bg-red-50 dark:hover:bg-red-950/30"
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href="/login">
                <button style={{
                  background: isLandingPage ? 'transparent' : 'white',
                  color: isLandingPage ? '#FFFFFF' : '#374151',
                  border: isLandingPage ? '1px solid rgba(255,255,255,0.35)' : '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }} className={isLandingPage ? 'hover:bg-white/10 hover:border-white/50' : 'hover:bg-app hover:border-gray-400'}>
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button style={{
                  background: isLandingPage ? '#F4A01C' : '#7C3AED',
                  color: isLandingPage ? '#0A2540' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'background-color 0.15s ease'
                }} className={isLandingPage ? 'hover:bg-[#E09410]' : 'hover:bg-[#6D28D9]'}>
                  Join Free
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileSearchOpen(true)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isLandingPage
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-black hover:bg-surface-hover'
            }`}
          >
            <Search size={20} />
          </button>
          {loading ? (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
          ) : user ? (
            <div className="flex items-center gap-3">
              <NotificationBell dark />
              <Link 
                href={user?.role === 'senior' ? '/dashboard/senior/messages' : '/dashboard/junior/messages'}
                className="relative p-2 rounded-full text-gray-600 hover:text-black hover:bg-surface-hover transition-colors"
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
              <button className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                isLandingPage
                  ? 'bg-[#F4A01C] text-[#0A2540] hover:bg-[#E09410]'
                  : 'bg-[#7C3AED] text-white'
              }`}>
                Join
              </button>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer border-[1.5px] ${
              isLandingPage
                ? 'bg-[#1B4F72] border-[#1B4F72] text-white'
                : 'bg-surface dark:bg-[#283036] border-[#E5E7EB] dark:border-[#38434F]'
            }`}
          >
            <Menu size={20} className={isLandingPage ? 'text-white' : 'text-[#374151] dark:text-[#B0B7BE]'} />
          </button>
        </div>
      </div>
    </nav>

    {mounted && mobileMenuOpen && createPortal(
      <>
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 9998,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100dvh',
          width: '280px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          animation: 'slideInLeft 0.3s ease-out',
        }} className="bg-surface dark:bg-[#1D2226]">

          <div className="flex items-center justify-between p-5 border-b border-[#F3F4F6] dark:border-[#38434F]">
            {/* Logo */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[18px] font-extrabold text-[#0A0A0A] dark:text-white no-underline font-plus-jakarta-sans"
            >
              cl<span style={{ color: '#7C3AED' }}>aspire</span>
            </Link>

            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer bg-surface dark:bg-[#283036] border border-[#E5E7EB] dark:border-[#38434F]"
            >
              <X size={16} className="text-[#6B7280] dark:text-[#B0B7BE]" />
            </button>
          </div>

          {user && (
            <div className="px-5 py-4 bg-[#F9FAFB] dark:bg-[#283036] border-b border-[#F3F4F6] dark:border-[#38434F]">
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
                  <div className="text-[14px] font-bold text-[#0A0A0A] dark:text-white">
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
              { label: 'Network', href: '/network', icon: Users },
              { label: 'Jobs', href: '/jobs', icon: Briefcase },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  setMobileMenuOpen(false)
                  if (item.href === '/community' && pathname === '/community') {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('REFRESH_COMMUNITY_FEED'))
                  }
                }}
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
                {primaryCommunitySlug && (
                  <a
                    href={`/community/c/${primaryCommunitySlug}`}
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
                    <Users size={18} color="#6B7280" />
                    My Community
                  </a>
                )}
              </>
            )}

            {/* Theme Toggle */}
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              padding: '16px 8px 4px',
              margin: 0
            }} className="dark:text-[#B0B7BE]">
              Appearance
            </p>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
                gap: 12,
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
              className="dark:text-[#B0B7BE] dark:hover:bg-[#283036]"
            >
              {theme === 'dark' ? <Sun size={18} className="text-gray-400 dark:text-[#B0B7BE]" /> : <Moon size={18} className="text-gray-400 dark:text-[#B0B7BE]" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>

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
          <div className="px-5 py-4 border-t border-[#F3F4F6] dark:border-[#38434F]">
            {user ? (
              // Sign out button
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut()
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-[10px] border-[1.5px] border-[#FECACA] dark:border-red-900/50 bg-[#FEF2F2] dark:bg-red-950/30 text-[#EF4444] text-[14px] font-bold cursor-pointer font-plus-jakarta-sans hover:bg-[#FEE2E2] dark:hover:bg-red-900/40 transition-colors"
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
      </>,
      document.body
    )}

    {mounted && mobileSearchOpen && createPortal(
      <div className="fixed inset-0 bg-surface z-[99999] flex flex-col p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <SearchBar isMobileOverlay={true} onCloseMobile={() => setMobileSearchOpen(false)} />
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
