'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { NetworkRequestCountProvider } from '@/contexts/NetworkRequestCountContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>
        <UnreadMessagesProvider>
          <NotificationsProvider>
            <NetworkRequestCountProvider>
              {children}
            </NetworkRequestCountProvider>
          </NotificationsProvider>
        </UnreadMessagesProvider>
      </PointsProvider>
    </AuthProvider>
  )
}
