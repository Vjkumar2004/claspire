'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JuniorMessagesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/junior?activeTab=messages')
  }, [router])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-plus-jakarta-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-extrabold tracking-widest text-[10px] uppercase">Opening Messages...</p>
      </div>
    </div>
  )
}
