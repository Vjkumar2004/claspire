'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { NetworkRequestCountProvider } from '@/contexts/NetworkRequestCountContext'
import { useLastSeen } from '@/hooks/useActivityStatus'

function LastSeenUpdater() {
  useLastSeen()
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  )
}
