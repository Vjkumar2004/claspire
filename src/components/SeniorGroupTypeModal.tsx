'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Crown, Globe, Lock } from 'lucide-react'

interface SeniorGroupTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPublic: () => void
  onSelectPremium: () => void
}

export default function SeniorGroupTypeModal({
  isOpen, onClose, onSelectPublic, onSelectPremium
}: SeniorGroupTypeModalProps) {
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
            className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Create a Group</h2>
                  <p className="text-xs opacity-80 mt-1">Choose your group type</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Public Group Option */}
              <button
                onClick={onSelectPublic}
                className="w-full text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-2xl flex items-center justify-center transition-colors">
                    <Globe size={22} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 text-base">Public Group</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Free to join — open to all students</p>
                  </div>
                  <div className="text-purple-400 group-hover:translate-x-1 transition-transform">→</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['College-scoped', 'Free to join', 'Chat & connect'].map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </button>

              {/* Premium Group Option */}
              <button
                onClick={onSelectPremium}
                className="w-full text-left p-5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-200 rounded-2xl flex items-center justify-center transition-colors">
                    <Crown size={22} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 text-base">Premium Group</h3>
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">EARN</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Set a price — students pay to join</p>
                  </div>
                  <div className="text-amber-400 group-hover:translate-x-1 transition-transform">→</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Paid membership', 'You set the price', 'Earn per member'].map(tag => (
                    <span key={tag} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
