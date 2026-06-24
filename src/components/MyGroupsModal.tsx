'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users } from 'lucide-react'
import MyGroupsList from './MyGroupsList'

interface MyGroupsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: {
    id: string
    is_premium: boolean
    role: 'student' | 'senior'
    college_id: string
  }
}

export default function MyGroupsModal({ isOpen, onClose, currentUser }: MyGroupsModalProps) {
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
            className="relative bg-surface dark:bg-[#283036] rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#0A66C2] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface dark:bg-[#283036]/20 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">My Created Groups</h2>
                    <p className="text-xs opacity-80">Manage your student groups</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-surface dark:bg-[#283036]/20 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <MyGroupsList />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
