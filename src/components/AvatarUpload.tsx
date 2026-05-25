'use client'
import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl?: string
  userName: string
  size?: number
  onUploadSuccess: (url: string) => void
}

export default function AvatarUpload({
  currentUrl,
  userName,
  size = 88,
  onUploadSuccess
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      formData.append('type', 'avatar')

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
        u.avatar_url = data.url
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

  const displayUrl = preview || currentUrl
  const initials = userName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const borderRadius = size * 0.27

  return (
    <div className="relative w-fit group">
      {/* Avatar Container */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          width: size,
          height: size,
          borderRadius,
          background: displayUrl
            ? 'transparent'
            : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          overflow: 'hidden',
          border: '3px solid white',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)',
          position: 'relative'
        }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-plus-jakarta font-extrabold text-white" style={{ fontSize: size * 0.32 }}>
            {initials}
          </span>
        )}

        {/* Hover overlay */}
        {!uploading && (
          <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera size={size * 0.22} color="white" />
            <span className="text-[10px] text-white font-bold">Change</span>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2
              size={size * 0.3}
              color="white"
              className="animate-spin"
            />
          </div>
        )}
      </div>

      {/* Camera badge overlay */}
      {!uploading && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <Camera size={14} color="white" />
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <div className="absolute top-[110%] left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] text-red-600 font-semibold whitespace-nowrap z-10 shadow-sm animate-in fade-in slide-in-from-top-1">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
