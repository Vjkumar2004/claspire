import { Suspense } from 'react'
import FullscreenMessagesPage from '@/components/FullscreenMessagesPage'

export default function SeniorMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FullscreenMessagesPage role="senior" />
    </Suspense>
  )
}
