'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserCheck, UserPlus, HeartHandshake, Compass } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import NetworkHero from '@/components/network/NetworkHero'
import NetworkSidebar from '@/components/network/NetworkSidebar'
import NetworkRightSidebar from '@/components/network/NetworkRightSidebar'
import DiscoverTab from '@/components/network/DiscoverTab'
import MyNetworkTab from '@/components/network/MyNetworkTab'
import RequestsTab from '@/components/network/RequestsTab'
import FollowingTab from '@/components/network/FollowingTab'

type Tab = 'discover' | 'network' | 'requests' | 'following'

interface SidebarData {
  mentors: any[]
  communities: any[]
  platformStats: { students: number; seniors: number; colleges: number; communities: number }
  networkGrowth: { newConnections: number; dailyConnections: number[]; prevWeekTotal: number; profileViews: number }
  recentSeniors: any[]
}

export default function NetworkPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('discover')
  const [stats, setStats] = useState({ connections: 0, following: 0, requests: 0, communities: 0, incomingRequests: 0, outgoingRequests: 0, totalRequests: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const pendingStatsFetch = useRef<Promise<void> | null>(null)
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchStats = useCallback(async () => {
    if (pendingStatsFetch.current) return pendingStatsFetch.current
    setStatsLoading(true)
    const promise = (async () => {
      try {
        const res = await fetch('/api/network/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch { } finally {
        pendingStatsFetch.current = null
        setStatsLoading(false)
      }
    })()
    pendingStatsFetch.current = promise
    return promise
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchSidebar = async () => {
      try {
        const res = await fetch('/api/network/sidebar')
        if (res.ok) {
          const data = await res.json()
          setSidebarData(data)
        }
      } catch (err) {
        console.error('[Network] Sidebar fetch error:', err)
      }
    }
    fetchSidebar()
  }, [user])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, activeTab, fetchStats])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('network-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `sender_id=eq.${user.id}` },
        () => { fetchStats(); setRefreshKey(k => k + 1) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `receiver_id=eq.${user.id}` },
        () => { fetchStats(); setRefreshKey(k => k + 1) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${user.id}` },
        () => { fetchStats(); setRefreshKey(k => k + 1) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchStats])

  // Update sliding indicator position
  useEffect(() => {
    if (!tabsRef.current) return
    const activeEl = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      })
    }
  }, [activeTab])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFBFF] to-[#F6F7FC] dark:from-[#151b23] dark:to-[#1D2226] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 dark:text-[#B0B7BE] text-sm font-semibold">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'network', label: 'My Network', icon: UserCheck },
    { id: 'requests', label: 'Requests', icon: UserPlus, badge: stats.incomingRequests > 0 ? stats.incomingRequests : undefined },
    { id: 'following', label: 'Following', icon: HeartHandshake },
  ]

  const handleConnectAction = async (userId: string) => {
    const res = await fetch('/api/network/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: userId }),
    })
    if (res.ok) {
      fetchStats()
      return true
    }
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[Connect] API error:', res.status, err)
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFBFF] via-[#F8F9FE] to-[#F6F7FC] dark:from-[#151b23] dark:via-[#1D2226] dark:to-[#151b23]">
      <div className="pt-4 sm:pt-6 pb-16 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== FULL-WIDTH HERO SECTION ===== */}
        <div className="hidden md:block mb-6 lg:mb-8">
          <NetworkHero
            platformStats={sidebarData?.platformStats}
            recentSeniors={sidebarData?.recentSeniors || []}
            featuredMentor={null}
          />
        </div>

        {/* ===== MOBILE HEADING (md:hidden) ===== */}
        <div className="md:hidden mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100/80 rounded-full border border-purple-200/50 mb-3">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">India&apos;s Student Network</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight m-0">
            Build Your{' '}
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">Professional Network</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#B0B7BE] font-medium mt-1 m-0 max-w-md">
            Connect with students, seniors, alumni and mentors across India and grow together.
          </p>
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="xl:hidden mt-4 lg:mt-8 mb-4 lg:mb-8">
          <div className="inline-flex bg-white/90 dark:bg-[#283036]/90 backdrop-blur-sm border border-gray-200/70 dark:border-[#38434F]/70 rounded-xl lg:rounded-2xl p-1 shadow-sm w-full lg:w-auto overflow-x-auto scrollbar-none">
            {tabs.map((tab, i) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 lg:gap-2 px-3 lg:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold rounded-lg lg:rounded-xl transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1D2226] dark:text-[#B0B7BE]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg lg:rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-sm shadow-purple-500/20" />
                  )}
                  <span className="relative z-10 flex items-center gap-1 lg:gap-2">
                    <Icon size={14} className="lg:size-[16px]" />
                    {tab.label}
                  </span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`relative z-10 bg-red-500 text-white text-[9px] lg:text-[10px] font-bold px-1 lg:px-1.5 py-0.5 rounded-full min-w-[16px] lg:min-w-[18px] text-center leading-none`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ===== 3-COLUMN LAYOUT (Sidebar + Main + Right Sidebar) ===== */}
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">

          {/* LEFT SIDEBAR - Desktop Only */}
          <div className="hidden xl:block xl:w-[280px] flex-shrink-0">
            <div className="sticky top-28">
              <NetworkSidebar
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
                connections={stats.connections}
                following={stats.following}
                incomingRequests={stats.incomingRequests}
              />
            </div>
          </div>

          {/* MAIN CONTENT COLUMN */}
          <div className="flex-1 min-w-0">
            <div className="pb-24 lg:pb-8">
              {activeTab === 'discover' && (
                <DiscoverTab key="discover" onConnectAction={handleConnectAction} />
              )}
              {activeTab === 'network' && <MyNetworkTab key="network" refreshKey={refreshKey} />}
              {activeTab === 'requests' && <RequestsTab key="requests" refreshKey={refreshKey} />}
              {activeTab === 'following' && <FollowingTab key="following" refreshKey={refreshKey} />}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Desktop Only */}
          <div className="hidden xl:block xl:w-[300px] flex-shrink-0">
            <div className="sticky top-28">
              <NetworkRightSidebar
                mentors={sidebarData?.mentors || []}
                communities={sidebarData?.communities || []}
                networkGrowth={sidebarData?.networkGrowth}
                connectionsCount={stats.connections}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
