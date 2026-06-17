'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Lock, Clock, Sparkles, Loader2 } from 'lucide-react'
import GroupWarningModal from './GroupWarningModal'
import { showToast } from './Toast'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: {
    id: string
    is_premium: boolean
    role: 'student' | 'senior'
    college_id: string
  }
  communityId?: string  // Make optional - we'll fetch it if not provided
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess, currentUser, communityId: propCommunityId }: CreateGroupModalProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [step, setStep] = useState<'warning' | 'form'>('warning')
  const [loading, setLoading] = useState(false)
  const [communityId, setCommunityId] = useState<string>(propCommunityId || '')
  const [fetchingCommunity, setFetchingCommunity] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'college' as 'college' | 'public' | 'private',
    is_ephemeral: true
  })

  const [existingGroups, setExistingGroups] = useState({
    publicCount: 0,
    privateCount: 0
  })

  const [hasFetchedExistingGroups, setHasFetchedExistingGroups] = useState(false)

  // Check if community ID is available
  const isCommunityAvailable = !!communityId

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('warning')
      setFormData({
        name: '',
        description: '',
        scope: 'college',
        is_ephemeral: true
      })
      if (!hasFetchedExistingGroups) {
        fetchExistingGroups()
      }
      
      // Try to fetch community ID if not available
      if (!communityId) {
        console.log('Community ID not available, attempting to fetch...')
        fetchCommunityId()
      }
    }
  }, [isOpen, communityId, hasFetchedExistingGroups])

  const fetchCommunityId = async () => {
    if (fetchingCommunity) return // Prevent multiple fetches
    
    setFetchingCommunity(true)
    try {
      console.log('Fetching community ID in modal...')
      const res = await fetch('/api/community/my-college')
      if (res.ok) {
        const data = await res.json()
        console.log('Fetched community ID in modal:', data.communityId)
        setCommunityId(data.communityId || '')
      } else {
        console.log('Failed to fetch community ID in modal:', res.status)
      }
    } catch (err) {
      console.error('Error fetching community ID in modal:', err)
    } finally {
      setFetchingCommunity(false)
    }
  }

  const fetchExistingGroups = async () => {
    try {
      const res = await fetch('/api/groups/my-groups')
      if (res.ok) {
        const data = await res.json()
        setExistingGroups({
          publicCount: data.publicCount || 0,
          privateCount: data.privateCount || 0
        })
        setHasFetchedExistingGroups(true)
      }
    } catch (err) {
      console.error('Failed to fetch existing groups:', err)
    }
  }

  const handleWarningContinue = () => {
    setShowWarning(false)
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Debug: Log the values being sent
    console.log('Creating group with data:', {
      name: formData.name,
      scope: formData.scope,
      community_id: communityId
    })

    // Validate community ID before sending
    if (!communityId) {
      alert('Community ID not found. Please refresh the page and try again.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          scope: formData.scope,
          community_id: communityId
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Group created successfully!',
          message: `"${formData.name}" is ready for members to join`,
          duration: 5000
        })
        onSuccess()
        onClose()
      } else {
        showToast({
          type: 'error',
          title: 'Failed to create group',
          message: data.error || 'Please try again',
          duration: 5000
        })
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Something went wrong',
        message: 'Please try again later',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const canCreatePublic = true
  const canCreatePrivate = true
  const totalGroupsCreated = existingGroups.publicCount + existingGroups.privateCount
  const canCreateCollege = true

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-surface dark:bg-[#283036] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {step === 'warning' ? (
                <GroupWarningModal
                  isOpen={true}
                  onContinue={handleWarningContinue}
                  onCancel={onClose}
                />
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10 p-6 border-b border-purple-100 dark:border-[#38434F]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                          <Users size={24} className="text-purple-600 dark:text-purple-300" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white font-instrument-serif">
                            Create Student Group
                          </h2>
                          <p className="text-xs text-gray-600 dark:text-[#B0B7BE] mt-1">
                            {currentUser.role === 'student' ? 'Student' : 'Senior'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-[#B0B7BE] hover:text-gray-600 dark:hover:text-[#B0B7BE] transition-colors"
                        disabled={loading}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Warning if community not available */}
                  {!isCommunityAvailable && (
                    <div className="mx-6 mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {fetchingCommunity ? (
                            <div className="w-2 h-2 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                            {fetchingCommunity ? 'Loading Community Information...' : 'Community Information Required'}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            {fetchingCommunity 
                              ? 'Please wait while we load your community information.'
                              : 'Please refresh the page to load your community information before creating a group.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {/* Group Name */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">
                          Group Name
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={50}
                          placeholder="e.g. Study Squad, Project Team"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-surface dark:border-[#38434F] bg-surface dark:bg-[#283036] text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">
                          {formData.name.length}/50 characters
                        </p>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">
                          Description
                        </label>
                        <textarea
                          required
                          maxLength={200}
                          rows={3}
                          placeholder="What's this group about?"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-surface dark:border-[#38434F] bg-surface dark:bg-[#283036] text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm resize-none"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">
                          {formData.description.length}/200 characters
                        </p>
                      </div>

                      {/* Visibility */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">
                          Visibility
                        </label>

                        <div className="space-y-2">
                          {/* College-only Option */}
                          <label className={`relative block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.scope === 'college'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                              : 'border-surface dark:border-[#38434F] hover:border-gray-300'
                          } ${!canCreateCollege ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="visibility"
                                checked={formData.scope === 'college'}
                                onChange={() => setFormData({ ...formData, scope: 'college' })}
                                disabled={!canCreateCollege || loading}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.scope === 'college'
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {formData.scope === 'college' && (
                                  <div className="w-2 h-2 bg-surface dark:bg-[#283036] rounded-full" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Users size={16} className="text-purple-600" />
                                  <span className="font-bold text-sm">College Only</span>
                                  <span className="text-xs text-gray-500 dark:text-[#B0B7BE]">• Only your college students</span>
                                </div>
                              </div>
                            </div>
                            {!canCreateCollege && (
                              <div className="absolute inset-0 bg-surface dark:bg-[#283036]/80 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                  <Lock size={16} className="text-gray-400 dark:text-[#B0B7BE] mx-auto mb-1" />
                                  <p className="text-xs text-gray-600 dark:text-[#B0B7BE]">Free limit reached</p>
                                </div>
                              </div>
                            )}
                          </label>

                          {/* Public Option */}
                          <label className={`relative block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.scope === 'public'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                              : 'border-surface dark:border-[#38434F] hover:border-gray-300'
                          } ${!canCreatePublic ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="visibility"
                                checked={formData.scope === 'public'}
                                onChange={() => setFormData({ ...formData, scope: 'public' })}
                                disabled={!canCreatePublic || loading}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.scope === 'public'
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {formData.scope === 'public' && (
                                  <div className="w-2 h-2 bg-surface dark:bg-[#283036] rounded-full" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Users size={16} className="text-gray-600 dark:text-[#B0B7BE]" />
                                  <span className="font-bold text-sm">Public</span>
                                  <span className="text-xs text-gray-500 dark:text-[#B0B7BE]">• Any college can join</span>
                                </div>
                              </div>
                            </div>
                          </label>

                          {/* Private Option */}
                          <label className={`relative block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.scope === 'private'
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                              : 'border-surface dark:border-[#38434F] hover:border-gray-300'
                          } ${!canCreatePrivate ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="visibility"
                                checked={formData.scope === 'private'}
                                onChange={() => setFormData({ ...formData, scope: 'private' })}
                                disabled={!canCreatePrivate || loading}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.scope === 'private'
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {formData.scope === 'private' && (
                                  <div className="w-2 h-2 bg-surface dark:bg-[#283036] rounded-full" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Lock size={16} className="text-gray-600 dark:text-[#B0B7BE]" />
                                  <span className="font-bold text-sm">Private</span>
                                  <span className="text-xs text-gray-500 dark:text-[#B0B7BE]">• Invite only</span>
                                </div>
                              </div>
                            </div>
                            {!canCreatePrivate && (
                              <div className="absolute inset-0 bg-surface dark:bg-[#283036]/80 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                  <Lock size={16} className="text-gray-400 dark:text-[#B0B7BE] mx-auto mb-1" />
                                  <p className="text-xs text-gray-600 dark:text-[#B0B7BE]">Not available</p>
                                </div>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Auto-delete Messages */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 dark:text-[#B0B7BE] uppercase tracking-wider">
                          Message Settings
                        </label>
                        
                        <label className={`relative block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          formData.is_ephemeral 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20' 
                            : 'border-surface dark:border-[#38434F] hover:border-gray-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.is_ephemeral}
                              onChange={(e) => setFormData({ ...formData, is_ephemeral: e.target.checked })}
                              disabled={loading}
                              className="sr-only"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors ${
                              formData.is_ephemeral ? 'bg-purple-500' : 'bg-gray-300 dark:bg-[#38434F]'
                            }`}>
                              <div className={`w-5 h-5 bg-surface dark:bg-[#283036] rounded-full shadow-sm transition-transform ${
                                formData.is_ephemeral ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-gray-600 dark:text-[#B0B7BE]" />
                                <span className="font-bold text-sm">Auto-delete Messages</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-[#B0B7BE] mt-1">
                                Messages delete after 24 hours
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Info Box */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                        <div className="flex gap-3">
                          <Sparkles size={16} className="text-blue-600 dark:text-blue-300 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                              Group Auto-deletion
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              All groups automatically delete after 7 days of inactivity to keep the platform fresh.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 border-t border-surface dark:border-[#38434F] flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-2xl border border-surface dark:border-[#38434F] text-gray-600 dark:text-[#B0B7BE] font-bold text-sm hover:bg-app dark:hover:bg-[#1D2226] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !formData.name.trim() || !formData.description.trim() || !isCommunityAvailable || fetchingCommunity}
                        className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Creating...
                          </>
                        ) : fetchingCommunity ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Loading...
                          </>
                        ) : !isCommunityAvailable ? (
                          'Community Information Required'
                        ) : (
                          'Create Group'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
