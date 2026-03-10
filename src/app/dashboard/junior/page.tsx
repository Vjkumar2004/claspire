'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';

export default function JuniorDashboard() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Move ALL useState hooks to the top - Rules of Hooks compliance
  const [activeNav, setActiveNav] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [doubtFilter, setDoubtFilter] = useState("all");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (!data.user) {
            router.replace('/signup')
            return
          }
          if (data.user.role === 'senior') {
            router.replace('/dashboard/senior')
            return
          }
          setUser(data.user)
          setAuthChecked(true)
        } else {
          router.replace('/signup')
        }
      } catch {
        router.replace('/signup')
      }
    }
    checkAuth()
  }, [])

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #F3F4F6',
          borderTop: '3px solid #7C3AED',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`w-60 flex-shrink-0 bg-white border-r border-gray-200 h-screen fixed lg:sticky top-0 flex flex-col overflow-y-auto z-50 lg:z-auto transition-transform lg:transition-none ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo + User */}
        <div className="p-4 border-b border-gray-100">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-5 hover:opacity-80 transition-opacity cursor-pointer">
            <span className="text-lg">🎓</span>
            <span className="text-base font-black">
              Clas<span style={{ color: '#7C3AED' }}>pire</span>
            </span>
          </Link>

          {/* User Card */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-black truncate">Junior Student</div>
              <div className="text-xs text-gray-400 truncate">SRM Chennai</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'doubts', label: 'Doubts', icon: '❓' },
            { id: 'resources', label: 'Resources', icon: '📚' },
            { id: 'events', label: 'Events', icon: '🎉' },
            { id: 'community', label: 'Community', icon: '👥' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeNav === item.id
                  ? 'bg-purple-50 text-purple-600 border border-purple-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-purple-600 to-cyan-500 rounded-lg p-3 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">Rise Points</span>
              <span className="text-xs">🔥</span>
            </div>
            <div className="text-2xl font-black">250</div>
            <div className="text-xs opacity-90">Level 2 Student</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <span className="text-xl">☰</span>
              </button>

              <div>
                <h1 className="text-xl font-bold text-black">Junior Dashboard</h1>
                <p className="text-sm text-gray-400">Welcome back, Junior Student! 👋</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <span className="text-xl">🔔</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <span className="text-xl">⚙️</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Doubts Solved</span>
                    <span className="text-xl">✅</span>
                  </div>
                  <div className="text-2xl font-black text-black">12</div>
                  <div className="text-xs text-green-600">+3 this week</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Resources</span>
                    <span className="text-xl">📚</span>
                  </div>
                  <div className="text-2xl font-black text-black">28</div>
                  <div className="text-xs text-blue-600">+5 this week</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Events Joined</span>
                    <span className="text-xl">🎉</span>
                  </div>
                  <div className="text-2xl font-black text-black">5</div>
                  <div className="text-xs text-purple-600">+2 this month</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-black mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">💡</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-black">Asked a doubt in Data Structures</div>
                      <div className="text-xs text-gray-400">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">📚</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-black">Downloaded Python resources</div>
                      <div className="text-xs text-gray-400">5 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">🎉</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-black">Joined Coding Workshop</div>
                      <div className="text-xs text-gray-400">1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'doubts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">Doubts & Questions</h2>
                <div className="flex gap-2">
                  {['all', 'open', 'solved'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setDoubtFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        doubtFilter === filter
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-black mb-1">How to implement binary search tree?</h3>
                      <p className="text-sm text-gray-400 mb-2">Need help understanding BST implementation in Python...</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>📚 Data Structures</span>
                        <span>💬 3 answers</span>
                        <span>⏰ 2 hours ago</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Open</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'resources' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-black">Learning Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Python Basics', 'Data Structures', 'Web Development', 'Machine Learning', 'Database Design', 'Algorithms'].map((resource, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-3">
                      📚
                    </div>
                    <h3 className="font-medium text-black mb-1">{resource}</h3>
                    <p className="text-sm text-gray-400 mb-3">Comprehensive guide and tutorials</p>
                    <button className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                      Access Resource
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'events' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-black">Upcoming Events</h2>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-purple-600">MAR</span>
                      <span className="text-lg font-black text-purple-600">15</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-black mb-1">Coding Workshop</h3>
                      <p className="text-sm text-gray-400 mb-2">Learn advanced coding techniques</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>🕐 3:00 PM</span>
                        <span>📍 Online</span>
                        <span>👥 45 attending</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'community' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-black">Community</h2>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">👥</span>
                  <h3 className="text-lg font-medium text-black mb-2">Connect with Peers</h3>
                  <p className="text-sm text-gray-400 mb-4">Join discussions and collaborate with fellow students</p>
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium">
                    Explore Community
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
