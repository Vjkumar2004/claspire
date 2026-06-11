'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { NetworkRequestCountProvider } from '@/contexts/NetworkRequestCountContext'
import { useLastSeen } from '@/hooks/useActivityStatus'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

function LastSeenUpdater() {
  useLastSeen()
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PointsProvider>
          <UnreadMessagesProvider>
            <NetworkRequestCountProvider>
              <NotificationsProvider>
                <LastSeenUpdater />
                {children}
              </NotificationsProvider>
            </NetworkRequestCountProvider>
          </UnreadMessagesProvider>
        </PointsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
