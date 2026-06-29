import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook to invalidate college-related caches after mutations
 * Use this after admin updates, joins, leaves, or other state changes
 */
export function useInvalidateCollegeCache() {
  const queryClient = useQueryClient()

  const invalidateCollegeList = () => {
    queryClient.invalidateQueries({ queryKey: ['colleges-static'] })
    queryClient.invalidateQueries({ queryKey: ['colleges-dynamic'] })
  }

  const invalidateCollegeDetails = (slug: string) => {
    queryClient.invalidateQueries({ queryKey: ['college', slug] })
  }

  const invalidateAll = (slug?: string) => {
    invalidateCollegeList()
    if (slug) {
      invalidateCollegeDetails(slug)
    }
  }

  return {
    invalidateCollegeList,
    invalidateCollegeDetails,
    invalidateAll,
  }
}
