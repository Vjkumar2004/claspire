'use client'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, isLoading }: DeleteAccountModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-950 border border-red-900/40 rounded-2xl p-8 max-w-md w-full mx-4">
        {/* Warning Icon */}
        <div className="bg-red-950 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-white text-xl font-bold text-center mb-2">
          Delete your account?
        </h2>

        {/* Subtext */}
        <p className="text-gray-400 text-sm text-center">
          This action is permanent and cannot be undone. All your posts, answers, rise points, and profile data will be permanently deleted.
        </p>

        {/* Warning Box */}
        <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-3 mt-4">
          <p className="text-red-400 text-xs">
            ⚠️ This will delete all your data from Claspire including posts, answers, votes, notifications, and your profile picture.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
