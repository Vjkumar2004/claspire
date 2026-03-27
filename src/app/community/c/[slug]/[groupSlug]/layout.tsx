'use client'

import { usePathname } from 'next/navigation'
import BottomNavbar from '@/components/BottomNavbar'

export default function GroupChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Check if we're on a group chat page
  const isGroupChatPage = pathname?.match(/^\/community\/c\/[^\/]+\/[^\/]+$/)
  
  return (
    <div className="min-h-screen">
      {children}
      {/* Only show BottomNavbar if NOT on group chat page */}
      {!isGroupChatPage && <BottomNavbar />}
    </div>
  )
}
