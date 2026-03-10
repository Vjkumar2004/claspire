'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 z-[999] bg-white/97 border-b border-gray-200 backdrop-blur-[8px]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <Link href="/" className="font-plus-jakarta-sans font-bold text-lg text-black no-underline hover:no-underline">
          Clas<span style={{ color: '#7C3AED' }}>pire</span>
        </Link>

        {/* Desktop Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/community" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Community
          </Link>
          <Link href="/dashboard/junior" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Dashboard
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Seniors
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Jobs
          </Link>
          <Link href="/colleges" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Colleges
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Pricing
          </Link>
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            // Loading skeleton
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#F3F4F6',
              animation: 'pulse 1.5s infinite'
            }} />
          ) : user ? (
            // Logged in — Profile dropdown
            <div style={{ position: 'relative' }}>
              
              {/* Profile Avatar Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
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
                {/* Avatar circle */}
                <div style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {user.full_name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </div>
                
                {/* Name (hide on mobile) */}
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0A0A0A',
                  display: 'none'
                }}
                  className="sm:block"
                >
                  {user.full_name?.split(' ')[0]}
                </span>
                
                {/* Chevron */}
                <svg width="12" height="12" viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transform: dropdownOpen 
                      ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s'
                  }}>
                  <path d="M2 4l4 4 4-4" 
                    stroke="#9CA3AF" strokeWidth="1.5"
                    strokeLinecap="round"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0, zIndex: 40
                    }}
                    onClick={() => setDropdownOpen(false)}
                  />
                  
                  {/* Menu */}
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
                    
                    {/* User info */}
                    <div style={{
                      padding: '8px 12px 12px',
                      borderBottom: '1px solid #F3F4F6',
                      marginBottom: 4
                    }}>
                      <div style={{
                        fontSize: 13,
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
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: user.role === 'senior' 
                          ? '#F0FDF4' : '#F3F0FF',
                        border: `1px solid ${user.role === 'senior' 
                          ? '#BBF7D0' : '#DDD6FE'}`,
                        borderRadius: 100,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 700,
                        color: user.role === 'senior' 
                          ? '#16A34A' : '#7C3AED',
                        marginTop: 6
                      }}>
                        {user.role === 'senior' 
                          ? '✅ Verified Senior' 
                          : '🎓 Student'}
                      </div>
                    </div>

                    {/* Menu items */}
                    {[
                      {
                        icon: '🏠',
                        label: 'Dashboard',
                        href: user.role === 'senior'
                          ? '/dashboard/senior'
                          : '/dashboard/junior'
                      },
                      {
                        icon: '💬',
                        label: 'Community',
                        href: '/community'
                      },
                      {
                        icon: '👤',
                        label: 'My Profile',
                        href: '/profile'
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDropdownOpen(false)}
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
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement)
                            .style.background = '#F9FAFB'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement)
                            .style.background = 'transparent'
                        }}
                      >
                        <span style={{ fontSize: 15, width: 20,
                          textAlign: 'center' }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    ))}

                    {/* Divider */}
                    <div style={{
                      height: 1,
                      background: '#F3F4F6',
                      margin: '4px 0'
                    }} />

                    {/* Sign out */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
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
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement)
                          .style.background = '#FEF2F2'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement)
                          .style.background = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 15, width: 20,
                        textAlign: 'center' }}>
                        🚪
                      </span>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Not logged in — Show Sign In and Join Free buttons
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
                  Join Free →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right */}
        <div className="md:hidden flex items-center gap-3">
          {loading ? (
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#F3F4F6',
              animation: 'pulse 1.5s infinite'
            }} />
          ) : user ? (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-xs font-black flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              {user.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U'}
            </button>
          ) : (
            <Link href="/signup">
              <button className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#7C3AED' }}>
                Join
              </button>
            </Link>
          )}
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-xl font-normal text-black p-1 transition-transform duration-200"
          >
            {dropdownOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {dropdownOpen && (
        <div className="fixed inset-0 bg-white z-[998] md:hidden">
          <div className="flex flex-col gap-2 px-6 pt-20 pb-10">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 py-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-sm font-black flex items-center justify-center">
                    {user.full_name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-black text-black">{user.full_name}</div>
                    <div className="text-xs text-gray-400">{user.unique_id}</div>
                  </div>
                </div>
                
                {/* Authenticated Links */}
                <Link 
                  href={user.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior'}
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  📊 Dashboard
                </Link>
                <Link 
                  href="/community"
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  💬 Community
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    setDropdownOpen(false);
                  }}
                  className="py-4 text-lg font-semibold text-red-600 border-b border-gray-100 text-left"
                >
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Public Links */}
                <Link 
                  href="/community"
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Community
                </Link>
                <Link 
                  href="/dashboard/junior"
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="#" 
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Seniors
                </Link>
                <Link 
                  href="#" 
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Jobs
                </Link>
                <Link 
                  href="/colleges"
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Colleges
                </Link>
                <Link 
                  href="#" 
                  className="py-4 text-lg font-semibold text-black border-b border-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Pricing
                </Link>
                
                <Link href="/signup">
                  <button 
                    className="w-full bg-[#7C3AED] text-white py-3 rounded-lg text-sm font-semibold mt-4"
                    style={{ backgroundColor: '#7C3AED' }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Join
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
