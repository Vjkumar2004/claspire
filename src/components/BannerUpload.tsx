'use client'
import { useState, useRef } from 'react'
import { Camera, Loader2, X, Upload } from 'lucide-react'

interface BannerUploadProps {
  currentUrl?: string | null
  userName?: string
  onUploadSuccess: (url: string) => void
  onRemoveSuccess?: () => void
}

export default function BannerUpload({
  currentUrl,
  userName,
  onUploadSuccess,
  onRemoveSuccess
}: BannerUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB')
      return
    }

    // Show preview instantly
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'banner')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setPreview(null)
        return
      }

      // Update localStorage sync for local session state
      const userStr = localStorage.getItem('claspire_user')
      if (userStr) {
        const u = JSON.parse(userStr)
        u.banner_url = data.url
        localStorage.setItem('claspire_user', JSON.stringify(u))
      }

      onUploadSuccess(data.url)

    } catch (err) {
      setError('Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // In a full implementation, we might call an API to delete the banner.
    // For now, we will assume we update the user profile via another API or the parent component.
    if (onRemoveSuccess) {
      onRemoveSuccess()
    }
  }

  const displayUrl = preview || currentUrl

  return (
    <div className="relative w-full h-32 sm:h-48 lg:h-64 group bg-slate-100 overflow-hidden rounded-t-xl z-0">
      {/* Background Image / Gradient */}
      <div 
        className="w-full h-full relative"
        style={{
          background: displayUrl 
            ? `url(${displayUrl}) center/cover no-repeat` 
            : 'linear-gradient(135deg, #F4A01C 0%, #06B6D4 100%)'
        }}
      >
        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <Loader2 size={32} color="white" className="animate-spin mb-2" />
            <span className="text-white text-xs font-bold">Uploading...</span>
          </div>
        )}

        {/* Hover overlay actions */}
        {!uploading && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            {displayUrl && onRemoveSuccess && (
              <button 
                onClick={handleRemove}
                className="bg-black/60 hover:bg-rose-500/80 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                title="Remove Banner"
              >
                <X size={16} />
              </button>
            )}
            <button 
              onClick={() => fileRef.current?.click()}
              className="bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-colors shadow-lg"
            >
              <Camera size={14} />
              {displayUrl ? 'Edit Banner' : 'Upload Banner'}
            </button>
          </div>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] text-red-600 font-semibold whitespace-nowrap z-30 shadow-sm animate-in fade-in slide-in-from-top-1">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
