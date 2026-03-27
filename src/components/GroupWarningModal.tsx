'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface GroupWarningModalProps {
  isOpen: boolean
  onContinue: () => void
  onCancel: () => void
}

export default function GroupWarningModal({ isOpen, onContinue, onCancel }: GroupWarningModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative bg-white rounded-[24px] w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle size={18} className="sm:size-6 text-amber-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 font-instrument-serif">
                    Community Guidelines ⚠️
                  </h2>
                </div>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} className="sm:size-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">
                  Before creating your student group, please read and agree to our community guidelines:
                </p>

                <div className="space-y-3">
                  {[
                    {
                      icon: '🤝',
                      title: 'Be Respectful',
                      description: 'No abuse, harassment, or spam. Treat everyone with dignity.'
                    },
                    {
                      icon: '🎯',
                      title: 'Stay Relevant',
                      description: 'Keep discussions relevant to your college community.'
                    },
                    {
                      icon: '⚡',
                      title: 'Activity Required',
                      description: 'Inactive groups (3 warnings) will be auto-deleted.'
                    },
                    {
                      icon: '🚫',
                      title: 'Zero Tolerance',
                      description: 'Violations result in permanent ban from Claspire.'
                    }
                  ].map((rule, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="text-base sm:text-lg flex-shrink-0">{rule.icon}</div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900">{rule.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 mt-4">
                  <p className="text-xs font-medium text-amber-800">
                    <strong>Important:</strong> Groups auto-delete after 7 days of inactivity. Messages may auto-delete based on your settings.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 text-gray-600 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onContinue}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs sm:text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  I Understand → Continue
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
