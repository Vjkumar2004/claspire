'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePoints } from '@/contexts/PointsContext'
import { setAccessTokenProvider } from '@/lib/supabase'

interface User {
  id: string
  email: string
  role: 'student' | 'senior' | 'admin'
  unique_id: string
  full_name: string
  college_id: string | null
  avatar_url?: string
  bio?: string
  company?: string
  branch?: string
  passout_year?: number
  graduation_year?: number
  rise_points?: number
  points?: number
  answer_count?: number
  college?: string
  banner_url?: string | null
  is_verified?: boolean
}

let globalUser: User | null = null;
let globalLoading = true;
let globalFetchPromise: Promise<void> | null = null;
const subscribers = new Set<() => void>();

const notifySubscribers = () => {
  subscribers.forEach((fn) => fn());
};

const fetchUserGlobal = async (showAward: any, retryCount = 0) => {
  try {
    const res = await fetch('/api/auth/me')
    
    if (res.ok) {
      const data = await res.json()
      globalUser = data.user || null

      setAccessTokenProvider(async () => {
        const r = await fetch('/api/auth/supabase-token')
        if (r.ok) {
          const d = await r.json()
          return d.access_token
        }
        return null
      })

      // Show daily RP award if earned today
      if (data.dailyRPEarned && showAward) {
        showAward(1, "Daily visit bonus 🌅")
      }
    } else if (res.status === 401) {
      // 401 = not logged in
      globalUser = null
      setAccessTokenProvider(null)
    } else {
      // Other errors - retry once
      if (retryCount < 1) {
        return await new Promise((resolve) => setTimeout(resolve, 500)).then(() => fetchUserGlobal(showAward, retryCount + 1));
      } else {
        globalUser = null
        setAccessTokenProvider(null)
      }
    }
  } catch (error) {
    console.error('useAuth - fetch error:', error)
    if (retryCount < 1) {
      return await new Promise((resolve) => setTimeout(resolve, 500)).then(() => fetchUserGlobal(showAward, retryCount + 1));
    } else {
      globalUser = null
      setAccessTokenProvider(null)
    }
  } finally {
    if (retryCount === 0) {
      globalLoading = false
      globalFetchPromise = null
      notifySubscribers()
    }
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser)
  const [loading, setLoading] = useState(globalLoading)
  const router = useRouter()
  const { showAward } = usePoints()

  useEffect(() => {
    const handleChange = () => {
      setUser(globalUser)
      setLoading(globalLoading)
    }
    
    subscribers.add(handleChange)
    
    if (globalLoading && !globalFetchPromise) {
      globalFetchPromise = fetchUserGlobal(showAward)
    }
    
    return () => {
      subscribers.delete(handleChange)
    }
  }, [showAward])

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {}
    setAccessTokenProvider(null)
    globalUser = null
    globalLoading = false
    notifySubscribers()
    router.push('/')
  }

  const refetch = async () => {
    globalLoading = true;
    notifySubscribers();
    globalFetchPromise = fetchUserGlobal(showAward);
    await globalFetchPromise;
  }

  return { user, loading, signOut, refetch }
}

