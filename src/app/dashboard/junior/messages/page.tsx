'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function JuniorMessagesRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const userParam = searchParams.get('user')
    const dest = `/dashboard/junior?activeTab=messages${userParam ? `&user=${userParam}` : ''}`
    router.replace(dest)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-plus-jakarta-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-extrabold tracking-widest text-[10px] uppercase">Opening Messages...</p>
      </div>
    </div>
  )
}

export default function JuniorMessagesRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JuniorMessagesRedirectContent />
    </Suspense>
  )
}
