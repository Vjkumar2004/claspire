'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ExternalLink, ShieldAlert, ArrowLeft } from 'lucide-react'

function isSafeUrl(url: string) {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:'
    )
  } catch {
    return false
  }
}

function getDisplayDomain(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url
  }
}

function RedirectPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlParam = searchParams.get('url')
  
  const [isValid, setIsValid] = useState(true)
  const [targetUrl, setTargetUrl] = useState('')
  const [domain, setDomain] = useState('')

  useEffect(() => {
    if (urlParam) {
      if (isSafeUrl(urlParam)) {
        setTargetUrl(urlParam)
        setDomain(getDisplayDomain(urlParam))
      } else {
        setIsValid(false)
      }
    } else {
      setIsValid(false)
    }
  }, [urlParam])

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#111827] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 p-6 sm:p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invalid or Unsafe URL</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            The link you are trying to visit is invalid or uses an unsafe protocol. For your security, this request has been blocked.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Go Back to Safety
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#111827] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-slate-200 dark:border-[#374151] p-6 sm:p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full mx-auto mb-6">
          <ExternalLink className="w-8 h-8 text-amber-500" />
        </div>
        
        <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
          Leaving Claspire
        </h1>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 leading-relaxed">
          You are about to leave Claspire and visit an external website. Please be careful with your personal information.
        </p>
        
        <div className="bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-[#374151] p-4 mb-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">External Site</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={targetUrl}>
            {domain}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { window.location.href = targetUrl }}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Continue
          </button>
          
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#111827] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    }>
      <RedirectPageContent />
    </Suspense>
  )
}
