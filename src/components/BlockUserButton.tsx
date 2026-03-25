'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface BlockUserButtonProps {
  userId: string
  userName: string
  onBlocked?: () => void
}

export default function BlockUserButton({ userId, userName, onBlocked }: BlockUserButtonProps) {
  const [blockStatus, setBlockStatus] = useState<'loading' | 'none' | 'blocked'>('loading')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchBlockStatus()
  }, [userId])

  const fetchBlockStatus = async () => {
    try {
      const res = await fetch(`/api/block/status?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setBlockStatus(data.i_blocked_them ? 'blocked' : 'none')
      }
    } catch (error) {
      console.error('Failed to fetch block status:', error)
    }
  }

  const handleBlock = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/block/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_id: userId })
      })

      if (res.ok) {
        setBlockStatus('blocked')
        setShowConfirm(false)
        onBlocked?.()
      }
    } catch (error) {
      console.error('Failed to block user:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnblock = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/block/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_id: userId })
      })

      if (res.ok) {
        setBlockStatus('none')
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (blockStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="animate-spin text-gray-400" size={16} />
      </div>
    )
  }

  if (blockStatus === 'none') {
    return (
      <>
        <button 
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg px-3 py-2 transition-colors w-full"
        >
          🚫 Block {userName}
        </button>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-950 border border-red-900/40 rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="bg-red-950 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚫</span>
              </div>
              
              <h3 className="text-white font-bold text-lg text-center">
                Block {userName}?
              </h3>
              
              <p className="text-gray-400 text-sm text-center mt-2">
                They won't be able to message you and you won't see each other's messages.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isProcessing}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-5 py-2.5 text-sm flex-1 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleBlock}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex-1 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Block
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <button 
      onClick={handleUnblock}
      disabled={isProcessing}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors w-full disabled:opacity-50"
    >
      {isProcessing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        '✅'
      )}
      Unblock {userName}
    </button>
  )
}
