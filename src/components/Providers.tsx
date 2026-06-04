'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>
        <UnreadMessagesProvider>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
        </UnreadMessagesProvider>
      </PointsProvider>
    </AuthProvider>
  )
}
