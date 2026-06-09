'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserCheck, UserPlus, HeartHandshake, Compass } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import NetworkStats from '@/components/network/NetworkStats'
import NetworkSidebar from '@/components/network/NetworkSidebar'
import NetworkInsights from '@/components/network/NetworkInsights'
import DiscoverTab from '@/components/network/DiscoverTab'
import MyNetworkTab from '@/components/network/MyNetworkTab'
import RequestsTab from '@/components/network/RequestsTab'
import FollowingTab from '@/components/network/FollowingTab'

type Tab = 'discover' | 'network' | 'requests' | 'following'

export default function NetworkPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('discover')
  const [stats, setStats] = useState({ connections: 0, following: 0, requests: 0, communities: 0, incomingRequests: 0, outgoingRequests: 0, totalRequests: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const pendingStatsFetch = useRef<Promise<void> | null>(null)

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
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          fetchStats()
          setRefreshKey(k => k + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchStats()
          setRefreshKey(k => k + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${user.id}`,
        },
        () => {
          fetchStats()
          setRefreshKey(k => k + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchStats])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm font-semibold">Loading...</div>
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="pt-24 pb-8 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Redesign */}
        <div className="mb-6">
          <h1 className="font-extrabold text-2xl text-gray-900 mb-4 tracking-tight">
            Network
          </h1>
          <NetworkStats
            connections={stats.connections}
            following={stats.following}
            requests={stats.totalRequests}
            communities={stats.communities}
          />
        </div>

        {/* 3-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT SIDEBAR */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <NetworkSidebar 
                activeTab={activeTab} 
                onTabChange={(tab) => setActiveTab(tab)}
                connections={stats.connections}
                following={stats.following}
                incomingRequests={stats.incomingRequests}
              />
            </div>
          </div>

          {/* CENTER COLUMN */}
          <div className="flex-1 min-w-0">
            {/* Mobile Tab Navigation - Replaces Sidebar on Small Screens */}
            <div className="lg:hidden border-b border-gray-200 mb-6">
              <div className="flex gap-0 -mb-px overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                        isActive
                          ? 'text-[#7C3AED] border-[#7C3AED]'
                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pb-24">
              {activeTab === 'discover' && (
                <DiscoverTab
                  key="discover"
                  onConnectAction={handleConnectAction}
                />
              )}
              {activeTab === 'network' && <MyNetworkTab key="network" refreshKey={refreshKey} />}
              {activeTab === 'requests' && <RequestsTab key="requests" refreshKey={refreshKey} />}
              {activeTab === 'following' && <FollowingTab key="following" refreshKey={refreshKey} />}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden xl:block xl:w-[300px] flex-shrink-0">
            <div className="sticky top-24">
              <NetworkInsights connectionsCount={stats.connections} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
