export type PostType = 'doubt' | 'discussion' | 'experience' | 'referral_hunt' | 'resource'
export type Visibility = 'public' | 'private'

export interface PostData {
  title: string
  content: string
  type: PostType
  visibility: Visibility
  tags: string[]
  images: File[]
  imageUrls: string[] // For editing existing posts
  removedImageUrls: string[] // For editing existing posts
  isCollegePost: boolean
}

export interface UserContext {
  name: string
  avatarUrl?: string
  isVerified?: boolean
  collegeName?: string
  role?: string
}

export interface PostModalContextType {
  communitySlug: string
  communityId: string
  userRole: string
  editData?: any
  canPostAsCollege?: boolean
  collegeName?: string
  collegeLogo?: string
  collegeSlug?: string
  user: UserContext
  onClose: () => void
  onSuccess: () => void
}

export const POST_TYPES = [
  {
    key: 'doubt',
    icon: '❓',
    label: 'Doubt',
    desc: 'Get help from the community',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.2)'
  },
  {
    key: 'discussion',
    icon: '💬',
    label: 'Discussion',
    desc: 'Start a conversation',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.2)'
  },
  {
    key: 'experience',
    icon: '⭐',
    label: 'Experience',
    desc: 'Share your story',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)'
  },
  {
    key: 'referral_hunt',
    icon: '🎯',
    label: 'Referral Hunt',
    desc: 'Find a referral',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.2)'
  },
  {
    key: 'resource',
    icon: '📚',
    label: 'Resource',
    desc: 'Share material',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.2)'
  }
]
