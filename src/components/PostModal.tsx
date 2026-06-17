'use client'
import { useState, useEffect, useRef } from 'react'
import {
  X, Globe, Lock,
  Loader2, Tag, AlertCircle, ImagePlus,
  User, GraduationCap, Sparkles
} from 'lucide-react'
import { usePoints } from '@/contexts/PointsContext'
import { useNotificationPrompt } from '@/contexts/NotificationPromptContext'
import { compressImage, formatFileSize, needsCompression } from '@/lib/imageCompression'
import { showToast } from '@/components/Toast'

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  communitySlug: string
  communityId: string
  userRole: string
  editData?: any
  canPostAsCollege?: boolean
  collegeName?: string
  collegeLogo?: string
  collegeSlug?: string
}

const postTypes = [
  {
    key: 'doubt',
    icon: '❓',
    label: 'Doubt',
    desc: 'Ask a question',
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
    desc: 'Share material',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA'
  }
]

export default function PostModal({
  isOpen,
  onClose,
  onSuccess,
  communitySlug,
  communityId,
  userRole,
  editData,
  canPostAsCollege,
  collegeName,
  collegeLogo,
  collegeSlug
}: PostModalProps) {
  const { showAward } = usePoints()
  const { trigger: triggerNotificationPrompt } = useNotificationPrompt()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'doubt' | 'discussion' | 'experience' | 'referral_hunt' | 'resource'>('doubt')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [isCollegePost, setIsCollegePost] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [imageCompressing, setImageCompressing] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([])
  const imageRef = useRef<HTMLInputElement>(null)

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
        } catch (e) {
          parsedUrls = [editData.image_url]
        }
      }
      setImageUrls(parsedUrls)
      setImagePreviews(parsedUrls)
    } else if (isOpen) {
      setRemovedImageUrls([])
      setTitle('')
      setContent('')
      setType('doubt')
      setVisibility('public')
      setIsCollegePost(false)
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
      setError('Content must be at least 20 characters')
      return
    }

    setError('')

    const isEdit = !!editData
    const endpoint = isEdit ? '/api/posts/edit' : '/api/posts/create'
    const method = isEdit ? 'PUT' : 'POST'
    const bodyParams: any = {
      title: title.trim(),
      content: content.trim(),
      type,
      visibility,
      tags,
      image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      is_college_post: isCollegePost
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

    onClose()

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      })

      const data = await res.json()

      if (!res.ok) {
        showToast({ type: 'error', title: 'Failed to post', message: data.error || 'Something went wrong' })
        return
      }

      if (data.rpEarned && !isEdit) {
        if (type === 'experience') showAward(10, 'Experience shared! ⭐')
        else if (type === 'resource') showAward(8, 'Resource shared! 📚')
        else if (type === 'referral_hunt') showAward(5, 'Good luck with referral! 🎯')
        else if (type === 'doubt') showAward(2, 'Great question! 🌟')
        else if (type === 'discussion') showAward(2, 'Discussion started! 💬')
        else showAward(2, 'Post created! ✨')
      }

      onSuccess()
      setTimeout(() => triggerNotificationPrompt(), 500)

    } catch {
      showToast({ type: 'error', title: 'Network error', message: 'Could not create post. Check your connection.' })
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.6)',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(680px, 95vw)',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderRadius: 24,
        zIndex: 1001,
        boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,58,237,0.08)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        animation: 'slideUp 0.25s ease'
      }}>

        {/* Gradient Accent Bar */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #7C3AED 0%, #06B6D4 50%, #7C3AED 100%)',
          borderRadius: '24px 24px 0 0'
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 28px 16px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 4,
          background: 'white',
          zIndex: 2,
          borderRadius: '0 0 0 0'
        }}>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              {editData ? '✏️ Edit Post' : '✨ Create Post'}
            </h2>
            <p style={{
              fontSize: 11,
              color: '#94A3B8',
              margin: '3px 0 0',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{
                background: '#F1F5F9',
                padding: '1px 8px',
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 700,
                color: '#475569'
              }}>c/{communitySlug}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#F1F5F9'
                ; (e.currentTarget as HTMLElement).style.color = '#0F172A'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                ; (e.currentTarget as HTMLElement).style.color = '#64748B'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>

          {/* ── Identity Selector ── */}
          {canPostAsCollege && (
            <div style={{
              marginBottom: 24,
              background: 'linear-gradient(135deg, #FAF5FF 0%, #F0FDF4 100%)',
              borderRadius: 16,
              border: '1px solid #E9D5FF',
              padding: 16
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#7C3AED',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: '0 0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Sparkles size={12} />
                Posting as
              </p>
              <div style={{
                display: 'flex',
                gap: 10
              }}>
                {/* Normal User */}
                <button
                  onClick={() => setIsCollegePost(false)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isCollegePost
                      ? '1.5px solid #E2E8F0'
                      : '1.5px solid #7C3AED',
                    background: isCollegePost
                      ? '#FFFFFF'
                      : '#F5F3FF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    boxShadow: isCollegePost ? 'none' : '0 0 0 3px rgba(124,58,237,0.1)'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: isCollegePost ? '#F1F5F9' : '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s'
                  }}>
                    <User size={15} color={isCollegePost ? '#94A3B8' : 'white'} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isCollegePost ? '#94A3B8' : '#4C1D95'
                    }}>
                      Personal Account
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: isCollegePost ? '#CBD5E1' : '#7C3AED',
                      fontWeight: 500,
                      marginTop: 1
                    }}>
                      Post as yourself
                    </div>
                  </div>
                  {!isCollegePost && (
                    <span style={{
                      marginLeft: 'auto',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>
                    </span>
                  )}
                </button>

                {/* College Official */}
                <button
                  onClick={() => setIsCollegePost(true)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isCollegePost
                      ? '1.5px solid #7C3AED'
                      : '1.5px solid #E2E8F0',
                    background: isCollegePost
                      ? '#F5F3FF'
                      : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    boxShadow: isCollegePost ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: isCollegePost ? '#7C3AED' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    overflow: 'hidden'
                  }}>
                    {collegeLogo && isCollegePost ? (
                      <img src={collegeLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <GraduationCap size={15} color={isCollegePost ? 'white' : '#94A3B8'} />
                    )}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isCollegePost ? '#4C1D95' : '#94A3B8'
                    }}>
                      {collegeName || 'College'}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: isCollegePost ? '#7C3AED' : '#CBD5E1',
                      fontWeight: 500,
                      marginTop: 1
                    }}>
                      Official account
                    </div>
                  </div>
                  {isCollegePost && (
                    <span style={{
                      marginLeft: 'auto',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Post Type ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>Post Type</span>
              <span style={{ fontSize: 8, color: '#CBD5E1' }}>— choose one</span>
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8
            }}>
              {postTypes.map(t => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key as any)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: type === t.key
                      ? `1.5px solid ${t.border}`
                      : '1.5px solid #F1F5F9',
                    background: type === t.key
                      ? t.bg
                      : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Plus Jakarta Sans',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (type !== t.key) {
                      (e.currentTarget as HTMLElement).style.background = '#FAFAFA'
                        ; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'
                    }
                  }}
                  onMouseLeave={e => {
                    if (type !== t.key) {
                      (e.currentTarget as HTMLElement).style.background = '#FFFFFF'
                        ; (e.currentTarget as HTMLElement).style.borderColor = '#F1F5F9'
                    }
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{t.icon}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: type === t.key ? t.color : '#64748B',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    {t.label}
                  </span>
                  {type === t.key && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: t.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Title ── */}
          <div style={{ marginBottom: 16 }}>
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
                fontSize: 16,
                fontWeight: 700,
                color: '#0F172A',
                border: '1.5px solid #F1F5F9',
                borderRadius: 14,
                padding: '14px 16px',
                outline: 'none',
                fontFamily: 'Plus Jakarta Sans',
                background: '#F8FAFC',
                boxSizing: 'border-box',
                transition: 'all 0.15s'
              }}
              onFocus={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#7C3AED'
                  ; (e.currentTarget as HTMLElement).style.background = 'white'
                  ; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'
              }}
              onBlur={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#F1F5F9'
                  ; (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                  ; (e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            />
          </div>

          {/* ── Content ── */}
          <div style={{ marginBottom: 16 }}>
            <textarea
              placeholder={
                type === 'doubt'
                  ? 'Describe your doubt in detail. Include your year, branch, CGPA if relevant.'
                  : type === 'discussion'
                    ? 'Share your thoughts, opinions or experiences. Ask others what they think...'
                    : type === 'experience'
                      ? 'Share your complete experience — company, process, tips, what to prepare.'
                      : type === 'referral_hunt'
                        ? 'Include: Company name, Role, Your CGPA, Branch, Batch year, and why you want to work there.'
                        : 'Share the resource — include links, key points, or upload material.'
              }
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                fontSize: 14,
                color: '#334155',
                border: '1.5px solid #F1F5F9',
                borderRadius: 14,
                padding: '14px 16px',
                outline: 'none',
                fontFamily: 'Plus Jakarta Sans',
                resize: 'vertical',
                lineHeight: 1.7,
                background: '#F8FAFC',
                boxSizing: 'border-box',
                transition: 'all 0.15s'
              }}
              onFocus={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#7C3AED'
                  ; (e.currentTarget as HTMLElement).style.background = 'white'
                  ; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'
              }}
              onBlur={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#F1F5F9'
                  ; (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                  ; (e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            />
          </div>

          {/* ── Image Upload ── */}
          <div style={{ marginBottom: 16 }}>
            {imagePreviews.length > 0 && (
              <div style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 8,
                marginBottom: 10,
                scrollSnapType: 'x mandatory'
              }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1.5px solid #EDE9FE',
                    flex: '0 0 auto',
                    width: '140px',
                    height: '100px',
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
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Loader2 size={22} color="white" style={{ animation: 'spin 1s linear infinite' }} />
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
                        color: '#059669'
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
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748B',
                  background: '#F8FAFC',
                  border: '1.5px dashed #E2E8F0',
                  borderRadius: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans',
                  transition: 'all 0.15s',
                  width: '100%'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#A78BFA'
                    ; (e.currentTarget as HTMLElement).style.color = '#7C3AED'
                    ; (e.currentTarget as HTMLElement).style.background = '#F5F3FF'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'
                    ; (e.currentTarget as HTMLElement).style.color = '#64748B'
                    ; (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                }}
              >
                <ImagePlus size={16} />
                {imagePreviews.length > 0 ? `Add Another Image (${imagePreviews.length}/5)` : 'Attach Image'}
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

          {/* ── Tags ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1.5px solid #F1F5F9',
              borderRadius: 12,
              padding: '10px 14px',
              flexWrap: 'wrap',
              background: '#F8FAFC',
              transition: 'all 0.15s'
            }}>
              <Tag size={14} color="#A78BFA" />
              {tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#F5F3FF',
                  color: '#7C3AED',
                  padding: '4px 10px',
                  borderRadius: 100,
                  border: '1px solid #EDE9FE'
                }}>
                  #{tag}
                  <span
                    onClick={() => removeTag(tag)}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.6,
                      fontSize: 13,
                      lineHeight: 1
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
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    color: '#334155',
                    background: 'transparent',
                    flex: 1,
                    minWidth: 120,
                    fontFamily: 'Plus Jakarta Sans'
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Visibility ── */}
          <div style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16
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
                onClick={() => setVisibility(v.key as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: visibility === v.key
                    ? `1.5px solid ${v.border}`
                    : '1.5px solid #F1F5F9',
                  background: visibility === v.key
                    ? v.bg : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: visibility === v.key ? v.color : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s'
                }}>
                  <span style={{ color: visibility === v.key ? 'white' : '#94A3B8' }}>
                    {v.icon}
                  </span>
                </span>
                <div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: visibility === v.key
                      ? v.color : '#64748B'
                  }}>
                    {v.label}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    marginTop: 1,
                    fontWeight: 500
                  }}>
                    {v.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 12,
              color: '#DC2626',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* ── Footer Actions ── */}
          <div style={{
            display: 'flex',
            gap: 12,
            paddingTop: 4
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: '#64748B',
                background: '#F8FAFC',
                border: '1.5px solid #F1F5F9',
                borderRadius: 14,
                padding: '14px',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#F1F5F9'
                  ; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#F8FAFC'
                  ; (e.currentTarget as HTMLElement).style.borderColor = '#F1F5F9'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || imageUploading || imageCompressing}
              style={{
                flex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 800,
                color: 'white',
                background: (loading || imageUploading || imageCompressing)
                  ? '#C4B5FD'
                  : 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                cursor: (loading || imageUploading || imageCompressing)
                  ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans',
                boxShadow: (loading || imageUploading || imageCompressing)
                  ? 'none'
                  : '0 4px 20px rgba(124,58,237,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                if (!loading && !imageUploading && !imageCompressing) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                    ; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(124,58,237,0.4)'
                }
              }}
              onMouseLeave={e => {
                if (!loading && !imageUploading && !imageCompressing) {
                  (e.currentTarget as HTMLElement).style.transform = 'none'
                    ; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(124,58,237,0.3)'
                }
              }}
            >
              {imageCompressing ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Compressing...
                </>
              ) : imageUploading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Posting...
                </>
              ) : isCollegePost ? (
                <>
                  <GraduationCap size={16} />
                  {type === 'doubt' ? 'Post as College →'
                    : type === 'discussion' ? 'Announce →'
                      : type === 'experience' ? 'Share as College →'
                        : type === 'referral_hunt' ? 'Post as College →'
                          : 'Share as College →'}
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
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%) }
          to { opacity: 1; transform: translate(-50%, -50%) }
        }
      `}</style>
    </>
  )
}
