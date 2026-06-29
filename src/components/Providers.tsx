'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { NetworkRequestCountProvider } from '@/contexts/NetworkRequestCountContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { useLastSeen } from '@/hooks/useActivityStatus'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true, // Refresh stale data on mount
    },
  },
})

function LastSeenUpdater() {
  useLastSeen()
  return null
}

function ThemeEnforcer() {
  const { user, loading } = useAuth()
  const { setForceLight } = useTheme()

  useEffect(() => {
    if (!loading) {
      setForceLight(!user)
    }
  }, [user, loading, setForceLight])
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PointsProvider>
            <UnreadMessagesProvider>
              <NetworkRequestCountProvider>
                <NotificationsProvider>
                  <LastSeenUpdater />
                  <ThemeEnforcer />
                  {children}
                </NotificationsProvider>
              </NetworkRequestCountProvider>
            </UnreadMessagesProvider>
          </PointsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
