'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Sparkles, Loader2, IndianRupee } from 'lucide-react'

interface CreatePremiumGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: {
    id: string
    is_premium: boolean
    role: 'student' | 'senior'
    college_id: string
  }
  communityId?: string
}

export default function CreatePremiumGroupModal({
  isOpen, onClose, onSuccess, currentUser, communityId: propCommunityId
}: CreatePremiumGroupModalProps) {
  const [loading, setLoading] = useState(false)
  const [communityId, setCommunityId] = useState(propCommunityId || '')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 99,
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', description: '', price: 99 })
      if (!communityId) fetchCommunityId()
    }
  }, [isOpen])

  const fetchCommunityId = async () => {
    try {
      const res = await fetch('/api/community/my-college')
      if (res.ok) {
        const data = await res.json()
        setCommunityId(data.communityId || '')
      }
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.description.trim() || !communityId) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          scope: 'private',
          community_id: communityId,
          price: formData.price,
          is_premium_group: true
        })
      })

      const data = await res.json()
      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        alert(data.error || 'Failed to create group')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const priceOptions = [49, 99, 149, 199, 299, 499]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Premium Group</h2>
                    <p className="text-xs opacity-80">Set a price — juniors pay to join</p>
                  </div>
                </div>
                <button onClick={onClose} disabled={loading} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Group Name */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Group Name</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. GATE 2026 Prep, Placement Bootcamp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea
                    required
                    maxLength={200}
                    rows={3}
                    placeholder="What will members get from this group?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm resize-none"
                  />
                </div>

                {/* Price Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Junior Membership Price (₹)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {priceOptions.map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setFormData({ ...formData, price })}
                        className={`py-2.5 rounded-2xl border-2 font-bold text-sm transition-all ${
                          formData.price === price
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 text-gray-600 hover:border-amber-300'
                        }`}
                      >
                        ₹{price}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      min={10}
                      max={9999}
                      placeholder="Custom price"
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 99 })}
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Info box */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <Sparkles size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1">How it works</p>
                      <p className="text-xs text-amber-700">
                        Juniors pay ₹{formData.price} to join your group. Claspire takes 20% platform fee.
                      </p>
                      <p className="text-xs text-amber-700 mt-1 font-bold">
                        You earn: ₹{Math.floor(formData.price * 0.8)} per member 💰
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim() || !formData.description.trim()}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating...</>
                  ) : (
                    '✦ Create Premium Group'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
