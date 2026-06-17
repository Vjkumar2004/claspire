'use client'
import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { showToast } from '@/components/Toast'

async function compressAvatar(file: File, quality: number, maxDim: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Failed to get canvas context'))
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas to Blob failed'))
          const fileName = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], fileName, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

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
  const [uploadState, setUploadState] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      showToast({ type: 'error', title: 'Unsupported format', message: 'Please upload a JPG, PNG, WEBP, GIF, or HEIC image' })
      return
    }

    setUploading(true)
    setError('')

    let uploadFile = file
    const MAX_SIZE = 2 * 1024 * 1024
    const MAX_GIF_SIZE = 5 * 1024 * 1024

    if (file.type === 'image/gif') {
      if (file.size > MAX_GIF_SIZE) {
        showToast({ type: 'error', title: 'Image too large', message: 'GIF is too large. Please choose a GIF smaller than 5 MB.' })
        setUploading(false)
        return
      }
      // Skip compression for GIFs
    } else {
      // Handle HEIC/HEIF conversion
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        setUploadState('Converting HEIC...')
        try {
          const heic2any = (await import('heic2any')).default
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9 // High quality initial conversion
          }) as Blob
          uploadFile = new File([convertedBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        } catch (e) {
          console.error('HEIC conversion failed', e)
          showToast({ type: 'error', title: 'Conversion failed', message: 'Failed to convert HEIC image' })
          setUploading(false)
          setUploadState('')
          return
        }
      }

      // Compress if still larger than 2MB
      if (uploadFile.size > MAX_SIZE) {
        setUploadState('Compressing image...')
        let compressed = false
        const qualities = [0.8, 0.7, 0.6]
        for (const q of qualities) {
          try {
            const attempt = await compressAvatar(uploadFile, q, 1200)
            if (attempt.size <= MAX_SIZE) {
              uploadFile = attempt
              compressed = true
              break
            }
          } catch (e) {
            console.error('Compression failed', e)
          }
        }
        
        // If still too large, final aggressive pass at 800x800
        if (!compressed) {
          try {
            const attempt = await compressAvatar(uploadFile, 0.5, 800)
            if (attempt.size <= MAX_SIZE) {
              uploadFile = attempt
              compressed = true
            }
          } catch (e) {
            console.error('Aggressive compression failed', e)
          }
        }

        if (!compressed && uploadFile.size > MAX_SIZE) {
          showToast({ type: 'error', title: 'Image too large', message: 'Image is too large. Please choose an image smaller than 2 MB.' })
          setUploading(false)
          setUploadState('')
          return
        }
      }
    }

    // Show preview instantly
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(uploadFile)

    setUploadState('Uploading avatar...')

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
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

      setUploadState('Avatar updated successfully')
      showToast({ type: 'success', title: 'Success', message: 'Avatar updated successfully' })
      onUploadSuccess(data.url)

    } catch (err) {
      setError('Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
      setTimeout(() => setUploadState(''), 2000)
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
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Loader2
              size={size * 0.3}
              color="white"
              className="animate-spin"
            />
            {uploadState && (
              <span className="absolute mt-14 text-[9px] text-white font-bold whitespace-nowrap bg-black/60 px-2 py-0.5 rounded-full z-10">
                {uploadState}
              </span>
            )}
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
