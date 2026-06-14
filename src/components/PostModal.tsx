'use client'
import { useState, useEffect, useRef } from 'react'
import {
  X, Globe, Lock, ChevronDown,
  Loader2, Tag, AlertCircle, ImagePlus
} from 'lucide-react'
import { usePoints } from '@/contexts/PointsContext'
import { compressImage, formatFileSize, needsCompression } from '@/lib/imageCompression'

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  communitySlug: string
  communityId: string
  userRole: string
  editData?: any
}

export default function PostModal({
  isOpen,
  onClose,
  onSuccess,
  communitySlug,
  communityId,
  userRole,
  editData
}: PostModalProps) {
  const { showAward } = usePoints()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'doubt' | 'discussion' | 'experience' | 'referral_hunt' | 'resource'>('doubt')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Image Upload States
  // Image Upload States
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [imageCompressing, setImageCompressing] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([])
  const imageRef = useRef<HTMLInputElement>(null)

  // Populate data if editing
  useEffect(() => {
    if (isOpen && editData) {
      setRemovedImageUrls([])
      setTitle(editData.title || '')
      setContent(editData.content || '')
      setType(editData.type || 'doubt')
      setVisibility(editData.visibility || 'public')
      setTags(editData.tags || [])
      let parsedUrls: string[] = []
      if (editData.image_url) {
        try {
          parsedUrls = typeof editData.image_url === 'string' && editData.image_url.startsWith('[') 
            ? JSON.parse(editData.image_url) 
            : typeof editData.image_url === 'string' ? [editData.image_url] : editData.image_url
        } catch(e) {
          parsedUrls = [editData.image_url]
        }
      }
      setImageUrls(parsedUrls)
      setImagePreviews(parsedUrls)
    } else if (isOpen) {
      // reset if creating new
      setRemovedImageUrls([])
      setTitle('')
      setContent('')
      setType('doubt')
      setVisibility('public')
      setTags([])
      setImages([])
      setImagePreviews([])
      setImageUrls([])
      setError('')
    }
  }, [isOpen, editData])

  if (!isOpen) return null

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const t = tagInput.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
      if (t && !tags.includes(t) 
        && tags.length < 5) {
        setTags([...tags, t])
        setTagInput('')
      }
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images.')
      return
    }

    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/gif', 'image/bmp', 'image/tiff', 'image/x-tiff',
      'image/svg+xml', 'image/heic', 'image/heif', 'image/x-icon',
      'image/vnd.microsoft.icon'
    ]

    const validFiles: File[] = []
    for (const file of files) {
      if (!allowed.includes(file.type)) {
        setError('Please upload a valid image format.')
        return
      }
      validFiles.push(file)
    }

    // Compress images if needed
    setImageCompressing(true)
    setError('')
    try {
      const compressedFiles: File[] = []
      for (const file of validFiles) {
        if (needsCompression(file, 2)) {
          try {
            const result = await compressImage(file, {
              maxSizeMB: 2,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              initialQuality: 0.8
            })
            
            // Check if compressed file is still too large
            if (result.compressedSize >= 2 * 1024 * 1024) {
              setError(`Unable to compress "${file.name}" below 2MB. Please choose a smaller image.`)
              setImageCompressing(false)
              return
            }
            
            compressedFiles.push(result.compressedFile)
          } catch (compressionError) {
            setError(`Failed to compress "${file.name}": ${compressionError instanceof Error ? compressionError.message : 'Unknown error'}`)
            setImageCompressing(false)
            return
          }
        } else {
          compressedFiles.push(file)
        }
      }

      const newPreviews = compressedFiles.map(f => URL.createObjectURL(f))
      setImages(prev => [...prev, ...compressedFiles])
      setImagePreviews(prev => [...prev, ...newPreviews])

      setImageUploading(true)
      try {
        const newUrls: string[] = []
        for (const file of compressedFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'post_image')

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          const data = await res.json()

          if (res.ok && data.url) {
            newUrls.push(data.url)
          } else {
            setError(data.error || 'Upload failed for some images')
          }
        }
        if (newUrls.length > 0) {
          setImageUrls(prev => [...prev, ...newUrls])
        }
      } catch (err) {
        setError('Image upload failed')
      } finally {
        setImageUploading(false)
        if (imageRef.current) imageRef.current.value = ''
      }
    } finally {
      setImageCompressing(false)
    }
  }

  const removeImage = (index: number) => {
    if (index < imageUrls.length) {
      setRemovedImageUrls(prev => [...prev, imageUrls[index]])
    }
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageUrls(prev => prev.filter((_, i) => i !== index))
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!content.trim()) {
      setError('Content is required')
      return
    }
    if (content.trim().length < 20) {
      setError(
        'Content must be at least 20 characters'
      )
      return
    }

    setError('')
    setLoading(true)

    try {
      const isEdit = !!editData
      const endpoint = isEdit ? '/api/posts/edit' : '/api/posts/create'
      const method = isEdit ? 'PUT' : 'POST'
      const bodyParams: any = {
        title: title.trim(),
        content: content.trim(),
        type,
        visibility,
        tags,
        image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
      }
      
      if (isEdit) {
        bodyParams.post_id = editData.id
        if (removedImageUrls.length > 0) {
          bodyParams.deleted_image_urls = removedImageUrls
        }
      } else {
        bodyParams.community_id = communityId
        bodyParams.is_pinned = false
      }

      const res = await fetch(
        endpoint,
        {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyParams)
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(
          data.error || 'Failed to post'
        )
        return
      }

      // Show RP Award
      if (data.rpEarned && !isEdit) {
        if (type === 'experience') showAward(10, 'Experience shared! ⭐')
        else if (type === 'resource') showAward(8, 'Resource shared! 📚')
        else if (type === 'referral_hunt') showAward(5, 'Good luck with referral! 🎯')
        else if (type === 'doubt') showAward(2, 'Great question! 🌟')
        else if (type === 'discussion') showAward(2, 'Discussion started! 💬')
        else showAward(2, 'Post created! ✨')
      }

      // Reset form
      setTitle('')
      setContent('')
      setType('doubt')
      setVisibility('public')
      setTags([])
      setTagInput('')
      setImages([])
      setImagePreviews([])
      setImageUrls([])
      setRemovedImageUrls([])

      onSuccess()
      onClose()

    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(600px, 95vw)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'white',
        borderRadius: 20,
        zIndex: 1001,
        boxShadow:
          '0 25px 60px rgba(0,0,0,0.25)',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1,
          borderRadius: '20px 20px 0 0'
        }}>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-instrument-serif">{editData ? 'Edit Post' : 'Create a Post'}</h2>
            <p style={{
              fontSize: 11,
              color: '#9CA3AF',
              margin: 0,
              fontWeight: 500
            }}>
              Posting to c/{communitySlug}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              border: '1px solid #F3F4F6',
              background: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* Post Type */}
<div style={{ marginBottom: 16 }}>
  <p style={{
    fontSize: 11,
    fontWeight: 700,
    color: '#9CA3AF',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: '0 0 10px'
  }}>
    Post Type
  </p>

  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8
  }}>
    {([
      {
        key: 'doubt',
        icon: '❓',
        label: 'Doubt',
        desc: 'Ask a specific question',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE'
      },
      {
        key: 'discussion',
        icon: '💬',
        label: 'Discussion',
        desc: 'Start a conversation',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE'
      },
      {
        key: 'experience',
        icon: '⭐',
        label: 'Experience',
        desc: 'Share your story',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A'
      },
      {
        key: 'referral_hunt',
        icon: '🎯',
        label: 'Referral Hunt',
        desc: 'Find a referral',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0'
      },
      {
        key: 'resource',
        icon: '📚',
        label: 'Resource',
        desc: 'Share study material',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA'
      }
    ] as any[]).map(t => (
      <button
        key={t.key}
        onClick={() => setType(t.key)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 13px',
          borderRadius: 12,
          border: type === t.key
            ? `1.5px solid ${t.border}` 
            : '1.5px solid #F3F4F6',
          background: type === t.key
            ? t.bg : 'white',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s',
          fontFamily: 'Plus Jakarta Sans'
        }}
      >
        <span style={{ fontSize: 18 }}>
          {t.icon}
        </span>
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: type === t.key
              ? t.color : '#374151'
          }}>
            {t.label}
          </div>
          <div style={{
            fontSize: 10,
            color: '#9CA3AF',
            marginTop: 1,
            fontWeight: 500
          }}>
            {t.desc}
          </div>
        </div>
      </button>
    ))}
  </div>
</div>

          {/* Title */}
          <input
            type="text"
            placeholder={
  type === 'doubt'
    ? 'What is your doubt? Be specific...'
  : type === 'discussion'
    ? 'What do you want to discuss?'
  : type === 'experience'
    ? 'Share your experience title...'
  : type === 'referral_hunt'
    ? 'Looking for referral at [Company]...'
  : 'Resource title or topic...'
}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={150}
            style={{
              width: '100%',
              fontSize: 15,
              fontWeight: 700,
              color: '#111827',
              border: 'none',
              borderBottom: '2px solid #F3F4F6',
              padding: '0 0 12px',
              marginBottom: 16,
              outline: 'none',
              fontFamily: 'Plus Jakarta Sans',
              background: 'transparent',
              boxSizing: 'border-box'
            }}
          />

          {/* Content */}
          <textarea
            placeholder={
  type === 'doubt'
    ? 'Describe your doubt in detail. Include your year, branch, CGPA if relevant. The more specific, the better answers you get!'
  : type === 'discussion'
    ? 'Share your thoughts, opinions or experiences. Ask others what they think...'
  : type === 'experience'
    ? 'Share your complete experience — company, process, tips, what to prepare. This helps your juniors a lot!'
  : type === 'referral_hunt'
    ? 'Include: Company name, Role, Your CGPA, Branch, Batch year, and why you want to work there.'
  : 'Share the resource — include links, key points, or upload material. Mention what it covers and who it helps.'
}
            value={content}
            onChange={e =>
              setContent(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              fontSize: 14,
              color: '#374151',
              border: '1.5px solid #F3F4F6',
              borderRadius: 12,
              padding: '14px',
              outline: 'none',
              fontFamily: 'Plus Jakarta Sans',
              resize: 'vertical',
              lineHeight: 1.7,
              background: '#FAFAFA',
              marginBottom: 16,
              boxSizing: 'border-box'
            }}
          />

          {/* Image Upload Section */}
          <div style={{ marginBottom: 16 }}>
            {imagePreviews.length > 0 && (
              <div style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 8,
                marginBottom: 12,
                scrollSnapType: 'x mandatory'
              }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1.5px solid #EDE9FE',
                    flex: '0 0 auto',
                    width: '160px',
                    height: '120px',
                    scrollSnapAlign: 'start'
                  }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />

                    {imageUploading && index >= imageUrls.length && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}>
                        <Loader2 size={24} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}

                    {!imageUploading && index < imageUrls.length && (
                      <div style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 100,
                        padding: '2px 6px',
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        ✓
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        zIndex: 10
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6B7280',
                  background: '#F9FAFB',
                  border: '1.5px dashed #E5E7EB',
                  borderRadius: 10,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans',
                  transition: 'all 0.15s',
                  width: '100%',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#A78BFA'
                  ;(e.currentTarget as HTMLElement).style.color = '#7C3AED'
                  ;(e.currentTarget as HTMLElement).style.background = '#F5F3FF'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'
                  ;(e.currentTarget as HTMLElement).style.color = '#6B7280'
                  ;(e.currentTarget as HTMLElement).style.background = '#F9FAFB'
                }}
              >
                <ImagePlus size={15} />
                {imagePreviews.length > 0 ? `Add Another Image (${imagePreviews.length}/5)` : 'Add Image (up to 5)'}
              </button>
            )}

            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1.5px solid #F3F4F6',
              borderRadius: 10,
              padding: '8px 12px',
              flexWrap: 'wrap',
              background: '#FAFAFA'
            }}>
              <Tag size={13} color="#A78BFA" />
              {tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#F5F3FF',
                  color: '#7C3AED',
                  padding: '3px 8px',
                  borderRadius: 100,
                  border: '1px solid #EDE9FE'
                }}>
                  #{tag}
                  <span
                    onClick={() => removeTag(tag)}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.6,
                      fontSize: 12
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  placeholder={
                    tags.length === 0
                      ? 'Add tags (Enter to add, max 5)'
                      : 'Add more...'
                  }
                  value={tagInput}
                  onChange={e =>
                    setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    color: '#374151',
                    background: 'transparent',
                    flex: 1,
                    minWidth: 120,
                    fontFamily: 'Plus Jakarta Sans'
                  }}
                />
              )}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20
          }}>
            {[
              {
                key: 'public',
                icon: <Globe size={14} />,
                label: 'Public',
                desc: 'Everyone can see',
                color: '#059669',
                bg: '#ECFDF5',
                border: '#A7F3D0'
              },
              {
                key: 'private',
                icon: <Lock size={14} />,
                label: 'Private',
                desc: 'Only c/' + communitySlug,
                color: '#7C3AED',
                bg: '#F5F3FF',
                border: '#DDD6FE'
              }
            ].map(v => (
              <button
                key={v.key}
                onClick={() =>
                  setVisibility(v.key as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: visibility === v.key
                    ? `1.5px solid ${v.border}` 
                    : '1.5px solid #F3F4F6',
                  background: visibility === v.key
                    ? v.bg : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{
                  color: visibility === v.key
                    ? v.color : '#D1D5DB'
                }}>
                  {v.icon}
                </span>
                <div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: visibility === v.key
                      ? v.color : '#9CA3AF'
                  }}>
                    {v.label}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#9CA3AF',
                    marginTop: 1,
                    fontWeight: 500
                  }}>
                    {v.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Visibility Info */}
          <div style={{
            background: visibility === 'public'
              ? '#F0FDF4' : '#F5F3FF',
            border: `1px solid ${
              visibility === 'public'
                ? '#BBF7D0' : '#DDD6FE'
            }`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start'
          }}>
            <AlertCircle size={13} style={{
              color: visibility === 'public'
                ? '#059669' : '#7C3AED',
              marginTop: 1,
              flexShrink: 0
            }} />
            <p style={{
              fontSize: 11,
              color: visibility === 'public'
                ? '#065F46' : '#4C1D95',
              margin: 0,
              lineHeight: 1.6,
              fontWeight: 500
            }}>
              {visibility === 'public'
                ? 'This post will appear in the global feed and other college students can see and react to it.'
                : `This post is visible only to verified members of c/${communitySlug}. It will not appear in the global feed.` 
              }
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 12,
              color: '#DC2626',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || imageUploading || imageCompressing}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 800,
              color: 'white',
              background: (loading || imageUploading || imageCompressing)
                ? '#C4B5FD'
                : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
              border: 'none',
              borderRadius: 12,
              padding: '14px',
              cursor: (loading || imageUploading || imageCompressing)
                ? 'not-allowed' : 'pointer',
              fontFamily: 'Plus Jakarta Sans',
              boxShadow: (loading || imageUploading || imageCompressing) ? 'none'
                : '0 4px 16px rgba(124,58,237,0.35)',
              transition: 'all 0.2s'
            }}
          >
            {imageCompressing ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Optimizing image...
              </>
            ) : imageUploading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Uploading Image...
              </>
            ) : loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Posting...
              </>
            ) : (
              type === 'doubt' ? 'Post Doubt →'
              : type === 'discussion' ? 'Start Discussion →'
              : type === 'experience' ? 'Share Experience →'
              : type === 'referral_hunt' ? 'Post Referral Hunt →'
              : 'Share Resource →'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </>
  )
}
