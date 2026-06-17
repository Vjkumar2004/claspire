import CreatePostModal from './CreatePost/CreatePostModal'

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
  user?: {
    name: string
    avatarUrl?: string
    isVerified?: boolean
    collegeName?: string
    role?: string
  }
}

export default function PostModal(props: PostModalProps) {
  return <CreatePostModal {...props} />
}
