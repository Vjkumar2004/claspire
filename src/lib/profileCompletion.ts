import { User } from '@/hooks/useAuth'

export const calculateProfileCompletion = (user: User | null): number => {
  if (!user) return 0
  let score = 0
  if (user.full_name) score += 20
  if (user.avatar_url) score += 20
  if (user.headline) score += 15
  if (user.bio) score += 15
  if (user.college_id || user.college) score += 15
  if (user.branch) score += 15
  return Math.min(100, score)
}
