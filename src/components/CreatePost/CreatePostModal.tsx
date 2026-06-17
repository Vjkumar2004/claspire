import { useState, useEffect } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PostData, PostType, Visibility } from './types'
import DesktopFlow from './DesktopFlow'
import MobileFlow from './MobileFlow'
import { compressImage, needsCompression } from '@/lib/imageCompression'
import { showToast } from '@/components/Toast'
import { usePoints } from '@/contexts/PointsContext'
import { useNotificationPrompt } from '@/contexts/NotificationPromptContext'

export interface CreatePostModalProps {
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
  // We'll optionally pass down user info for the preview, if not available we'll just show placeholders
  user?: {
    name: string
    avatarUrl?: string
    isVerified?: boolean
    collegeName?: string
    role?: string
  }
}

export default function CreatePostModal({
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
  collegeSlug,
  user = { name: 'User' } // Fallback
}: CreatePostModalProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { showAward } = usePoints()
  const { trigger: triggerNotificationPrompt } = useNotificationPrompt()
  
  const [data, setData] = useState<PostData>({
    title: '',
    content: '',
    type: 'doubt',
    visibility: 'public',
    tags: [],
    images: [],
    imageUrls: [],
    removedImageUrls: [],
    isCollegePost: false
  })
  
  const [loading, setLoading] = useState(false)

  // Initialize from editData if present
  useEffect(() => {
    if (isOpen) {
      if (editData) {
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
        setData({
          title: editData.title || '',
          content: editData.content || '',
          type: (editData.type as PostType) || 'doubt',
          visibility: (editData.visibility as Visibility) || 'public',
          tags: editData.tags || [],
          images: [],
          imageUrls: parsedUrls,
          removedImageUrls: [],
          isCollegePost: false
        })
      } else {
        setData({
          title: '',
          content: '',
          type: 'doubt',
          visibility: 'public',
          tags: [],
          images: [],
          imageUrls: [],
          removedImageUrls: [],
          isCollegePost: false
        })
      }
    }
  }, [isOpen, editData])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!data.title.trim() || !data.content.trim() || data.content.trim().length < 20) {
      showToast({ type: 'error', title: 'Invalid Input', message: 'Title and content (min 20 chars) are required.' })
      return
    }

    setLoading(true)

    try {
      // 1. Upload Images First
      const finalImageUrls = [...data.imageUrls]
      
      if (data.images.length > 0) {
        for (const file of data.images) {
          let fileToUpload = file
          
          if (needsCompression(file, 2)) {
            const result = await compressImage(file, {
              maxSizeMB: 2,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              initialQuality: 0.8
            })
            if (result.compressedSize < 2 * 1024 * 1024) {
              fileToUpload = result.compressedFile
            }
          }

          const formData = new FormData()
          formData.append('file', fileToUpload)
          formData.append('type', 'post_image')

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (res.ok) {
            const uploadData = await res.json()
            if (uploadData.url) finalImageUrls.push(uploadData.url)
          }
        }
      }

      // 2. Submit Post
      const isEdit = !!editData
      const endpoint = isEdit ? '/api/posts/edit' : '/api/posts/create'
      const method = isEdit ? 'PUT' : 'POST'
      
      const bodyParams: any = {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type,
        visibility: data.visibility,
        tags: data.tags,
        image_url: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
        is_college_post: data.isCollegePost
      }

      if (isEdit) {
        bodyParams.post_id = editData.id
        if (data.removedImageUrls.length > 0) {
          bodyParams.deleted_image_urls = data.removedImageUrls
        }
      } else {
        bodyParams.community_id = communityId
        bodyParams.is_pinned = false
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      })

      const responseData = await res.json()

      if (!res.ok) {
        showToast({ type: 'error', title: 'Failed to post', message: responseData.error || 'Something went wrong' })
        setLoading(false)
        return
      }

      if (responseData.rpEarned && !isEdit) {
        const pointsMap: Record<string, number> = {
          experience: 10,
          resource: 8,
          referral_hunt: 5,
          doubt: 2,
          discussion: 2
        }
        const msgMap: Record<string, string> = {
          experience: 'Experience shared! ⭐',
          resource: 'Resource shared! 📚',
          referral_hunt: 'Good luck with referral! 🎯',
          doubt: 'Great question! 🌟',
          discussion: 'Discussion started! 💬'
        }
        showAward(pointsMap[data.type] || 2, msgMap[data.type] || 'Post created! ✨')
      }

      onSuccess()
      onClose()
      setTimeout(() => triggerNotificationPrompt(), 500)
    } catch (err) {
      showToast({ type: 'error', title: 'Network error', message: 'Could not complete action. Check connection.' })
    } finally {
      setLoading(false)
    }
  }

  const contextProps = {
    communitySlug,
    communityId,
    userRole,
    editData,
    canPostAsCollege,
    collegeName,
    collegeLogo,
    collegeSlug,
    user,
    onClose,
    onSuccess
  }

  return isDesktop ? (
    <DesktopFlow data={data} setData={setData} context={contextProps} onSubmit={handleSubmit} loading={loading} />
  ) : (
    <MobileFlow data={data} setData={setData} context={contextProps} onSubmit={handleSubmit} loading={loading} />
  )
}
