'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserCheck, UserPlus, HeartHandshake, Compass } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import NetworkStats from '@/components/network/NetworkStats'
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/network/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch { } finally {
      setStatsLoading(false)
    }
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
      <div className="relative pt-24 pb-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-50/30 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 mb-4">
              <Users size={14} className="text-[#7C3AED]" />
              <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">
                Your Professional Network
              </span>
            </div>

            <h1 className="font-extrabold text-3xl md:text-4xl text-gray-900 mb-3 leading-[1.2] tracking-tight">
              Build your <span className="text-[#7C3AED]">academic & professional</span> network
            </h1>

            <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base font-medium">
              Discover students, seniors, and alumni. Grow meaningful connections that shape your career.
            </p>
          </div>

          <NetworkStats
            connections={stats.connections}
            following={stats.following}
            requests={stats.totalRequests}
            communities={stats.communities}
          />

          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-0 -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
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
                refreshKey={refreshKey}
              />
            )}
            {activeTab === 'network' && <MyNetworkTab key="network" refreshKey={refreshKey} />}
            {activeTab === 'requests' && <RequestsTab key="requests" refreshKey={refreshKey} />}
            {activeTab === 'following' && <FollowingTab key="following" refreshKey={refreshKey} />}
          </div>
        </div>
      </div>
    </div>
  )
}
