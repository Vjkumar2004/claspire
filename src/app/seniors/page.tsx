'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SeniorsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/network')
  }, [router])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-sm font-semibold">Redirecting to Network...</div>
    </div>
  )
}
